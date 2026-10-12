import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entities/User";
import { Person } from "./entities/Person";
import { Audit } from "./entities/Audit";
import { Variety } from "./entities/Variety";
import { VarietyPriceHistory } from "./entities/VarietyPriceHistory";
import { Format } from "./entities/Format";
import { Season } from "./entities/Season";
import { ProductiveUnit } from "./entities/ProductiveUnit";
import { Producer } from "./entities/Producer";
import { Customer } from "./entities/Customer";
import { Tray } from "./entities/Tray";
import { Pallet } from "./entities/Pallet";
import { Transaction } from "./entities/Transaction";
import { ReceptionPack } from "./entities/ReceptionPack";
import { TransactionRelation } from "./entities/TransactionRelation";
import { AdminBankAccount } from "./entities/AdminBankAccount";
import { AppConfig } from "./entities/AppConfig";
import { Permission } from "./entities/Permission";
import { AuditSubscriber } from "./subscribers/AuditSubscriber";
import { getAppConfig } from "../lib/appConfig";
import { ensureTransactionTypeEnum } from "./ensureTransactionTypeEnum";
import { ensureAppConfigTable } from "./ensureAppConfigTable";
import { ensurePalletsWithoutStorage } from "./ensurePalletsWithoutStorage";
import { ensureVarietyQualityPrices } from "./ensureVarietyQualityPrices";
import { ensureVarietyPriceHistoryTable } from "./ensureVarietyPriceHistoryTable";

const appConfig = getAppConfig();

/**
 * Next.js re-evalúa módulos en HMR/dev. Un `let` de módulo crea un pool nuevo
 * en cada reload y satura MySQL (ER_CON_COUNT_ERROR).
 * El DataSource vive en globalThis: un solo pool por proceso Node.
 */
const GLOBAL_KEY = "__berriesAngelesTypeormDs" as const;

type DbGlobal = {
  [GLOBAL_KEY]?: {
    ds?: DataSource;
    initPromise?: Promise<DataSource>;
    shutdownHooked?: boolean;
    transactionTypeEnumReady?: boolean;
    appConfigTableReady?: boolean;
    palletsWithoutStorageReady?: boolean;
    varietyQualityPricesReady?: boolean;
    varietyPriceHistoryReady?: boolean;
  };
};

const g = globalThis as typeof globalThis & DbGlobal;

function bag() {
  if (!g[GLOBAL_KEY]) g[GLOBAL_KEY] = {};
  return g[GLOBAL_KEY]!;
}

const isProd = process.env.NODE_ENV === "production";
/** Dev: pool mínimo. Prod: un poco más, sin abrir 20 por proceso. */
const POOL_CONNECTION_LIMIT = isProd ? 10 : 3;

function createDataSource(): DataSource {
  const { dataBase } = appConfig;
  return new DataSource({
    type: "mysql",
    host: dataBase.host,
    port: dataBase.port,
    username: dataBase.username,
    password: dataBase.password,
    database: dataBase.name,
    synchronize: dataBase.synchronize,
    logging: dataBase.logging,
    entities: [
      User,
      Person,
      Audit,
      Variety,
      VarietyPriceHistory,
      Format,
      Season,
      ProductiveUnit,
      Producer,
      Customer,
      Tray,
      Pallet,
      Transaction,
      TransactionRelation,
      ReceptionPack,
      AdminBankAccount,
      AppConfig,
      Permission,
    ],
    subscribers: [AuditSubscriber],
    migrations: [],
    extra: {
      connectionLimit: POOL_CONNECTION_LIMIT,
      waitForConnections: true,
      queueLimit: 100,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10_000,
      decimalNumbers: true,
      connectTimeout: 10_000,
      // Liberar idle pronto en dev para no acumular sockets
      idleTimeout: isProd ? 60_000 : 15_000,
      maxIdle: isProd ? 4 : 1,
      authPlugins: {
        mysql_clear_password: () => () => dataBase.password,
      },
    },
  });
}

