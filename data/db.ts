import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entities/User";
import { Person } from "./entities/Person";
import { Audit } from "./entities/Audit";
import { Variety } from "./entities/Variety";
import { Format } from "./entities/Format";
import { Season } from "./entities/Season";
import { ProductiveUnit } from "./entities/ProductiveUnit";
import { Producer } from "./entities/Producer";
import { Customer } from "./entities/Customer";
import { Storage } from "./entities/Storage";
import { Tray } from "./entities/Tray";
import { Pallet } from "./entities/Pallet";
import { Transaction } from "./entities/Transaction";
import { ReceptionPack } from "./entities/ReceptionPack";
import { TransactionRelation } from "./entities/TransactionRelation";
import { AdminBankAccount } from "./entities/AdminBankAccount";
import { Permission } from "./entities/Permission";
import { AuditSubscriber } from "./subscribers/AuditSubscriber";
import { getAppConfig } from "../lib/appConfig";

const appConfig = getAppConfig();

let globalDataSource: DataSource | null = null;

export const getDb = async (retries: number = 0): Promise<DataSource> => {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000 * Math.pow(2, retries);

  try {
    if (!globalDataSource) {
      console.log("[DB] Creando nueva instancia de DataSource (singleton)...");
      const { dataBase } = appConfig;
      globalDataSource = new DataSource({
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
          Format,
          Season,
          ProductiveUnit,
          Producer,
          Customer,
          Storage,
          Tray,
          Pallet,
          Transaction,
          TransactionRelation,
          ReceptionPack,
          AdminBankAccount,
          Permission,
        ],
        subscribers: [AuditSubscriber],
        migrations: [],
        extra: {
          connectionLimit: 20,
          waitForConnections: true,
          queueLimit: 0,
          enableKeepAlive: true,
          decimalNumbers: true,
          connectTimeout: 10000,
          idleTimeout: 30000,
          authPlugins: {
            mysql_clear_password: () => () => dataBase.password,
          },
        },
      });
    }

    if (!globalDataSource.isInitialized) {
      console.log("[DB] Inicializando DataSource...");
      await globalDataSource.initialize();
      console.log("[DB] DataSource inicializado correctamente");
    }

    return globalDataSource;
  } catch (error: any) {
    const errorCode = error?.code || error?.driverError?.code;
    const isConnectionError =
      errorCode === "ECONNRESET" ||
      errorCode === "ENOTFOUND" ||
      errorCode === "ETIMEDOUT" ||
      errorCode === "PROTOCOL_CONNECTION_LOST" ||
      errorCode === "ER_CON_COUNT_ERROR" ||
      error?.message?.includes("too many connections");

    if (isConnectionError && retries < MAX_RETRIES) {
      console.warn(
        `[DB] Error de conexión: ${errorCode}. Reintentando en ${RETRY_DELAY}ms... (Intento ${retries + 1}/${MAX_RETRIES})`
      );

      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));

      if (globalDataSource?.isInitialized) {
        try {
          await globalDataSource.destroy();
        } catch (destroyError) {
          console.warn("[DB] Error al destruir conexión:", destroyError);
        }
      }

      globalDataSource = null;
      return getDb(retries + 1);
    }

    console.error("[DB] Fallo de conexión sin recuperación:", error);
    throw error;
  }
};

export const closeDb = async (): Promise<void> => {
  if (globalDataSource?.isInitialized) {
    await globalDataSource.destroy();
    globalDataSource = null;
    console.log("[DB] Conexión cerrada");
  }
};
