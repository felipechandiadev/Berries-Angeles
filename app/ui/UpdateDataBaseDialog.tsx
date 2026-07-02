"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/app/baseComponents/Button/Button";
import { useAlert } from "@/app/state/hooks/useAlert";

type DbConfigView = {
  name?: string;
  version?: string;
  description?: string;
  port?: number;
  host?: string;
  username?: string;
  passwordConfigured?: boolean;
  engine?: string;
};

type UpdateDataBaseDialogProps = {
  open: boolean;
  onClose: () => void;
};

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-gray-100">
      <span className="text-sm font-medium text-gray-600">{label}</span>
      <span className="text-sm text-gray-900 text-right break-all">{value}</span>
    </div>
  );
}

export const UpdateDataBaseDialog: React.FC<UpdateDataBaseDialogProps> = ({ open, onClose }) => {
  const [dbConfig, setDbConfig] = useState<DbConfigView | null>(null);
  const [loading, setLoading] = useState(false);
  const { error } = useAlert();

  useEffect(() => {
    if (open) {
      setLoading(true);
      (async () => {
        try {
          const response = await fetch("/api/config");
          if (response.ok) {
            const config = await response.json();
            if (config?.dataBase) {
              setDbConfig(config.dataBase);
            }
          } else {
            throw new Error("Failed to fetch config");
          }
        } catch (err) {
          console.error("Error loading config:", err);
          error("Error al cargar la configuración.");
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [open, error]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-2">Configuración de Base de Datos</h2>
        <p className="text-sm text-gray-500 mb-4">
          La conexión se define solo con variables de entorno (
          <code className="text-xs">.env.local</code> en desarrollo, Vercel en producción).
          No se guarda en el navegador ni en archivos locales.
        </p>

        {loading ? (
          <p className="text-sm text-gray-500">Cargando...</p>
        ) : dbConfig ? (
          <div className="mb-4">
            <ConfigRow label="Nombre" value={dbConfig.name ?? "—"} />
            <ConfigRow label="Versión" value={dbConfig.version ?? "—"} />
            <ConfigRow label="Descripción" value={dbConfig.description ?? "—"} />
            <ConfigRow label="Host" value={dbConfig.host ?? "—"} />
            <ConfigRow label="Puerto" value={String(dbConfig.port ?? 3306)} />
            <ConfigRow label="Usuario" value={dbConfig.username ?? "—"} />
            <ConfigRow
              label="Contraseña"
              value={dbConfig.passwordConfigured ? "Configurada (oculta)" : "No configurada"}
            />
            <ConfigRow label="Engine" value={dbConfig.engine ?? "mysql"} />
          </div>
        ) : (
          <p className="text-sm text-gray-500 mb-4">No se pudo cargar la configuración.</p>
        )}

        <div className="rounded-md bg-gray-50 p-3 mb-4 text-xs text-gray-600 space-y-1">
          <p className="font-semibold">Variables requeridas:</p>
          <p>DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME</p>
        </div>

        <Button type="button" onClick={onClose} variant="secondary" className="w-full">
          Cerrar
        </Button>
      </div>
    </div>
  );
};