function hookShutdownOnce() {
  const state = bag();
  if (state.shutdownHooked) return;
  state.shutdownHooked = true;

  const shutdown = () => {
    void closeDb();
  };

  process.once("beforeExit", shutdown);
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

function isTooManyConnections(error: any): boolean {
  const code = error?.code || error?.driverError?.code;
  const msg = String(error?.message || error?.driverError?.message || "");
  return (
    code === "ER_CON_COUNT_ERROR" ||
    /too many connections/i.test(msg)
  );
}

function isTransientConnectionError(error: any): boolean {
  const code = error?.code || error?.driverError?.code;
  return (
    code === "ECONNRESET" ||
    code === "ENOTFOUND" ||
    code === "ETIMEDOUT" ||
    code === "PROTOCOL_CONNECTION_LOST" ||
    isTooManyConnections(error)
  );
}

/**
 * Tras HMR/re-eval de módulos, globalThis conserva un DataSource cuyas
 * entity classes ya no son === a las importadas actuales →
 * EntityMetadataNotFoundError en getRepository(User).
 */
function isEntityMetadataStale(ds: DataSource): boolean {
  try {
    const meta = ds.getMetadata(User);
    return meta.target !== User;
  } catch {
    return true;
  }
}

async function discardDataSource(reason: string): Promise<void> {
  const state = bag();
  const ds = state.ds;
  state.ds = undefined;
  state.initPromise = undefined;
  if (ds?.isInitialized) {
    try {
      await ds.destroy();
      console.warn(`[DB] DataSource descartado (${reason})`);
    } catch (e) {
      console.warn(`[DB] Error descartando DataSource (${reason}):`, e);
    }
  }
}

export const getDb = async (retries: number = 0): Promise<DataSource> => {
  const MAX_RETRIES = 5;
  const RETRY_DELAY = Math.min(8000, 500 * Math.pow(2, retries));
  const state = bag();

  try {
    if (state.ds?.isInitialized) {
      if (isEntityMetadataStale(state.ds)) {
        await discardDataSource("entity metadata stale / HMR");
      } else {
        if (!state.transactionTypeEnumReady) {
          await ensureTransactionTypeEnum(state.ds);
          state.transactionTypeEnumReady = true;
        }
        if (!state.appConfigTableReady) {
          await ensureAppConfigTable(state.ds);
          state.appConfigTableReady = true;
        }
        if (!state.palletsWithoutStorageReady) {
          await ensurePalletsWithoutStorage(state.ds);
          state.palletsWithoutStorageReady = true;
        }
        if (!state.varietyQualityPricesReady) {
          await ensureVarietyQualityPrices(state.ds);
          state.varietyQualityPricesReady = true;
        }
        if (!state.varietyPriceHistoryReady) {
          await ensureVarietyPriceHistoryTable(state.ds);
          state.varietyPriceHistoryReady = true;
        }
        return state.ds;
      }
    }

    if (!state.initPromise) {
      state.initPromise = (async () => {
        if (!state.ds) {
          console.log(
            `[DB] DataSource singleton (pool=${POOL_CONNECTION_LIMIT}, key=${GLOBAL_KEY})`
          );
          state.ds = createDataSource();
          hookShutdownOnce();
        }

        if (!state.ds.isInitialized) {
          console.log("[DB] Inicializando DataSource...");
          await state.ds.initialize();
          console.log("[DB] DataSource listo");
        }

        if (!state.transactionTypeEnumReady) {
          await ensureTransactionTypeEnum(state.ds);
          state.transactionTypeEnumReady = true;
        }
        if (!state.appConfigTableReady) {
          await ensureAppConfigTable(state.ds);
          state.appConfigTableReady = true;
        }
        if (!state.palletsWithoutStorageReady) {
          await ensurePalletsWithoutStorage(state.ds);
          state.palletsWithoutStorageReady = true;
        }
        if (!state.varietyQualityPricesReady) {
          await ensureVarietyQualityPrices(state.ds);
          state.varietyQualityPricesReady = true;
        }
        if (!state.varietyPriceHistoryReady) {
          await ensureVarietyPriceHistoryTable(state.ds);
          state.varietyPriceHistoryReady = true;
        }

        return state.ds;
      })().catch((err) => {
        // Permitir reintento limpio
        state.initPromise = undefined;
        // Si falló el initialize, soltar la instancia rota
        if (state.ds && !state.ds.isInitialized) {
          state.ds = undefined;
        }
        throw err;
      });
    }

    return await state.initPromise;
  } catch (error: any) {
    if (!isTransientConnectionError(error) || retries >= MAX_RETRIES) {
      console.error("[DB] Fallo de conexión sin recuperación:", error);
      throw error;
    }

    console.warn(
      `[DB] ${error?.code || error?.message}. Reintento ${retries + 1}/${MAX_RETRIES} en ${RETRY_DELAY}ms`
    );
    await new Promise((r) => setTimeout(r, RETRY_DELAY));

    // "Too many connections": NO destruir el pool (empeora el leak). Solo esperar.
    if (isTooManyConnections(error)) {
      state.initPromise = undefined;
      return getDb(retries + 1);
    }

    // Otros errores de red: destruir y recrear
    if (state.ds?.isInitialized) {
      try {
        await state.ds.destroy();
      } catch (destroyError) {
        console.warn("[DB] Error al destruir DataSource:", destroyError);
      }
    }
    state.ds = undefined;
    state.initPromise = undefined;
    return getDb(retries + 1);
  }
};

export const closeDb = async (): Promise<void> => {
  const state = bag();
  const ds = state.ds;
  state.initPromise = undefined;
  state.ds = undefined;

  if (ds?.isInitialized) {
    try {
      await ds.destroy();
      console.log("[DB] Pool cerrado");
    } catch (e) {
      console.warn("[DB] Error cerrando pool:", e);
    }
  }
};
