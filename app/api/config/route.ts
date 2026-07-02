import { NextResponse } from "next/server";
import { getPublicAppConfig } from "@/lib/appConfig";

export async function GET() {
  try {
    const config = getPublicAppConfig();
    return NextResponse.json({
      appName: config.appName,
      source: "environment",
      dataBase: {
        name: config.dataBase.name,
        version: "1.0.0",
        description: "Database for Berries Angeles application",
        port: config.dataBase.port,
        host: config.dataBase.host,
        username: config.dataBase.username,
        passwordConfigured: config.dataBase.passwordConfigured,
        engine: "mysql",
      },
    });
  } catch (err) {
    console.error("Error reading config:", err);
    return NextResponse.json({ error: "Failed to read config" }, { status: 500 });
  }
}
