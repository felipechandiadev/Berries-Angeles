import * as fs from "fs";
import * as path from "path";
import mysql from "mysql2/promise";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { randomUUID } from "crypto";

const VALID_ABILITIES = [
  "USERS_VIEW",
  "USERS_CREATE",
  "USERS_UPDATE",
  "USERS_DELETE",
] as const;

interface SeedConfig {
  host: string;
  user: string;
  password: string;
  database: string;
}

const ENVIRONMENTS: Record<string, SeedConfig> = {
  test: {
    host: process.env.DB_HOST || process.env.DB_HOST_TEST || "localhost",
    user: process.env.DB_USER || process.env.DB_USER_TEST || "root",
    password: process.env.DB_PASSWORD ?? process.env.DB_PASSWORD_TEST ?? "",
    database: process.env.DB_NAME || process.env.DB_NAME_TEST || "berries_angeles",
  },
  production: {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME || "berries_angeles",
  },
};

const RUN_SEED_TIMEOUT_MS = 120000;
const JSON_DIR = path.join(__dirname, "dataToSeed");
const VALID_PALLET_STATUSES = new Set(["AVAILABLE", "CLOSED", "FULL", "DISPATCHED"]);

type PersonSeedRow = {
  id: string;
  name: string;
  dni: string;
  phone?: string;
  mail?: string;
};

type UserSeedRow = {
  id: string;
  userName: string;
  pass: string;
  mail?: string;
  rol: string;
  personId: string;
};

type PermissionSeedRow = {
  userId?: string;
  userName?: string;
  ability: string;
  description?: string;
};

type ProductiveUnitSeedRow = {
  name: string;
  address?: string;
  description?: string | null;
};

type ProducerSeedRow = {
  Nombre: string;
  Rut?: string;
  Dirección?: string;
  UnidadProductiva?: string;
};

type TraySeedRow = {
  name: string;
  weight: number;
  stock?: number;
  active?: boolean;
  id?: string;
};

type FormatSeedRow = {
  name: string;
  description?: string | null;
  active?: boolean;
};

type VarietySeedRow = {
  name: string;
  priceCLP?: number;
  priceUSD?: number;
  currency?: "CLP" | "USD";
};

type StorageSeedRow = {
  id: string;
  name: string;
  type: string;
  capacityPallets?: number;
  location?: string;
  active?: boolean;
};

type PalletSeedRow = {
  storageId?: string;
  storageName?: string;
  trayId?: string;
  trayName?: string;
  traysQuantity?: number;
  capacity: number;
  weightKg?: number;
  dispatchWeightKg?: number;
  status?: "AVAILABLE" | "CLOSED" | "FULL" | "DISPATCHED";
  metadata?: unknown;
  createdAt?: string;
};

type SeasonSeedRow = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  description?: string;
  active?: boolean;
};

type CustomerSeedRow = {
  id: string;
  personId: string;
};

type AuditSeedRow = {
  id: string;
  entityName: string;
  entityId: string;
  userId: string;
  action: string;
  description?: string;
  changes?: any;
};

type AdminBankAccountSeedRow = {
  accountType: string;
  bank: string;
  accountNumber: string;
  alias?: string;
  isActive: boolean;
};

type AdvanceTransactionSeedRow = {
  seasonId: string;
  producerRut: string;
  userName: string;
  amount: number;
  paymentMethod: 'CASH' | 'TRANSFER' | 'CHECK';
  paymentDetails?: {
    adminBankAccountNumber?: string;
    producerAccountId?: string;
    transactionId?: string;
    checkNumber?: string;
  };
  notes?: string;
  createdAt?: string;
};

type ReceptionPackSeedRow = {
  packNumber: number;
  variety: string;
  format: string;
  traysQuantity: number;
  unitTrayWeightKg: number;
  traysTotalWeightKg?: number;
  grossWeightKg: number;
  netWeightBeforeImpuritiesKg: number;
  netWeightKg: number;
  impurityPercent?: number;
  pricePerKg: number;
  currency?: "CLP" | "USD";
  totalToPay: number;
  tray?: string;
  trayLabel?: string;
  notes?: string;
};

type ReceptionTransactionSeedRow = {
  seasonId: string;
  producerRut: string;
  userName: string;
  guideNumber?: string;
  exchangeRate?: number;
  totalCLPToPay?: number;
  createdAt?: string;
  notes?: string;
  packs: ReceptionPackSeedRow[];
};

const loadSeedJson = <T>(fileName: string): T => {
  const filePath = path.join(JSON_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Seed JSON file not found: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, "utf8");
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    throw new Error(`Invalid JSON in ${filePath}: ${(error as Error).message}`);
  }
};

