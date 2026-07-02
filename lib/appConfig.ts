export type DatabaseConfig = {
  host: string;
  port: number;
  username: string;
  password: string;
  name: string;
  synchronize: boolean;
  logging: boolean;
};

export type AppConfig = {
  appName: string;
  dataBase: DatabaseConfig;
};

const DEFAULTS = {
  host: "localhost",
  port: 3306,
  username: "root",
  password: "",
  name: "berries_angeles",
  synchronize: false,
  logging: false,
  appName: "Berries Angeles",
};

function envString(key: string, fallback: string): string {
  const value = process.env[key];
  return value !== undefined && value !== "" ? value : fallback;
}

function envNumber(key: string, fallback: number): number {
  const value = process.env[key];
  if (value === undefined || value === "") return fallback;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export function getAppConfig(): AppConfig {
  return {
    appName: envString("NEXT_PUBLIC_APP_NAME", DEFAULTS.appName),
    dataBase: {
      host: envString("DB_HOST", DEFAULTS.host),
      port: envNumber("DB_PORT", DEFAULTS.port),
      username: envString("DB_USER", DEFAULTS.username),
      password: process.env.DB_PASSWORD ?? DEFAULTS.password,
      name: envString("DB_NAME", DEFAULTS.name),
      synchronize: process.env.DB_SYNCHRONIZE === "true",
      logging: process.env.DB_LOGGING === "true",
    },
  };
}

export function getPublicAppConfig(): Omit<AppConfig, "dataBase"> & {
  dataBase: Omit<DatabaseConfig, "password"> & { passwordConfigured: boolean };
} {
  const config = getAppConfig();

  return {
    appName: config.appName,
    dataBase: {
      host: config.dataBase.host,
      port: config.dataBase.port,
      username: config.dataBase.username,
      name: config.dataBase.name,
      synchronize: config.dataBase.synchronize,
      logging: config.dataBase.logging,
      passwordConfigured: config.dataBase.password.length > 0,
    },
  };
}
