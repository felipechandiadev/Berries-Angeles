import type mysql from 'mysql2/promise';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import {
  createRng,
  resolveSeedRng,
  FULL_PROFILE,
  generateReceptions,
  generateAdvances,
  planSettlements,
  planClientTrayMoves,
  planDispatches,
  validateFullSeed,
  type GeneratedReception,
  type PlannedDispatch,
} from './generators';

type LookupMaps = {
  producersByRut: Map<string, { id: string; name: string }>;
  usersByName: Map<string, { id: string; displayName: string }>;
  varietiesByName: Map<string, { id: number; name: string; defaultPriceCLP: number }>;
  formatsByName: Map<string, { id: number; name: string }>;
  traysByName: Map<string, { id: string; name: string; weight: number }>;
  seasonIds: string[];
  customers: Array<{ id: string; name: string }>;
  /** @deprecated prefer customers[0]; kept for tray-move fallback */
  customerId: string | null;
  activeSeasonId: string | null;
};

async function loadLookups(connection: mysql.Connection): Promise<LookupMaps> {
  const [producers] = await connection.execute<
    (RowDataPacket & { id: string; name: string; dni: string })[]
  >("SELECT id, name, dni FROM producers WHERE deletedAt IS NULL");
  const producersByRut = new Map(
    producers.map((p) => [p.dni, { id: String(p.id), name: p.name }])
  );

  const [users] = await connection.execute<
    (RowDataPacket & { id: string; userName: string; personId: string | null })[]
  >('SELECT id, userName, personId FROM users');
  const usersByName = new Map<string, { id: string; displayName: string }>();
  for (const u of users) {
    let displayName = u.userName;
    if (u.personId) {
      const [persons] = await connection.execute<(RowDataPacket & { name: string })[]>(
        'SELECT name FROM persons WHERE id = ? LIMIT 1',
        [u.personId]
      );
      if (persons[0]?.name) displayName = persons[0].name;
    }
    usersByName.set(u.userName, { id: String(u.id), displayName });
  }

  const [varieties] = await connection.execute<
    (RowDataPacket & { id: number; name: string; qualityPrices: unknown })[]
  >('SELECT id, name, qualityPrices FROM varieties');
  const varietiesByName = new Map(
    varieties.map((v) => {
      let prices: Array<{ priceCLP?: number }> = [];
      try {
        const raw = typeof v.qualityPrices === 'string'
          ? JSON.parse(v.qualityPrices)
          : v.qualityPrices;
        prices = Array.isArray(raw) ? raw : [];
      } catch {
        prices = [];
      }
      const defaultPriceCLP =
        prices.length > 0
          ? Number(prices[0]?.priceCLP ?? 500) || 500
          : 500;
      return [
        v.name,
        { id: Number(v.id), name: v.name, defaultPriceCLP },
      ] as const;
    })
  );

  const [formats] = await connection.execute<
    (RowDataPacket & { id: number; name: string })[]
  >('SELECT id, name FROM formats');
  const formatsByName = new Map(
    formats.map((f) => [f.name, { id: Number(f.id), name: f.name }])
  );

  const [trays] = await connection.execute<
    (RowDataPacket & { id: string; name: string; weight: number })[]
  >('SELECT id, name, weight FROM trays');
  const traysByName = new Map(
    trays.map((t) => [
      t.name,
      { id: String(t.id), name: t.name, weight: Number(t.weight || 0.3) },
    ])
  );

  const [seasons] = await connection.execute<
    (RowDataPacket & { id: string; active: number | boolean })[]
  >('SELECT id, active FROM seasons');
  const seasonIds = seasons.map((s) => String(s.id));
  const activeSeasonId =
    seasons.find((s) => s.active === 1 || s.active === true)?.id != null
      ? String(seasons.find((s) => s.active === 1 || s.active === true)!.id)
      : seasonIds[0] ?? null;

  const [customerRows] = await connection.execute<
    (RowDataPacket & { id: string; personName: string | null })[]
  >(
    `SELECT c.id, p.name AS personName
     FROM customers c
     LEFT JOIN persons p ON p.id = c.personId
     WHERE c.deletedAt IS NULL
     ORDER BY c.id`,
  );
  const customers = customerRows.map((c) => ({
    id: String(c.id),
    name: (c.personName || 'Cliente').trim() || 'Cliente',
  }));
  const customerId = customers[0]?.id ?? null;

  return {
    producersByRut,
    usersByName,
    varietiesByName,
    formatsByName,
    traysByName,
    seasonIds,
    customers,
    customerId,
    activeSeasonId,
  };
}