const seedUsers = async (connection: mysql.Connection) => {
  console.log("\n👥 Seeding users from JSON file...");

  const users = loadSeedJson<UserSeedRow[]>("users.json");

  await connection.execute("DELETE FROM users");

  let inserted = 0;

  for (const user of users) {
    const id = (user.id || "").trim();
    const userName = (user.userName || "").trim();
    const pass = (user.pass || "").trim();
    const rol = (user.rol || "").trim();
    const personId = (user.personId || "").trim();
    if (!id || !userName || !pass || !rol || !personId) {
      continue;
    }

    const mail = (user.mail || "").trim() || null;

    await connection.execute(
      `INSERT INTO users (id, userName, pass, mail, rol, personId, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [id, userName, pass, mail, rol, personId]
    );

    inserted++;
  }

  console.log(`   ✓ Inserted ${inserted} users`);
};

const seedPermissions = async (connection: mysql.Connection) => {
  console.log("\n🛡️  Seeding permissions from JSON file...");

  const permissions = loadSeedJson<PermissionSeedRow[]>("permissions.json");

  await connection.execute("DELETE FROM permissions");

  const validAbilities = new Set<string>(VALID_ABILITIES);

  let inserted = 0;
  let skipped = 0;

  for (const permission of permissions) {
    const rawUserId = (permission.userId || "").trim();
    const rawUserName = (permission.userName || "").trim();
    const abilityRaw = (permission.ability || "").trim().toUpperCase();

    if (!abilityRaw || !validAbilities.has(abilityRaw)) {
      skipped++;
      continue;
    }

    let resolvedUserId: string | null = null;

    if (rawUserId && !rawUserId.startsWith("<")) {
      const [userRowsById] = await connection.execute(
        "SELECT id FROM users WHERE id = ? LIMIT 1",
        [rawUserId]
      ) as [RowDataPacket[], any];

      if (userRowsById.length > 0) {
        resolvedUserId = userRowsById[0].id as string;
      }
    }

    if (!resolvedUserId && rawUserName) {
      const [userRowsByName] = await connection.execute(
        "SELECT id FROM users WHERE userName = ? LIMIT 1",
        [rawUserName]
      ) as [RowDataPacket[], any];

      if (userRowsByName.length > 0) {
        resolvedUserId = userRowsByName[0].id as string;
      }
    }

    if (!resolvedUserId) {
      skipped++;
      continue;
    }

    const description = (permission.description || "").trim() || null;

    await connection.execute(
      `INSERT INTO permissions (id, userId, ability, description, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [randomUUID(), resolvedUserId, abilityRaw, description]
    );

    inserted++;
  }

  console.log(`   ✓ Inserted ${inserted} permissions`);

  if (skipped > 0) {
    console.warn(`   ⚠️  Skipped ${skipped} permission rows due to missing data or invalid ability`);
  }
};

const seedPersons = async (connection: mysql.Connection) => {
  console.log("\n👤 Seeding persons from JSON file...");

  const persons = loadSeedJson<PersonSeedRow[]>("persons.json");

  await connection.execute("DELETE FROM persons");

  let inserted = 0;

  for (const person of persons) {
    const id = (person.id || "").trim();
    const name = (person.name || "").trim();
    const dni = (person.dni || "").trim();
    if (!id || !name || !dni) {
      continue;
    }

    const phone = (person.phone || "").trim() || null;
    const mail = (person.mail || "").trim() || null;

    await connection.execute(
      `INSERT INTO persons (id, name, dni, phone, mail, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE
       name = VALUES(name), phone = VALUES(phone), mail = VALUES(mail), updatedAt = NOW()`,
      [id, name, dni, phone, mail]
    );

    inserted++;
  }

  console.log(`   ✓ Inserted ${inserted} persons`);
};

const seedProductiveUnitsAndProducers = async (connection: mysql.Connection) => {
  const productiveUnits = loadSeedJson<ProductiveUnitSeedRow[]>("productiveUnits.json");

  const producers = loadSeedJson<ProducerSeedRow[]>("producers.json");

  await connection.execute("DELETE FROM producers");
  await connection.execute("DELETE FROM productive_units");

  const unitIdByName = new Map<string, string>();
  let insertedUnits = 0;

  for (const unit of productiveUnits) {
    const name = (unit.name || "").trim();
    if (!name) {
      continue;
    }

    const nameKey = name.toLowerCase();
    if (unitIdByName.has(nameKey)) {
      continue;
    }

    const unitId = randomUUID();
    const address = (unit.address || "").trim();
    const description = typeof unit.description === "string" ? unit.description.trim() : null;

    await connection.execute(
      `INSERT INTO productive_units (id, name, address, description, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [unitId, name, address || null, description || null]
    );

    unitIdByName.set(nameKey, unitId);
    insertedUnits++;
  }

  console.log(`   ✓ Inserted ${insertedUnits} productive units`);

  let insertedProducers = 0;
  const missingUnits = new Set<string>();
  const missingPersons = new Set<string>();

  for (const producer of producers) {
    const name = (producer.Nombre || "").trim();
    if (!name) {
      continue;
    }

    const unitName = (producer.UnidadProductiva || "").trim();
    if (!unitName) {
      missingUnits.add(`(sin unidad) → ${name}`);
      continue;
    }

    const unitId = unitIdByName.get(unitName.toLowerCase());
    if (!unitId) {
      missingUnits.add(unitName.trim());
      continue;
    }

    const dni = (producer.Rut || "").trim();
    if (!dni) {
      missingPersons.add(`(sin RUT) → ${name}`);
      continue;
    }

    const [personRows] = await connection.execute(
      "SELECT id FROM persons WHERE dni = ? LIMIT 1",
      [dni]
    ) as [RowDataPacket[], any];

    if (personRows.length === 0) {
      missingPersons.add(`(persona no encontrada) → ${name} (${dni})`);
      continue;
    }

    const personId = personRows[0].id;
    const producerPhone = null;
    const producerMail = null;

    const producerId = randomUUID();

    await connection.execute(
      `INSERT INTO producers (id, name, dni, phone, mail, productiveUnitId, personId, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [producerId, name, dni, producerPhone, producerMail, unitId, personId]
    );

    insertedProducers++;
  }

  console.log(`   ✓ Inserted ${insertedProducers} producers`);

  if (missingUnits.size > 0) {
    const missingList = Array.from(missingUnits);
    const preview = missingList.slice(0, 5).join(", ");
    const suffix = missingList.length > 5 ? ` (+${missingList.length - 5} more)` : "";
    console.warn(
      `   ⚠️  Producers skipped due to missing productive unit reference: ${preview}${suffix}`
    );
  }

  if (missingPersons.size > 0) {
    const missingList = Array.from(missingPersons);
    const preview = missingList.slice(0, 5).join(", ");
    const suffix = missingList.length > 5 ? ` (+${missingList.length - 5} more)` : "";
    console.warn(
      `   ⚠️  Producers skipped due to missing person reference: ${preview}${suffix}`
    );
  }
};

const seedAudits = async (connection: mysql.Connection) => {
  console.log("\n📋 Seeding audits from JSON file...");

  const audits = loadSeedJson<AuditSeedRow[]>("audits.json");

  await connection.execute("DELETE FROM audits");

  let inserted = 0;

  for (const audit of audits) {
    const id = (audit.id || "").trim();
    const entityName = (audit.entityName || "").trim();
    const entityId = (audit.entityId || "").trim();
    const userId = (audit.userId || "").trim();
    const action = (audit.action || "").trim();
    if (!id || !entityName || !entityId || !userId || !action) {
      continue;
    }

    const description = (audit.description || "").trim() || null;
    const changes = audit.changes ? JSON.stringify(audit.changes) : null;

    await connection.execute(
      `INSERT INTO audits (id, entityName, entityId, userId, action, description, changes, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [id, entityName, entityId, userId, action, description, changes]
    );

    inserted++;
  }

  console.log(`   ✓ Inserted ${inserted} audits`);
};

const seedCustomers = async (connection: mysql.Connection) => {
  console.log("\n🛒 Seeding customers from JSON file...");

  const customers = loadSeedJson<CustomerSeedRow[]>("customers.json");

  await connection.execute("DELETE FROM customers");

  let inserted = 0;

  for (const customer of customers) {
    const id = (customer.id || "").trim();
    const personId = (customer.personId || "").trim();
    if (!id || !personId) {
      continue;
    }

    await connection.execute(
      `INSERT INTO customers (id, personId, createdAt, updatedAt)
       VALUES (?, ?, NOW(), NOW())`,
      [id, personId]
    );

    inserted++;
  }

  console.log(`   ✓ Inserted ${inserted} customers`);
};

const seedAdminBankAccounts = async (connection: mysql.Connection) => {
  console.log("\n🏦 Seeding admin bank accounts from JSON file...");

  const adminBankAccounts = loadSeedJson<AdminBankAccountSeedRow[]>("adminBankAccounts.json");

  await connection.execute("DELETE FROM admin_bank_accounts");

  let inserted = 0;

  for (const account of adminBankAccounts) {
    const accountType = (account.accountType || "").trim();
    const bank = (account.bank || "").trim();
    const accountNumber = (account.accountNumber || "").trim();
    if (!accountType || !bank || !accountNumber) {
      continue;
    }

    const alias = (account.alias || "").trim() || null;
    const isActive = account.isActive !== undefined ? Boolean(account.isActive) : true;

    await connection.execute(
      `INSERT INTO admin_bank_accounts (id, accountType, bank, accountNumber, alias, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [randomUUID(), accountType, bank, accountNumber, alias, isActive]
    );

    inserted++;
  }

  console.log(`   ✓ Inserted ${inserted} admin bank accounts`);
};

const seedReceptionTransactions = async (connection: mysql.Connection) => {
  console.log("\n📥 Seeding reception transactions from JSON file...");

  let receptionRows: ReceptionTransactionSeedRow[];
  try {
    receptionRows = loadSeedJson<ReceptionTransactionSeedRow[]>("receptionTransactions.json");
  } catch (error: any) {
    console.warn(
      `   ⚠️  ${
        error?.message ??
        "receptionTransactions.json not found. Skipping reception transactions seed."
      }`
    );
    return;
  }

  if (!Array.isArray(receptionRows) || receptionRows.length === 0) {
    console.log("   ℹ️  No reception transactions to seed.");
    return;
  }

  await connection.execute("DELETE FROM transaction_relations WHERE relationType = 'RECEPTION_PACK'");
  await connection.execute("DELETE FROM reception_packs");
  await connection.execute("DELETE FROM transactions WHERE type = 'RECEPTION'");

  let inserted = 0;

  const missingSeasons = new Set<string>();
  const missingProducers = new Set<string>();
  const missingUsers = new Set<string>();
  const missingVarieties = new Set<string>();
  const missingFormats = new Set<string>();
  const missingTrays = new Set<string>();
  const skippedReceptions = new Set<string>();
  const skippedPacks = new Set<string>();

  for (let index = 0; index < receptionRows.length; index++) {
    const reception = receptionRows[index];
    const receptionLabel = `[${index}]`;

    const packsInput = Array.isArray(reception?.packs) ? reception.packs : [];
    if (!packsInput.length) {
      skippedReceptions.add(`${receptionLabel} → sin packs`);
      continue;
    }

    const seasonId = (reception.seasonId || "").trim();
    if (!seasonId) {
      skippedReceptions.add(`${receptionLabel} → seasonId requerido`);
      continue;
    }

    const [seasonRows] = await connection.execute<(RowDataPacket & { id: string })[]>(
      "SELECT id FROM seasons WHERE id = ? LIMIT 1",
      [seasonId]
    );
    if (!seasonRows.length) {
      missingSeasons.add(`${receptionLabel} → ${seasonId}`);
      continue;
    }

    const producerRut = (reception.producerRut || "").trim();
    if (!producerRut) {
      skippedReceptions.add(`${receptionLabel} → producerRut requerido`);
      continue;
    }

    const [producerRows] = await connection.execute<
      (RowDataPacket & { id: string; name: string })[]
    >("SELECT id, name FROM producers WHERE dni = ? LIMIT 1", [producerRut]);
    if (!producerRows.length) {
      missingProducers.add(`${receptionLabel} → ${producerRut}`);
      continue;
    }
    const producer = producerRows[0];

    const userName = (reception.userName || "").trim();
    if (!userName) {
      skippedReceptions.add(`${receptionLabel} → userName requerido`);
      continue;
    }

    const [userRows] = await connection.execute<
      (RowDataPacket & { id: string; personId: string | null })[]
    >("SELECT id, personId FROM users WHERE userName = ? LIMIT 1", [userName]);
    if (!userRows.length) {
      missingUsers.add(`${receptionLabel} → ${userName}`);
      continue;
    }
    const user = userRows[0];

    let userDisplayName = userName;
    if (user.personId) {
      const [personRows] = await connection.execute<(RowDataPacket & { name: string })[]>(
        "SELECT name FROM persons WHERE id = ? LIMIT 1",
        [user.personId]
      );
      if (personRows.length && personRows[0].name) {
        userDisplayName = personRows[0].name;
      }
    }

    type ResolvedPack = {
      packNumber: number;
      varietyId: number;
      varietyName: string;
      formatId: number;
      formatName: string;
      trayId: string | null;
      trayLabel: string | null;
      traysQuantity: number;
      unitTrayWeight: number;
      traysTotalWeight: number;
      grossWeight: number;
      netWeightBeforeImpurities: number;
      netWeight: number;
      impurityPercent: number;
      pricePerKg: number;
      currency: "CLP" | "USD";
      totalToPay: number;
    };

    const resolvedPacks: ResolvedPack[] = [];

    for (let packIndex = 0; packIndex < packsInput.length; packIndex++) {
      const pack = packsInput[packIndex];
      const packLabel = `${receptionLabel}#${packIndex}`;

      const packNumberRaw = pack?.packNumber ?? packIndex + 1;
      const packNumber = Number(packNumberRaw);
      if (!Number.isFinite(packNumber) || packNumber <= 0) {
        skippedPacks.add(`${packLabel} → packNumber inválido`);
        continue;
      }

      const varietyName = (pack?.variety || "").trim();
      if (!varietyName) {
        skippedPacks.add(`${packLabel} → variedad requerida`);
        continue;
      }

      const [varietyRows] = await connection.execute<
        (RowDataPacket & { id: number; name: string })[]
      >("SELECT id, name FROM varieties WHERE name = ? LIMIT 1", [varietyName]);
      if (!varietyRows.length) {
        missingVarieties.add(`${packLabel} → ${varietyName}`);
        continue;
      }
      const variety = varietyRows[0];

      const formatName = (pack?.format || "").trim();
      if (!formatName) {
        skippedPacks.add(`${packLabel} → formato requerido`);
        continue;
      }

      const [formatRows] = await connection.execute<
        (RowDataPacket & { id: number; name: string })[]
      >("SELECT id, name FROM formats WHERE name = ? LIMIT 1", [formatName]);
      if (!formatRows.length) {
        missingFormats.add(`${packLabel} → ${formatName}`);
        continue;
      }
      const format = formatRows[0];

      let trayId: string | null = null;
      let trayLabel: string | null = null;
      const trayNameRaw = (pack?.tray || "").trim();
      if (trayNameRaw) {
        const [trayRows] = await connection.execute<
          (RowDataPacket & { id: string; name: string })[]
        >("SELECT id, name FROM trays WHERE name = ? LIMIT 1", [trayNameRaw]);
        if (trayRows.length) {
          trayId = trayRows[0].id;
          trayLabel = trayRows[0].name;
        } else {
          missingTrays.add(`${packLabel} → ${trayNameRaw}`);
        }
      }
      if (pack?.trayLabel) {
        const customLabel = (pack.trayLabel || "").trim();
        if (customLabel) {
          trayLabel = customLabel;
        }
      }

      const traysQuantity = Number(pack?.traysQuantity ?? 0);
      if (!Number.isFinite(traysQuantity) || traysQuantity <= 0) {
        skippedPacks.add(`${packLabel} → traysQuantity inválido`);
        continue;
      }

      const unitTrayWeight = Number(pack?.unitTrayWeightKg ?? 0);
      if (!Number.isFinite(unitTrayWeight) || unitTrayWeight < 0) {
        skippedPacks.add(`${packLabel} → unitTrayWeightKg inválido`);
        continue;
      }

      let traysTotalWeight = Number(
        pack?.traysTotalWeightKg ?? traysQuantity * unitTrayWeight
      );
      if (!Number.isFinite(traysTotalWeight)) {
        traysTotalWeight = traysQuantity * unitTrayWeight;
      }
      traysTotalWeight = Number(traysTotalWeight.toFixed(3));

      const grossWeight = Number(pack?.grossWeightKg ?? 0);
      if (!Number.isFinite(grossWeight) || grossWeight <= 0) {
        skippedPacks.add(`${packLabel} → grossWeightKg inválido`);
        continue;
      }

      const netWeightBeforeImpurities = Number(pack?.netWeightBeforeImpuritiesKg ?? 0);
      if (!Number.isFinite(netWeightBeforeImpurities) || netWeightBeforeImpurities < 0) {
        skippedPacks.add(`${packLabel} → netWeightBeforeImpuritiesKg inválido`);
        continue;
      }

      const netWeight = Number(pack?.netWeightKg ?? 0);
      if (!Number.isFinite(netWeight) || netWeight < 0) {
        skippedPacks.add(`${packLabel} → netWeightKg inválido`);
        continue;
      }

      const pricePerKg = Number(pack?.pricePerKg ?? 0);
      if (!Number.isFinite(pricePerKg) || pricePerKg < 0) {
        skippedPacks.add(`${packLabel} → pricePerKg inválido`);
        continue;
      }

      const totalToPay = Number(pack?.totalToPay ?? 0);
      if (!Number.isFinite(totalToPay) || totalToPay <= 0) {
        skippedPacks.add(`${packLabel} → totalToPay inválido`);
        continue;
      }

      const currency: "CLP" | "USD" =
        (pack?.currency || "").toString().toUpperCase() === "USD" ? "USD" : "CLP";

      const impurityPercentRaw = Number(pack?.impurityPercent ?? 0);
      const impurityPercent = Number(
        (Number.isFinite(impurityPercentRaw) ? impurityPercentRaw : 0).toFixed(3)
      );

      resolvedPacks.push({
        packNumber: Number(packNumber),
        varietyId: Number(variety.id),
        varietyName: variety.name,
        formatId: Number(format.id),
        formatName: format.name,
        trayId,
        trayLabel,
        traysQuantity: Number(traysQuantity),
        unitTrayWeight: Number(unitTrayWeight.toFixed(3)),
        traysTotalWeight,
        grossWeight: Number(grossWeight.toFixed(3)),
        netWeightBeforeImpurities: Number(netWeightBeforeImpurities.toFixed(3)),
        netWeight: Number(netWeight.toFixed(3)),
        impurityPercent,
        pricePerKg: Number(pricePerKg.toFixed(3)),
        currency,
        totalToPay: Number(totalToPay.toFixed(2)),
      });
    }

    if (!resolvedPacks.length) {
      skippedReceptions.add(`${receptionLabel} → sin packs válidos`);
      continue;
    }

    const exchangeRateParsed = Number(reception.exchangeRate ?? 0);
    const exchangeRate = Number.isFinite(exchangeRateParsed)
      ? Math.max(0, exchangeRateParsed)
      : 0;

    const payableCLPRaw = resolvedPacks
      .filter((pack) => pack.currency === "CLP")
      .reduce((sum, pack) => sum + pack.totalToPay, 0);
    const payableUSDRaw = resolvedPacks
      .filter((pack) => pack.currency === "USD")
      .reduce((sum, pack) => sum + pack.totalToPay, 0);

    const payableCLP = Number(payableCLPRaw.toFixed(2));
    const payableUSD = Number(payableUSDRaw.toFixed(2));

    let totalCLPToPay = Number(reception.totalCLPToPay ?? NaN);
    if (!Number.isFinite(totalCLPToPay) || totalCLPToPay <= 0) {
      totalCLPToPay = payableCLP + payableUSD * exchangeRate;
    }
    totalCLPToPay = Number(totalCLPToPay.toFixed(2));

    const createdAt = (() => {
      if (reception.createdAt) {
        const parsed = new Date(reception.createdAt);
        if (!Number.isNaN(parsed.getTime())) {
          return parsed;
        }
      }
      return new Date();
    })();

    const guideNumber = (reception.guideNumber || "").trim() || null;
    const metadataNotes = (reception.notes || "").trim() || undefined;

    const traysInPacks = resolvedPacks.reduce(
      (sum, pack) => sum + pack.traysQuantity,
      0
    );
    const grossWeightTotal = Number(
      resolvedPacks.reduce((sum, pack) => sum + pack.grossWeight, 0).toFixed(3)
    );
    const netWeightTotal = Number(
      resolvedPacks.reduce((sum, pack) => sum + pack.netWeight, 0).toFixed(3)
    );
    const trayWeightTotal = Number(
      resolvedPacks.reduce((sum, pack) => sum + pack.traysTotalWeight, 0).toFixed(3)
    );

    let transactionId: number | null = null;

    try {
      const [transactionResult] = await connection.execute<ResultSetHeader>(
        `INSERT INTO transactions (type, direction, amount, unit, seasonId, producerId, clientId, userId, metadata, createdAt, updatedAt)
         VALUES ('RECEPTION', 'OUT', ?, 'CLP', ?, ?, NULL, ?, ?, ?, ?)`
          /* sql */,
        [
          totalCLPToPay,
          seasonId,
          producer.id,
          user.id,
          "{}",
          createdAt,
          createdAt,
        ]
      );

      transactionId = Number(transactionResult.insertId);
      const transactionIdStr = String(transactionId);

      const metadataPacks: Array<Record<string, any>> = [];
      const varietyIdSet = new Set<number>();
      const formatIdSet = new Set<number>();
      const trayIdSet = new Set<string>();

      for (const resolvedPack of resolvedPacks) {
        const [packResult] = await connection.execute<ResultSetHeader>(
          `INSERT INTO reception_packs (
             receptionTransactionId,
             varietyId,
             varietyName,
             formatId,
             formatName,
             trayId,
             trayLabel,
             traysQuantity,
             unitTrayWeight,
             traysTotalWeight,
             grossWeight,
             netWeightBeforeImpurities,
             netWeight,
             impurityPercent,
             pricePerKg,
             currency,
             totalToPay,
             palletAssignments,
             createdAt,
             updatedAt
           )
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            /* sql */,
          [
            transactionIdStr,
            resolvedPack.varietyId,
            resolvedPack.varietyName,
            resolvedPack.formatId,
            resolvedPack.formatName,
            resolvedPack.trayId,
            resolvedPack.trayLabel,
            resolvedPack.traysQuantity,
            resolvedPack.unitTrayWeight,
            resolvedPack.traysTotalWeight,
            resolvedPack.grossWeight,
            resolvedPack.netWeightBeforeImpurities,
            resolvedPack.netWeight,
            resolvedPack.impurityPercent,
            resolvedPack.pricePerKg,
            resolvedPack.currency,
            resolvedPack.totalToPay,
            "[]",
            createdAt,
            createdAt,
          ]
        );

        const packId = Number(packResult.insertId);

        await connection.execute(
          `INSERT INTO transaction_relations (
             parentTransactionId,
             childTransactionId,
             childReceptionPackId,
             relationType,
             context,
             createdAt,
             updatedAt
           )
           VALUES (?, NULL, ?, 'RECEPTION_PACK', ?, ?, ?)`
            /* sql */,
          [
            transactionIdStr,
            packId,
            `pack ${resolvedPack.packNumber}`,
            createdAt,
            createdAt,
          ]
        );

        varietyIdSet.add(resolvedPack.varietyId);
        formatIdSet.add(resolvedPack.formatId);
        if (resolvedPack.trayId) {
          trayIdSet.add(String(resolvedPack.trayId));
        }

        metadataPacks.push({
          packId,
          packNumber: resolvedPack.packNumber,
          varietyId: resolvedPack.varietyId,
          varietyName: resolvedPack.varietyName,
          formatId: resolvedPack.formatId,
          formatName: resolvedPack.formatName,
          trayId: resolvedPack.trayId,
          trayLabel: resolvedPack.trayLabel,
          traysQuantity: resolvedPack.traysQuantity,
          unitTrayWeightKg: resolvedPack.unitTrayWeight,
          traysTotalWeightKg: resolvedPack.traysTotalWeight,
          grossWeightKg: resolvedPack.grossWeight,
          netWeightBeforeImpuritiesKg: resolvedPack.netWeightBeforeImpurities,
          netWeightKg: resolvedPack.netWeight,
          impurityPercent: resolvedPack.impurityPercent,
          pricePerKg: resolvedPack.pricePerKg,
          currency: resolvedPack.currency,
          totalToPay: resolvedPack.totalToPay,
          palletAssignments: [],
        });
      }

      const metadata = {
        producerId: producer.id,
        producerName: producer.name,
        guideNumber,
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
          payableUSD,
          totalCLPToPay,
        },
        exchangeRate,
        totalCLPToPay,
        notes: metadataNotes,
        changesHistory: [
          {
            changedAt: createdAt.toISOString(),
            changedBy: user.id,
            changedByName: userDisplayName,
            summary: "Registro inicial (seed)",
            details: [
              { field: "exchangeRate", previousValue: null, newValue: exchangeRate },
              { field: "totalCLPToPay", previousValue: null, newValue: totalCLPToPay },
            ],
          },
        ],
      } as Record<string, any>;

      if (!metadata.notes) {
        delete metadata.notes;
      }

      await connection.execute(
        `UPDATE transactions
         SET metadata = ?, amount = ?, updatedAt = ?
         WHERE id = ?` /* sql */,
        [JSON.stringify(metadata), totalCLPToPay, createdAt, transactionIdStr]
      );

      inserted++;
    } catch (error: any) {
      if (transactionId !== null) {
        await connection.execute("DELETE FROM transactions WHERE id = ?", [transactionId]);
      }
      console.warn(
        `   ⚠️  Reception ${receptionLabel} skipped due to error: ${error?.message ?? error}`
      );
    }
  }

  if (missingSeasons.size > 0) {
    const preview = Array.from(missingSeasons).slice(0, 5).join(", ");
    const suffix = missingSeasons.size > 5 ? ` (+${missingSeasons.size - 5} more)` : "";
    console.warn(
      `   ⚠️  Receptions skipped: missing seasons ${preview}${suffix}`
    );
  }

  if (missingProducers.size > 0) {
    const preview = Array.from(missingProducers).slice(0, 5).join(", ");
    const suffix = missingProducers.size > 5 ? ` (+${missingProducers.size - 5} more)` : "";
    console.warn(
      `   ⚠️  Receptions skipped: missing producers ${preview}${suffix}`
    );
  }

  if (missingUsers.size > 0) {
    const preview = Array.from(missingUsers).slice(0, 5).join(", ");
    const suffix = missingUsers.size > 5 ? ` (+${missingUsers.size - 5} more)` : "";
    console.warn(
      `   ⚠️  Receptions skipped: missing users ${preview}${suffix}`
    );
  }

  if (missingVarieties.size > 0) {
    const preview = Array.from(missingVarieties).slice(0, 5).join(", ");
    const suffix = missingVarieties.size > 5 ? ` (+${missingVarieties.size - 5} more)` : "";
    console.warn(
      `   ⚠️  Packs skipped: varieties not found ${preview}${suffix}`
    );
  }

  if (missingFormats.size > 0) {
    const preview = Array.from(missingFormats).slice(0, 5).join(", ");
    const suffix = missingFormats.size > 5 ? ` (+${missingFormats.size - 5} more)` : "";
    console.warn(
      `   ⚠️  Packs skipped: formats not found ${preview}${suffix}`
    );
  }

  if (missingTrays.size > 0) {
    const preview = Array.from(missingTrays).slice(0, 5).join(", ");
    const suffix = missingTrays.size > 5 ? ` (+${missingTrays.size - 5} more)` : "";
    console.warn(
      `   ⚠️  Packs seeded without tray reference (tray not found): ${preview}${suffix}`
    );
  }

  if (skippedPacks.size > 0) {
    const preview = Array.from(skippedPacks).slice(0, 5).join(", ");
    const suffix = skippedPacks.size > 5 ? ` (+${skippedPacks.size - 5} more)` : "";
    console.warn(
      `   ⚠️  Packs skipped due to invalid data: ${preview}${suffix}`
    );
  }

  if (skippedReceptions.size > 0) {
    const preview = Array.from(skippedReceptions).slice(0, 5).join(", ");
    const suffix = skippedReceptions.size > 5 ? ` (+${skippedReceptions.size - 5} more)` : "";
    console.warn(
      `   ⚠️  Receptions skipped due to missing data: ${preview}${suffix}`
    );
  }

  console.log(`   ✓ Inserted ${inserted} reception transactions`);
};

const seedAdvanceTransactions = async (connection: mysql.Connection) => {
  console.log("\n💸 Seeding advance transactions from JSON file...");

  let advanceRows: AdvanceTransactionSeedRow[];
  try {
    advanceRows = loadSeedJson<AdvanceTransactionSeedRow[]>("advanceTransactions.json");
  } catch (error: any) {
    console.warn(`   ⚠️  ${error?.message ?? 'advanceTransactions.json not found. Skipping advance transactions seed.'}`);
    return;
  }

  if (!Array.isArray(advanceRows) || advanceRows.length === 0) {
    console.log("   ℹ️  No advance transactions to seed.");
    return;
  }

  let inserted = 0;

  for (let index = 0; index < advanceRows.length; index++) {
    const advance = advanceRows[index];
    const amount = Number(advance.amount ?? 0);
    if (!Number.isInteger(amount) || amount <= 0) {
      console.warn(`   ⚠️  Advance transaction [${index}] skipped: amount must be an integer greater than zero.`);
      continue;
    }

    const seasonId = (advance.seasonId || "").trim();
    if (!seasonId) {
      console.warn(`   ⚠️  Advance transaction [${index}] skipped: seasonId is required.`);
      continue;
    }

    const producerRut = (advance.producerRut || "").trim();
    if (!producerRut) {
      console.warn(`   ⚠️  Advance transaction [${index}] skipped: producerRut is required.`);
      continue;
    }

    const userName = (advance.userName || "").trim();
    if (!userName) {
      console.warn(`   ⚠️  Advance transaction [${index}] skipped: userName is required.`);
      continue;
    }

    const paymentMethodRaw = (advance.paymentMethod || '').toUpperCase();
    if (!['CASH', 'TRANSFER', 'CHECK'].includes(paymentMethodRaw)) {
      console.warn(`   ⚠️  Advance transaction [${index}] skipped: unsupported payment method "${advance.paymentMethod}".`);
      continue;
    }
    const paymentMethod = paymentMethodRaw as AdvanceTransactionSeedRow['paymentMethod'];

    const [seasonRows] = await connection.execute<(RowDataPacket & { id: string })[]>(
      "SELECT id FROM seasons WHERE id = ? LIMIT 1",
      [seasonId]
    );
    if (!seasonRows.length) {
      console.warn(`   ⚠️  Advance transaction [${index}] skipped: season ${seasonId} not found.`);
      continue;
    }

    const [producerRows] = await connection.execute<(RowDataPacket & { id: string })[]>(
      "SELECT id FROM producers WHERE dni = ? LIMIT 1",
      [producerRut]
    );
    if (!producerRows.length) {
      console.warn(`   ⚠️  Advance transaction [${index}] skipped: producer with RUT ${producerRut} not found.`);
      continue;
    }

    const [userRows] = await connection.execute<(RowDataPacket & { id: string })[]>(
      "SELECT id FROM users WHERE userName = ? LIMIT 1",
      [userName]
    );
    if (!userRows.length) {
      console.warn(`   ⚠️  Advance transaction [${index}] skipped: user ${userName} not found.`);
      continue;
    }

    let bankAccountId: string | null = null;
    const accountNumber = advance.paymentDetails?.adminBankAccountNumber?.trim();
    if (accountNumber) {
      const [accountRows] = await connection.execute<(RowDataPacket & { id: string })[]>(
        "SELECT id FROM admin_bank_accounts WHERE accountNumber = ? LIMIT 1",
        [accountNumber]
      );
      if (accountRows.length) {
        bankAccountId = accountRows[0].id;
      } else {
        console.warn(`   ⚠️  Advance transaction [${index}] skipped: admin bank account number ${accountNumber} not found.`);
        continue;
      }
    }

    if (paymentMethod === 'TRANSFER') {
      if (!bankAccountId) {
        console.warn(`   ⚠️  Advance transaction [${index}] skipped: transfer requires admin bank account number.`);
        continue;
      }
      if (!advance.paymentDetails?.producerAccountId?.trim()) {
        console.warn(`   ⚠️  Advance transaction [${index}] skipped: transfer requires producerAccountId.`);
        continue;
      }
    }

    if (paymentMethod === 'CHECK') {
      if (!bankAccountId) {
        console.warn(`   ⚠️  Advance transaction [${index}] skipped: check requires admin bank account number.`);
        continue;
      }
      if (!advance.paymentDetails?.checkNumber?.trim()) {
        console.warn(`   ⚠️  Advance transaction [${index}] skipped: check requires checkNumber.`);
        continue;
      }
    }

    const paymentDetails: Record<string, string> = {};
    if (bankAccountId) {
      paymentDetails.bankAccountId = bankAccountId;
    }
    if (advance.paymentDetails?.producerAccountId?.trim()) {
      paymentDetails.producerAccountId = advance.paymentDetails.producerAccountId.trim();
    }
    if (advance.paymentDetails?.transactionId?.trim()) {
      paymentDetails.transactionId = advance.paymentDetails.transactionId.trim();
    }
    if (advance.paymentDetails?.checkNumber?.trim()) {
      paymentDetails.checkNumber = advance.paymentDetails.checkNumber.trim();
    }

    const metadata = {
      paymentMethod,
      paymentDetails,
      ...(advance.notes?.trim() ? { notes: advance.notes.trim() } : {}),
    };

    let createdAt = advance.createdAt ? new Date(advance.createdAt) : new Date();
    if (Number.isNaN(createdAt.getTime())) {
      createdAt = new Date();
    }

    await connection.execute(
      `INSERT INTO transactions (type, direction, amount, unit, seasonId, producerId, clientId, userId, metadata, createdAt, updatedAt)
       VALUES ('ADVANCE', 'OUT', ?, 'CLP', ?, ?, NULL, ?, ?, ?, ?)`,
      [
        amount,
        seasonRows[0].id,
        producerRows[0].id,
        userRows[0].id,
        JSON.stringify(metadata),
        createdAt,
        createdAt,
      ]
    );

    inserted++;
  }

  console.log(`   ✓ Inserted ${inserted} advance transactions`);
};

const seedSeasons = async (connection: mysql.Connection) => {
  console.log("\n🌱 Seeding seasons from JSON file...");

  const seasons = loadSeedJson<SeasonSeedRow[]>("seasons.json");

  await connection.execute("DELETE FROM seasons");

  let inserted = 0;

  for (const season of seasons) {
    const id = (season.id || "").trim();
    const name = (season.name || "").trim();
    const startDate = (season.startDate || "").trim();
    const endDate = (season.endDate || "").trim();
    if (!id || !name || !startDate || !endDate) {
      continue;
    }

    const description = (season.description || "").trim() || null;
    const active = season.active !== undefined ? Boolean(season.active) : false;

    await connection.execute(
      `INSERT INTO seasons (id, name, startDate, endDate, description, active, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [id, name, startDate, endDate, description, active]
    );

    inserted++;
  }

  console.log(`   ✓ Inserted ${inserted} seasons`);
};

const seedStorages = async (connection: mysql.Connection) => {
  console.log("\n🏢 Seeding storages from JSON file...");

  const storages = loadSeedJson<StorageSeedRow[]>("storages.json");

  await connection.execute("DELETE FROM storages");

  let inserted = 0;

  for (const storage of storages) {
    const id = (storage.id || "").trim();
    const name = (storage.name || "").trim();
    const type = (storage.type || "").trim();
    if (!id || !name || !type) {
      continue;
    }

    const capacityPallets = Number.isFinite(storage.capacityPallets) ? Number(storage.capacityPallets) : null;
    const location = (storage.location || "").trim() || null;
    const active = storage.active !== undefined ? Boolean(storage.active) : true;

    await connection.execute(
      `INSERT INTO storages (id, name, type, capacityPallets, location, active, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [id, name, type, capacityPallets, location, active]
    );

    inserted++;
  }

  console.log(`   ✓ Inserted ${inserted} storages`);
};

const seedPallets = async (connection: mysql.Connection) => {
  console.log("\n🪵 Seeding pallets from JSON file...");

  let pallets: PalletSeedRow[];
  try {
    pallets = loadSeedJson<PalletSeedRow[]>("pallets.json");
  } catch (error: any) {
    console.log(
      `   ℹ️  ${
        error?.message ?? "pallets.json not found. Skipping pallets seed."
      }`
    );
    return;
  }

  if (!Array.isArray(pallets) || pallets.length === 0) {
    await connection.execute("DELETE FROM pallets");
    console.log("   ℹ️  No pallets to seed.");
    return;
  }

  await connection.execute("DELETE FROM pallets");

  let inserted = 0;
  const missingStorages = new Set<string>();
  const missingTrays = new Set<string>();
  const invalidRows = new Set<string>();

  for (let index = 0; index < pallets.length; index++) {
    const pallet = pallets[index];
    const label = `[${index}]`;

    let storageId: string | null = null;
    const storageIdRaw = (pallet.storageId || "").trim();
    if (storageIdRaw) {
      const [storageRows] = await connection.execute<
        (RowDataPacket & { id: string })[]
      >("SELECT id FROM storages WHERE id = ? LIMIT 1", [storageIdRaw]);
      if (storageRows.length) {
        storageId = storageRows[0].id;
      }
    }

    if (!storageId && pallet.storageName?.trim()) {
      const [storageRowsByName] = await connection.execute<
        (RowDataPacket & { id: string })[]
      >("SELECT id FROM storages WHERE name = ? LIMIT 1", [pallet.storageName.trim()]);
      if (storageRowsByName.length) {
        storageId = storageRowsByName[0].id;
      }
    }

    if (!storageId) {
      missingStorages.add(`${label} → ${pallet.storageId || pallet.storageName || "(sin referencia)"}`);
      continue;
    }

    let trayId: string | null = null;
    const trayIdRaw = (pallet.trayId || "").trim();
    if (trayIdRaw) {
      const [trayRows] = await connection.execute<
        (RowDataPacket & { id: string })[]
      >("SELECT id FROM trays WHERE id = ? LIMIT 1", [trayIdRaw]);
      if (trayRows.length) {
        trayId = trayRows[0].id;
      }
    }

    if (!trayId && pallet.trayName?.trim()) {
      const [trayRowsByName] = await connection.execute<
        (RowDataPacket & { id: string })[]
      >("SELECT id FROM trays WHERE name = ? LIMIT 1", [pallet.trayName.trim()]);
      if (trayRowsByName.length) {
        trayId = trayRowsByName[0].id;
      }
    }

    if (!trayId) {
      missingTrays.add(`${label} → ${pallet.trayId || pallet.trayName || "(sin referencia)"}`);
      continue;
    }

    const capacity = Number(pallet.capacity);
    if (!Number.isFinite(capacity) || capacity <= 0) {
      invalidRows.add(`${label} → capacidad inválida`);
      continue;
    }

    const traysQuantityRaw = Number(pallet.traysQuantity ?? 0);
    if (!Number.isFinite(traysQuantityRaw) || traysQuantityRaw < 0) {
      invalidRows.add(`${label} → traysQuantity inválida`);
      continue;
    }

    if (traysQuantityRaw > capacity) {
      invalidRows.add(`${label} → traysQuantity excede capacity`);
      continue;
    }

    let weight = Number(pallet.weightKg ?? 0);
    if (!Number.isFinite(weight) || weight < 0) {
      weight = 0;
    }
    weight = Number(weight.toFixed(3));

    let dispatchWeight = Number(pallet.dispatchWeightKg ?? 0);
    if (!Number.isFinite(dispatchWeight) || dispatchWeight < 0) {
      dispatchWeight = 0;
    }
    dispatchWeight = Number(dispatchWeight.toFixed(3));
    if (dispatchWeight > weight) {
      dispatchWeight = weight;
    }

    const statusCandidate = (pallet.status || "AVAILABLE").toString().toUpperCase();
    const status = VALID_PALLET_STATUSES.has(statusCandidate) ? statusCandidate : "AVAILABLE";

    let metadataJson: string | null = null;
    if (pallet.metadata !== undefined && pallet.metadata !== null) {
      try {
        metadataJson = JSON.stringify(pallet.metadata);
      } catch {
        invalidRows.add(`${label} → metadata inválida (no serializable)`);
        metadataJson = null;
      }
    }

    let createdAt = pallet.createdAt ? new Date(pallet.createdAt) : new Date();
    if (Number.isNaN(createdAt.getTime())) {
      createdAt = new Date();
    }

    await connection.execute(
      `INSERT INTO pallets (storageId, trayId, traysQuantity, capacity, weight, dispatchWeight, metadata, status, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        /* sql */,
      [
        storageId,
        trayId,
        Number(traysQuantityRaw),
        Number(capacity),
        weight,
        dispatchWeight,
        metadataJson,
        status,
        createdAt,
        createdAt,
      ]
    );

    inserted++;
  }

  if (missingStorages.size > 0) {
    const preview = Array.from(missingStorages).slice(0, 5).join(", ");
    const suffix = missingStorages.size > 5 ? ` (+${missingStorages.size - 5} more)` : "";
    console.warn(`   ⚠️  Pallets omitidos: bodegas desconocidas ${preview}${suffix}`);
  }

  if (missingTrays.size > 0) {
    const preview = Array.from(missingTrays).slice(0, 5).join(", ");
    const suffix = missingTrays.size > 5 ? ` (+${missingTrays.size - 5} more)` : "";
    console.warn(`   ⚠️  Pallets omitidos: bandejas desconocidas ${preview}${suffix}`);
  }

  if (invalidRows.size > 0) {
    const preview = Array.from(invalidRows).slice(0, 5).join(", ");
    const suffix = invalidRows.size > 5 ? ` (+${invalidRows.size - 5} more)` : "";
    console.warn(`   ⚠️  Pallets omitidos por datos inválidos ${preview}${suffix}`);
  }

  console.log(`   ✓ Inserted ${inserted} pallets`);
};

const seedTrays = async (connection: mysql.Connection) => {
  console.log("\n🧺 Seeding trays from JSON file...");

  const trays = loadSeedJson<TraySeedRow[]>("trays.json");

  await connection.execute("DELETE FROM trays");

  let inserted = 0;
  const seenNames = new Set<string>();

  for (const tray of trays) {
    const name = (tray.name || "").trim();
    if (!name) {
      continue;
    }

    const key = name.toLowerCase();
    if (seenNames.has(key)) {
      continue;
    }

    const weight = Number(tray.weight);
    if (!Number.isFinite(weight) || weight <= 0) {
      console.warn(`   ⚠️  Skipping tray '${name}': invalid weight value`);
      continue;
    }

    const stock = Number.isFinite(tray.stock) ? Number(tray.stock) : 0;
    const active = tray.active !== undefined ? Boolean(tray.active) : true;
    const id = (tray.id || randomUUID()).trim();

    await connection.execute(
      `INSERT INTO trays (id, name, weight, stock, active, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [id, name, weight, stock, active]
    );

    seenNames.add(key);
    inserted++;
  }

  console.log(`   ✓ Inserted ${inserted} trays`);
};

const seedFormats = async (connection: mysql.Connection) => {
  console.log("\n📦 Seeding formats from JSON file...");

  const formats = loadSeedJson<FormatSeedRow[]>("formats.json");

  await connection.execute("DELETE FROM formats");

  let inserted = 0;
  const seenNames = new Set<string>();

  for (const format of formats) {
    const name = (format.name || "").trim();
    if (!name) {
      continue;
    }

    const key = name.toLowerCase();
    if (seenNames.has(key)) {
      continue;
    }

    const description = typeof format.description === "string" ? format.description.trim() : null;
    const active = format.active !== undefined ? Boolean(format.active) : true;

    await connection.execute(
      `INSERT INTO formats (name, description, active, createdAt, updatedAt)
       VALUES (?, ?, ?, NOW(), NOW())`,
      [name, description || null, active]
    );

    seenNames.add(key);
    inserted++;
  }

  console.log(`   ✓ Inserted ${inserted} formats`);
};

const seedVarieties = async (connection: mysql.Connection) => {
  console.log("\n🍇 Seeding varieties from JSON file...");

  const varieties = loadSeedJson<VarietySeedRow[]>("varieties.json");

  await connection.execute("DELETE FROM varieties");

  let inserted = 0;
  const seenNames = new Set<string>();

  for (const variety of varieties) {
    const name = (variety.name || "").trim();
    if (!name) {
      continue;
    }

    const key = name.toLowerCase();
    if (seenNames.has(key)) {
      continue;
    }

    const priceCLP = Number.isFinite(variety.priceCLP) ? Number(variety.priceCLP) : 0;
    const priceUSD = Number.isFinite(variety.priceUSD) ? Number(variety.priceUSD) : 0;
    const currency = variety.currency === "USD" ? "USD" : "CLP";

    await connection.execute(
      `INSERT INTO varieties (name, priceCLP, priceUSD, currency, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [name, priceCLP, priceUSD, currency]
    );

    seenNames.add(key);
    inserted++;
  }

  console.log(`   ✓ Inserted ${inserted} varieties`);
};

const seedSampleTransaction = async (connection: mysql.Connection) => {
  const [countRows] = await connection.execute<(RowDataPacket & { total: number })[]>(
    "SELECT COUNT(*) AS total FROM transactions"
  );

  if (countRows[0]?.total > 0) {
    console.log("   ℹ️  Transactions table already contains data, skipping sample transaction seeding.");
    return;
  }

  const [seasonRows] = await connection.execute<(RowDataPacket & { id: string })[]>(
    "SELECT id FROM seasons WHERE active = TRUE LIMIT 1"
  );

  const seasonRow = seasonRows[0];
  if (!seasonRow?.id) {
    console.warn("   ⚠️  Skipping sample transaction: no active season found");
    return;
  }

  const [producerRows] = await connection.execute<(RowDataPacket & { id: string })[]>(
    "SELECT id FROM producers ORDER BY createdAt ASC LIMIT 1"
  );

  const producerRow = producerRows[0];
  if (!producerRow?.id) {
    console.warn("   ⚠️  Skipping sample transaction: no producers available");
    return;
  }

  const [userRows] = await connection.execute<(RowDataPacket & { id: string })[]>(
    "SELECT id FROM users ORDER BY createdAt ASC LIMIT 1"
  );

  const userRow = userRows[0];
  if (!userRow?.id) {
    console.warn("   ⚠️  Skipping sample transaction: no users available");
    return;
  }

  await connection.execute(
    `INSERT INTO transactions (type, direction, amount, unit, seasonId, producerId, clientId, userId, metadata, createdAt, updatedAt)
     VALUES ('TRAY_IN_FROM_PRODUCER', 'IN', ?, 'TRAY', ?, ?, NULL, ?, ?, NOW(), NOW())`,
    [
      100,
      seasonRow.id,
      producerRow.id,
      userRow.id,
      JSON.stringify({
        trayId: "seed-tray",
        qualityCheckPassed: true,
        seededAt: new Date().toISOString(),
      }),
    ]
  );

  console.log("   ✓ Inserted sample transaction linked to active season and first producer");
};

const executeSqlFile = async (
  connection: mysql.Connection,
  filePath: string,
  name: string
): Promise<void> => {
  try {
    console.log(`\n📄 Executing ${name}...`);
    const sql = fs.readFileSync(filePath, "utf8");

    // Remove comments and split by semicolon
    const lines = sql.split("\n");
    let cleanedSql = "";
    
    for (const line of lines) {
      const commentIndex = line.indexOf("--");
      if (commentIndex === -1) {
        cleanedSql += line + "\n";
      } else if (commentIndex > 0) {
        cleanedSql += line.substring(0, commentIndex) + "\n";
      }
      // Skip lines that are pure comments
    }

    // Split by semicolon and filter out empty statements
    const statements = cleanedSql
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0);

    let executedCount = 0;
    for (const statement of statements) {
      try {
        await connection.execute(statement);
        executedCount++;
      } catch (error: any) {
        // Some statements might fail (e.g., verification queries), continue
        if (!statement.includes("SHOW TABLES") && !statement.includes("SELECT")) {
          console.warn(`⚠️  Statement failed: ${statement.substring(0, 50)}...`);
          console.warn(`   Error: ${error.message}`);
        }
      }
    }

    console.log(`✓ ${name} completed (${executedCount} statements)`);
  } catch (error: any) {
    console.error(`❌ Error reading/executing ${name}:`, error.message);
    throw error;
  }
};

const runSeed = async (environment: "test" | "production" = "test") => {
  const config = ENVIRONMENTS[environment];

  if (!config) {
    console.error(`❌ Unknown environment: ${environment}`);
    console.error(
      `Available environments: ${Object.keys(ENVIRONMENTS).join(", ")}`
    );
    process.exit(1);
  }

  let connection: mysql.Connection | null = null;

  try {
    console.log(`\n🚀 Starting seed process for [${environment.toUpperCase()}]`);
    console.log(`📍 Database: ${config.database} @ ${config.host}`);
    console.log("───────────────────────────────────────────────────────────");

    // Create connection
    console.log("\n🔗 Connecting to database...");
    const serverConnection = await mysql.createConnection({
      host: config.host,
      user: config.user,
      password: config.password,
    });
    await serverConnection.execute(
      `CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await serverConnection.end();

    connection = await mysql.createConnection({
      host: config.host,
      user: config.user,
      password: config.password,
      database: config.database,
    });
    console.log("✓ Connected to database");

    // Disable foreign key checks for seeding
    console.log("\n🔒 Disabling foreign key checks...");
    await connection.execute("SET FOREIGN_KEY_CHECKS = 0");

    // Execute SQL files in order
    const sqlDir = path.join(__dirname, "sql");

    await executeSqlFile(
      connection,
      path.join(sqlDir, "drop-all-tables.sql"),
      "Drop All Tables"
    );

    await executeSqlFile(
      connection,
      path.join(sqlDir, "create-tables.sql"),
      "Create Tables"
    );

    await executeSqlFile(
      connection,
      path.join(sqlDir, "seed-data.sql"),
      "Seed Data"
    );

    console.log("\n📚 Loading JSON-driven seed data...");
    await seedPersons(connection);
    await seedUsers(connection);
    await seedPermissions(connection);
    await seedFormats(connection);
    await seedVarieties(connection);
    await seedTrays(connection);
    await seedStorages(connection);
    await seedPallets(connection);
    await seedSeasons(connection);
    await seedCustomers(connection);
    await seedAdminBankAccounts(connection);
    await seedAudits(connection);
    await seedProductiveUnitsAndProducers(connection);
    await seedReceptionTransactions(connection);
    await seedAdvanceTransactions(connection);
    await seedSampleTransaction(connection);

    // Re-enable foreign key checks
    console.log("\n🔓 Re-enabling foreign key checks...");
    await connection.execute("SET FOREIGN_KEY_CHECKS = 1");

    console.log("\n───────────────────────────────────────────────────────────");
    console.log("✅ Seed process completed successfully!");
    console.log(
      `📊 Database [${environment.toUpperCase()}] is now ready with test data`
    );

    await connection.end();
    process.exit(0);
  } catch (error: any) {
    console.error("\n───────────────────────────────────────────────────────────");
    console.error("❌ Seed process failed:");
    console.error(error.message);
    console.error(error.stack);

    if (connection) {
      try {
        await connection.end();
      } catch (closeError) {
        console.error("Error closing connection:", closeError);
      }
    }

    process.exit(1);
  }
};

// Parse command line arguments
const environment = (process.argv[2] || "test") as "test" | "production";

// Set process timeout
setTimeout(() => {
  console.error(`\n❌ Seed execution timeout (${RUN_SEED_TIMEOUT_MS / 1000} seconds)`);
  process.exit(1);
}, RUN_SEED_TIMEOUT_MS);

runSeed(environment);
