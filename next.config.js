const path = require("path");
const withSerwist = require("@serwist/next").default({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@felipechandiadev/ui"],
  // Evita que webpack empaquete TypeORM (usa el build Node, no /browser).
  serverExternalPackages: ["typeorm", "mysql2", "bcryptjs", "reflect-metadata"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    // TypeORM/browser pide drivers opcionales (react-native-sqlite-storage, etc.).
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "react-native-sqlite-storage": false,
      "@google-cloud/spanner": false,
      "mongodb": false,
      "@sap/hana-client": false,
      "hdb-pool": false,
      "mysql": false,
      "oracledb": false,
      "pg-native": false,
      "pg-query-stream": false,
      "typeorm-aurora-data-api-driver": false,
      "redis": false,
      "ioredis": false,
      "better-sqlite3": false,
      "sqlite3": false,
      "sql.js": false,
      "mssql": false,
    };

    if (isServer) {
      // Forzar entry Node de typeorm (no el campo "browser" del package.json).
      config.resolve.alias = {
        ...config.resolve.alias,
        typeorm: path.resolve(__dirname, "node_modules/typeorm/index.js"),
      };
      // No preferir el campo "browser" en resolución server-side.
      config.resolve.aliasFields = [];
    }

    return config;
  },
};

module.exports = withSerwist(nextConfig);