async function clearHistoryTables(connection: mysql.Connection) {
  await connection.execute('DELETE FROM transaction_relations');
  await connection.execute('DELETE FROM reception_packs');
  await connection.execute('DELETE FROM transactions');
  await connection.execute('DELETE FROM pallets');
}

async function insertReception(
  connection: mysql.Connection,
  reception: GeneratedReception,
  lookups: LookupMaps
): Promise<{ transactionId: string; packIds: number[] } | null> {
  const producer = lookups.producersByRut.get(reception.producerRut);
  const user = lookups.usersByName.get(reception.userName);
  if (!producer || !user) return null;

  const createdAt = new Date(reception.createdAt);
  const packsResolved = [];
  for (const pack of reception.packs) {
    const variety = lookups.varietiesByName.get(pack.variety);
    const format = lookups.formatsByName.get(pack.format);
    const tray = lookups.traysByName.get(pack.tray);
    if (!variety || !format) continue;
    packsResolved.push({ pack, variety, format, tray });
  }
  if (!packsResolved.length) return null;

  const traysInPacks = packsResolved.reduce((s, p) => s + p.pack.traysQuantity, 0);
  const grossWeightTotal = Number(
    packsResolved.reduce((s, p) => s + p.pack.grossWeightKg, 0).toFixed(3)
  );
  const netWeightTotal = Number(
    packsResolved.reduce((s, p) => s + p.pack.netWeightKg, 0).toFixed(3)
  );
  const trayWeightTotal = Number(
    packsResolved.reduce((s, p) => s + p.pack.traysTotalWeightKg, 0).toFixed(3)
  );
  const payableCLP = packsResolved.reduce((s, p) => s + p.pack.totalToPay, 0);

  const [txResult] = await connection.execute<ResultSetHeader>(
    `INSERT INTO transactions (type, direction, amount, unit, seasonId, producerId, clientId, userId, metadata, createdAt, updatedAt)
     VALUES ('RECEPTION', 'OUT', ?, 'CLP', ?, ?, NULL, ?, ?, ?, ?)`,
    [
      reception.totalCLPToPay,
      reception.seasonId,
      producer.id,
      user.id,
      '{}',
      createdAt,
      createdAt,
    ]
  );
  const transactionId = String(txResult.insertId);
  const packIds: number[] = [];
  const metadataPacks: Record<string, unknown>[] = [];
  const varietyIdSet = new Set<number>();
  const formatIdSet = new Set<number>();
  const trayIdSet = new Set<string>();

  for (const resolved of packsResolved) {
    const { pack, variety, format, tray } = resolved;
    const [packResult] = await connection.execute<ResultSetHeader>(
      `INSERT INTO reception_packs (
         receptionTransactionId, varietyId, varietyName, formatId, formatName,
         trayId, trayLabel, traysQuantity, unitTrayWeight, traysTotalWeight,
         grossWeight, netWeightBeforeImpurities, netWeight, impurityPercent,
         pricePerKg, currency, totalToPay, palletAssignments, createdAt, updatedAt
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        transactionId,
        variety.id,
        variety.name,
        format.id,
        format.name,
        tray?.id ?? null,
        pack.trayLabel,
        pack.traysQuantity,
        pack.unitTrayWeightKg,
        pack.traysTotalWeightKg,
        pack.grossWeightKg,
        pack.netWeightBeforeImpuritiesKg,
        pack.netWeightKg,
        pack.impurityPercent,
        pack.pricePerKg,
        pack.currency,
        pack.totalToPay,
        '[]',
        createdAt,
        createdAt,
      ]
    );
    const packId = Number(packResult.insertId);
    packIds.push(packId);

    await connection.execute(
      `INSERT INTO transaction_relations
         (parentTransactionId, childTransactionId, childReceptionPackId, relationType, context, createdAt, updatedAt)
       VALUES (?, NULL, ?, 'RECEPTION_PACK', ?, ?, ?)`,
      [transactionId, packId, `pack ${pack.packNumber}`, createdAt, createdAt]
    );

    varietyIdSet.add(variety.id);
    formatIdSet.add(format.id);
    if (tray?.id) trayIdSet.add(tray.id);

    metadataPacks.push({
      packId,
      packNumber: pack.packNumber,
      varietyId: variety.id,
      varietyName: variety.name,
      formatId: format.id,
      formatName: format.name,
      trayId: tray?.id ?? null,
      trayLabel: pack.trayLabel,
      traysQuantity: pack.traysQuantity,
      unitTrayWeightKg: pack.unitTrayWeightKg,
      traysTotalWeightKg: pack.traysTotalWeightKg,
      grossWeightKg: pack.grossWeightKg,
      netWeightBeforeImpuritiesKg: pack.netWeightBeforeImpuritiesKg,
      netWeightKg: pack.netWeightKg,
      impurityPercent: pack.impurityPercent,
      pricePerKg: pack.pricePerKg,
      currency: pack.currency,
      totalToPay: pack.totalToPay,
      palletAssignments: [],
    });
  }

  const metadata = {
    producerId: producer.id,
    producerName: producer.name,
    guideNumber: reception.guideNumber,
    paymentStatus: reception.paymentStatus,
    varietyIds: Array.from(varietyIdSet),
    formatIds: Array.from(formatIdSet),
    trayTypeIds: Array.from(trayIdSet),
    packs: metadataPacks,
    trayReturns: [],
    totals: {
      packsCount: metadataPacks.length,
      traysInPacks,
      trayReturns: 0,
      grossWeightKg: grossWeightTotal,
      netWeightKg: netWeightTotal,
      trayWeightKg: trayWeightTotal,
      payableCLP,
      payableUSD: 0,
      totalCLPToPay: reception.totalCLPToPay,
    },
    exchangeRate: reception.exchangeRate,
    totalCLPToPay: reception.totalCLPToPay,
    ...(reception.notes ? { notes: reception.notes } : {}),
    changesHistory: [
      {
        changedAt: createdAt.toISOString(),
        changedBy: user.id,
        changedByName: user.displayName,
        summary: 'Registro inicial (seed histórico)',
        details: [],
      },
    ],
  };

  await connection.execute(
    `UPDATE transactions SET metadata = ?, amount = ?, updatedAt = ? WHERE id = ?`,
    [JSON.stringify(metadata), reception.totalCLPToPay, createdAt, transactionId]
  );

  return { transactionId, packIds };
}

async function insertTrayAndPalletOps(
  connection: mysql.Connection,
  reception: GeneratedReception,
  transactionId: string,
  packIds: number[],
  lookups: LookupMaps,
  palletIdByTray: Map<string, number>,
  stockDelta: Map<string, number>
) {
  const producer = lookups.producersByRut.get(reception.producerRut);
  const user = lookups.usersByName.get(reception.userName);
  if (!producer || !user) return;
  const createdAt = new Date(reception.createdAt);

  for (let i = 0; i < reception.packs.length; i++) {
    const pack = reception.packs[i];
    const packId = packIds[i];
    const tray = lookups.traysByName.get(pack.tray);
    if (!tray || !packId) continue;

    // Producer delivers trays with fruit (IN)
    const [trayIn] = await connection.execute<ResultSetHeader>(
      `INSERT INTO transactions (type, direction, amount, unit, seasonId, producerId, clientId, userId, metadata, createdAt, updatedAt)
       VALUES ('TRAY_IN_FROM_PRODUCER', 'IN', ?, 'TRAY', ?, ?, NULL, ?, ?, ?, ?)`,
      [
        pack.traysQuantity,
        reception.seasonId,
        producer.id,
        user.id,
        JSON.stringify({
          trayId: tray.id,
          quantity: pack.traysQuantity,
          receptionTransactionId: transactionId,
          receptionPackId: packId,
          qualityCheckPassed: true,
        }),
        createdAt,
        createdAt,
      ]
    );
    await connection.execute(
      `INSERT INTO transaction_relations
         (parentTransactionId, childTransactionId, childReceptionPackId, relationType, context, createdAt, updatedAt)
       VALUES (?, ?, ?, 'TRAY_RECEPTION', ?, ?, ?)`,
      [
        transactionId,
        String(trayIn.insertId),
        packId,
        `trays ${pack.traysQuantity}`,
        createdAt,
        createdAt,
      ]
    );
    stockDelta.set(tray.id, (stockDelta.get(tray.id) ?? 0) + pack.traysQuantity);
    // Packs no se asignan a pallets en recepción; los pallets nacen en despacho.
  }
}

export async function seedFullHistory(connection: mysql.Connection): Promise<void> {
  console.log('\n🏭 Seeding FULL historical dataset (deterministic generator)...');
  const seed = resolveSeedRng();
  const rng = createRng(seed);
  console.log(`   SEED_RNG=${seed}`);

  const lookups = await loadLookups(connection);
  if (!lookups.producersByRut.size) {
    throw new Error('No producers found; cannot seed full history');
  }
  if (!lookups.varietiesByName.size || !lookups.formatsByName.size) {
    throw new Error('Varieties/formats missing; cannot seed full history');
  }

  await clearHistoryTables(connection);

  const producerRuts = [...lookups.producersByRut.keys()];
  const varieties = [...lookups.varietiesByName.values()].map((v) => ({
    name: v.name,
    defaultPriceCLP: v.defaultPriceCLP,
  }));
  const formats = [...lookups.formatsByName.values()].map((f) => ({ name: f.name }));
  const trays = [...lookups.traysByName.values()].map((t) => ({
    name: t.name,
    weight: t.weight,
  }));

  const asOf = new Date('2026-10-10T18:00:00');
  const receptions = generateReceptions({
    rng,
    producerRuts,
    varieties,
    formats,
    trays,
    asOf,
  });
  const advances = generateAdvances({ rng, receptions, asOf });
  const settlementPlan = planSettlements({ rng, receptions, advances });

  console.log(
    `   Planned: ${receptions.length} receptions, ${advances.length} advances (target ~${Object.values(FULL_PROFILE.receptionsBySeason).reduce((a, b) => a + b, 0)})`
  );

  console.log('   ℹ️  Pallets will be created via seeded dispatches (not standalone)');

  const guideToTxId = new Map<string, string>();
  const palletIdByTray = new Map<string, number>();
  const stockDelta = new Map<string, number>();
  let insertedRec = 0;
  let opsCount = 0;

  for (const reception of receptions) {
    const result = await insertReception(connection, reception, lookups);
    if (!result) continue;
    guideToTxId.set(reception.guideNumber, result.transactionId);
    insertedRec++;
    if (reception.withOps) {
      await insertTrayAndPalletOps(
        connection,
        reception,
        result.transactionId,
        result.packIds,
        lookups,
        palletIdByTray,
        stockDelta
      );
      opsCount++;
    }
  }
  console.log(`   ✓ Inserted ${insertedRec} receptions (${opsCount} with tray/pallet ops)`);

  // Advances
  const advanceKeyToId = new Map<string, string>();
  let insertedAdv = 0;
  for (const advance of advances) {
    const producer = lookups.producersByRut.get(advance.producerRut);
    const user = lookups.usersByName.get(advance.userName);
    if (!producer || !user) continue;

    let bankAccountId: string | null = null;
    const accountNumber = advance.paymentDetails.adminBankAccountNumber;
    if (accountNumber) {
      const [accounts] = await connection.execute<(RowDataPacket & { id: string })[]>(
        'SELECT id FROM admin_bank_accounts WHERE accountNumber = ? LIMIT 1',
        [accountNumber]
      );
      bankAccountId = accounts[0] ? String(accounts[0].id) : null;
      if (
        (advance.paymentMethod === 'TRANSFER' || advance.paymentMethod === 'CHECK') &&
        !bankAccountId
      ) {
        continue;
      }
    }

    const paymentDetails: Record<string, string> = {};
    if (bankAccountId) paymentDetails.bankAccountId = bankAccountId;
    if (advance.paymentDetails.producerAccountId) {
      paymentDetails.producerAccountId = advance.paymentDetails.producerAccountId;
    }
    if (advance.paymentDetails.transactionId) {
      paymentDetails.transactionId = advance.paymentDetails.transactionId;
    }
    if (advance.paymentDetails.checkNumber) {
      paymentDetails.checkNumber = advance.paymentDetails.checkNumber;
    }

    const createdAt = new Date(advance.createdAt);
    const metadata = {
      paymentMethod: advance.paymentMethod,
      paymentDetails,
      ...(advance.notes ? { notes: advance.notes } : {}),
    };

    const [advResult] = await connection.execute<ResultSetHeader>(
      `INSERT INTO transactions (type, direction, amount, unit, seasonId, producerId, clientId, userId, metadata, createdAt, updatedAt)
       VALUES ('ADVANCE', 'OUT', ?, 'CLP', ?, ?, NULL, ?, ?, ?, ?)`,
      [
        advance.amount,
        advance.seasonId,
        producer.id,
        user.id,
        JSON.stringify(metadata),
        createdAt,
        createdAt,
      ]
    );
    const key = `${advance.producerRut}|${advance.createdAt}`;
    advanceKeyToId.set(key, String(advResult.insertId));
    insertedAdv++;
  }
  console.log(`   ✓ Inserted ${insertedAdv} advances`);

  // Settlements: one SETTLEMENT header per producer, relations point child → settlement
  type SeedSettlementBucket = {
    producerId: string;
    seasonId: string;
    userId: string;
    receptionTxIds: string[];
    receptionsTotalCLP: number;
    advances: Array<{ advanceId: string; amount: number }>;
  };
  const settlementBuckets = new Map<string, SeedSettlementBucket>();

  for (const guide of settlementPlan.settledReceptionGuideNumbers) {
    const txId = guideToTxId.get(guide);
    const reception = receptions.find((r) => r.guideNumber === guide);
    const producer = reception ? lookups.producersByRut.get(reception.producerRut) : undefined;
    const user = reception ? lookups.usersByName.get(reception.userName) : undefined;
    if (!txId || !reception || !producer || !user) continue;

    const receptionTotal = reception.totalCLPToPay || 0;
    const bucketKey = producer.id;
    const existing = settlementBuckets.get(bucketKey);
    if (existing) {
      existing.receptionTxIds.push(txId);
      existing.receptionsTotalCLP += receptionTotal;
    } else {
      settlementBuckets.set(bucketKey, {
        producerId: producer.id,
        seasonId: reception.seasonId,
        userId: user.id,
        receptionTxIds: [txId],
        receptionsTotalCLP: receptionTotal,
        advances: [],
      });
    }
  }

  for (const app of settlementPlan.advanceApplications) {
    const key = `${app.producerRut}|${app.createdAt}`;
    const advId = advanceKeyToId.get(key);
    const producer = lookups.producersByRut.get(app.producerRut);
    const advance = advances.find(
      (a) => a.producerRut === app.producerRut && a.createdAt === app.createdAt,
    );
    const user = advance ? lookups.usersByName.get(advance.userName) : undefined;
    if (!advId || !producer || !advance || !user) continue;

    const bucketKey = producer.id;
    const existing = settlementBuckets.get(bucketKey);
    if (existing) {
      existing.advances.push({ advanceId: advId, amount: app.amount });
    } else {
      settlementBuckets.set(bucketKey, {
        producerId: producer.id,
        seasonId: advance.seasonId,
        userId: user.id,
        receptionTxIds: [],
        receptionsTotalCLP: 0,
        advances: [{ advanceId: advId, amount: app.amount }],
      });
    }
  }

  let settledRec = 0;
  let settledAdv = 0;
  let settlementHeaders = 0;
  for (const bucket of settlementBuckets.values()) {
    const advancesAppliedCLP = bucket.advances.reduce((sum, a) => sum + a.amount, 0);
    const netAmountCLP = Math.max(0, bucket.receptionsTotalCLP - advancesAppliedCLP);
    const metadata = {
      status: 'COMPLETA',
      receptionTransactionIds: bucket.receptionTxIds,
      advanceApplications: bucket.advances.map((a) => ({
        transactionId: a.advanceId,
        amount: a.amount,
      })),
      receptionsTotalCLP: bucket.receptionsTotalCLP,
      advancesAppliedCLP,
      netAmountCLP,
    };
    const createdAt = new Date();
    const [settlementResult] = await connection.execute<ResultSetHeader>(
      `INSERT INTO transactions (type, direction, amount, unit, seasonId, producerId, clientId, userId, metadata, createdAt, updatedAt)
       VALUES ('SETTLEMENT', 'OUT', ?, 'CLP', ?, ?, NULL, ?, ?, ?, ?)`,
      [
        netAmountCLP,
        bucket.seasonId,
        bucket.producerId,
        bucket.userId,
        JSON.stringify(metadata),
        createdAt,
        createdAt,
      ],
    );
    const settlementId = String(settlementResult.insertId);
    settlementHeaders++;

    for (const receptionTxId of bucket.receptionTxIds) {
      await connection.execute(
        `INSERT INTO transaction_relations
           (parentTransactionId, childTransactionId, childReceptionPackId, relationType, context, createdAt, updatedAt)
         VALUES (?, ?, NULL, 'RECEPTION_TO_SETTLEMENT', ?, NOW(), NOW())`,
        [receptionTxId, settlementId, JSON.stringify({ source: 'seed' })],
      );
      settledRec++;
    }

    for (const advance of bucket.advances) {
      await connection.execute(
        `INSERT INTO transaction_relations
           (parentTransactionId, childTransactionId, childReceptionPackId, relationType, context, createdAt, updatedAt)
         VALUES (?, ?, NULL, 'ADVANCE_TO_SETTLEMENT', ?, NOW(), NOW())`,
        [
          advance.advanceId,
          settlementId,
          JSON.stringify({ amount: advance.amount, source: 'seed' }),
        ],
      );
      settledAdv++;
    }
  }
  console.log(
    `   ✓ Settlements: ${settlementHeaders} headers, ${settledRec} receptions, ${settledAdv} advances`,
  );

  // Client tray moves
  const clientMoves = planClientTrayMoves({
    rng,
    trayNames: trays.map((t) => t.name),
    asOf,
  });
  const defaultUser = lookups.usersByName.get('admin') || [...lookups.usersByName.values()][0];
  if (lookups.customerId && defaultUser && lookups.activeSeasonId) {
    for (const move of clientMoves) {
      const tray = lookups.traysByName.get(move.trayName);
      if (!tray) continue;
      const type =
        move.direction === 'OUT' ? 'TRAY_OUT_TO_CLIENT' : 'TRAY_IN_FROM_CLIENT';
      const direction = move.direction;
      const createdAt = new Date(move.createdAt);
      await connection.execute(
        `INSERT INTO transactions (type, direction, amount, unit, seasonId, producerId, clientId, userId, metadata, createdAt, updatedAt)
         VALUES (?, ?, ?, 'TRAY', ?, NULL, ?, ?, ?, ?, ?)`,
        [
          type,
          direction,
          move.quantity,
          lookups.activeSeasonId,
          lookups.customerId,
          defaultUser.id,
          JSON.stringify({ trayId: tray.id, quantity: move.quantity, seeded: true }),
          createdAt,
          createdAt,
        ]
      );
      const delta = move.direction === 'OUT' ? -move.quantity : move.quantity;
      stockDelta.set(tray.id, (stockDelta.get(tray.id) ?? 0) + delta);
    }
    console.log(`   ✓ Inserted ${clientMoves.length} client tray moves`);
  }

  // Dispatches → create DISPATCHED pallets linked to each dispatch
  const plannedDispatches = planDispatches({
    rng,
    customers: lookups.customers,
    trays,
    asOf,
  });
  let insertedDisp = 0;
  let insertedPallets = 0;
  for (const plan of plannedDispatches) {
    const n = await insertSeedDispatch(connection, plan, lookups, stockDelta);
    if (n > 0) {
      insertedDisp += 1;
      insertedPallets += n;
    }
  }
  console.log(
    `   ✓ Inserted ${insertedDisp} dispatches (${insertedPallets} pallets created)`,
  );

  // Recalculate tray stocks: base 400 + deltas, floor at 50
  for (const [trayId, delta] of stockDelta.entries()) {
    const stock = Math.max(50, 400 + delta);
    await connection.execute('UPDATE trays SET stock = ?, updatedAt = NOW() WHERE id = ?', [
      stock,
      trayId,
    ]);
  }
  // Ensure trays without moves still have sensible stock
  await connection.execute(
    'UPDATE trays SET stock = 400 WHERE stock IS NULL OR stock < 50'
  );
  console.log(`   ✓ Recalculated tray stocks (${stockDelta.size} trays touched)`);

  const report = await validateFullSeed(connection);
  console.log('\n📋 Full seed validation:');
  console.log(`   receptions=${report.receptionCount} paid=${report.paidCount} pending=${report.pendingCount}`);
  console.log(
    `   advances=${report.advanceCount} dispatches=${report.dispatchCount} palletCount=${report.palletCount} trayMoves=${report.trayMoveCount}`,
  );
  console.log(
    `   settledRecRel=${report.settledReceptionRelations} settledAdvRel=${report.settledAdvanceRelations}`
  );
  console.log(`   bySeason=${JSON.stringify(report.bySeason)}`);
  if (!report.ok) {
    console.warn('   ⚠️  Validation warnings:');
    report.errors.forEach((e) => console.warn(`      - ${e}`));
  } else {
    console.log('   ✓ Validation OK');
  }
}

/** Inserta un despacho y sus pallets (espejo de createDispatch). Retorna N pallets. */
async function insertSeedDispatch(
  connection: mysql.Connection,
  plan: PlannedDispatch,
  lookups: LookupMaps,
  stockDelta: Map<string, number>,
): Promise<number> {
  const tray = lookups.traysByName.get(plan.trayName);
  const user =
    lookups.usersByName.get('admin') || [...lookups.usersByName.values()][0];
  if (!tray || !user) return 0;

  const createdAt = new Date(plan.createdAt);
  const unitTrayWeight = Number(tray.weight) || 0.3;
  const traysTotal = plan.pallets.reduce((s, p) => s + p.traysQuantity, 0);
  const fruitKgTotal = Number(
    plan.pallets.reduce((s, p) => s + p.fruitWeightKg, 0).toFixed(3),
  );
  const grossKgTotal = Number(
    plan.pallets.reduce((s, p) => s + p.grossWeightKg, 0).toFixed(3),
  );
  const saleTotalCLP = Math.round(plan.pricePerKgCLP * fruitKgTotal);

  const [trayOutResult] = await connection.execute<ResultSetHeader>(
    `INSERT INTO transactions
       (type, direction, amount, unit, seasonId, producerId, clientId, userId, metadata, createdAt, updatedAt)
     VALUES ('TRAY_OUT_TO_CLIENT', 'OUT', ?, 'TRAY', ?, NULL, ?, ?, ?, ?, ?)`,
    [
      traysTotal,
      plan.seasonId,
      plan.customerId,
      user.id,
      JSON.stringify({
        trayId: tray.id,
        quantity: traysTotal,
        counterpartyType: 'client',
        counterpartyId: plan.customerId,
        counterpartyName: plan.customerName,
        seeded: true,
        reason: 'Despacho a cliente',
      }),
      createdAt,
      createdAt,
    ],
  );
  const trayOutId = String(trayOutResult.insertId);
  stockDelta.set(tray.id, (stockDelta.get(tray.id) ?? 0) - traysTotal);

  const palletIds: number[] = [];
  const palletLines: Array<{
    emptyWeightKg: number;
    traysQuantity: number;
    grossWeightKg: number;
    fruitWeightKg: number;
    palletId: number;
  }> = [];

  for (const line of plan.pallets) {
    const gross = Number(line.grossWeightKg.toFixed(3));
    const capacity = Math.max(line.traysQuantity, 1);
    const meta = {
      fruitWeightKg: line.fruitWeightKg,
      emptyWeightKg: line.emptyWeightKg,
      traysQuantity: line.traysQuantity,
      grossWeightKg: gross,
      trayId: tray.id,
    };
    const [palletResult] = await connection.execute<ResultSetHeader>(
      `INSERT INTO pallets
         (trayId, traysQuantity, capacity, weight, dispatchWeight, metadata, status, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, 'DISPATCHED', ?, ?)`,
      [
        tray.id,
        line.traysQuantity,
        capacity,
        gross,
        gross,
        JSON.stringify(meta),
        createdAt,
        createdAt,
      ],
    );
    const palletId = Number(palletResult.insertId);
    palletIds.push(palletId);
    palletLines.push({ ...line, grossWeightKg: gross, palletId });
  }

  const dispatchMeta = {
    status: 'COMPLETA',
    customerId: plan.customerId,
    customerName: plan.customerName,
    trayId: tray.id,
    trayName: tray.name,
    unitTrayWeight,
    palletIds,
    trayOutTransactionId: trayOutId,
    palletsCount: palletIds.length,
    traysTotal,
    fruitKgTotal,
    grossKgTotal,
    pricePerKgCLP: plan.pricePerKgCLP,
    saleTotalCLP,
    palletLines,
    seeded: true,
  };

  const [dispatchResult] = await connection.execute<ResultSetHeader>(
    `INSERT INTO transactions
       (type, direction, amount, unit, seasonId, producerId, clientId, userId, metadata, createdAt, updatedAt)
     VALUES ('DISPATCH', 'OUT', ?, 'KG', ?, NULL, ?, ?, ?, ?, ?)`,
    [
      fruitKgTotal,
      plan.seasonId,
      plan.customerId,
      user.id,
      JSON.stringify(dispatchMeta),
      createdAt,
      createdAt,
    ],
  );
  const dispatchId = String(dispatchResult.insertId);

  for (const palletId of palletIds) {
    const [rows] = await connection.execute<
      (RowDataPacket & { metadata: string | null })[]
    >('SELECT metadata FROM pallets WHERE id = ? LIMIT 1', [palletId]);
    let prev: Record<string, unknown> = {};
    try {
      const raw = rows[0]?.metadata;
      prev =
        typeof raw === 'string'
          ? (JSON.parse(raw) as Record<string, unknown>)
          : raw && typeof raw === 'object'
            ? (raw as Record<string, unknown>)
            : {};
    } catch {
      prev = {};
    }
    await connection.execute(
      'UPDATE pallets SET metadata = ?, updatedAt = ? WHERE id = ?',
      [
        JSON.stringify({ ...prev, dispatchTransactionId: dispatchId }),
        createdAt,
        palletId,
      ],
    );
  }

  return palletIds.length;
}
