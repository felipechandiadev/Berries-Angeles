"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import IconButton from "@/app/baseComponents/IconButton/IconButton";
import { UpdateDataBaseDialog } from "./ui/UpdateDataBaseDialog";
import './global.css';
import type { BaseFormField } from '@/app/baseComponents/BaseForm/CreateBaseForm';
import CreateBaseForm from '@/app/baseComponents/BaseForm/CreateBaseForm';
import { useSubmitLock } from '@/app/state/hooks/useSubmitLock';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [values, setValues] = useState<Record<string, any>>({ username: "", password: "" });
  const [error, setError] = useState("");
  const { isSubmitting, run } = useSubmitLock();

  const [dbDialogOpen, setDbDialogOpen] = useState(false);

  // Redirigir a home si ya está autenticado (usado cuando vuelve del callback)
  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push('/home');
    }
  }, [status, session, router]);

  const handleSubmit = async () => {
    if (!values.username || !values.password) {
      setError("Por favor completa todos los campos");
      return;
    }

    setError("");

    try {
      const result = await run(async () => {
        console.log('[Login] Iniciando login');

        const signInResult = await signIn("credentials", {
          username: values.username,
          password: values.password,
          redirect: false,
          callbackUrl: `${window.location.origin}/home`,
        });

        console.log('[Login] Resultado del signIn:', signInResult);

        if (signInResult?.error) {
          setError("Usuario o contraseña incorrectos");
          return { ok: false };
        }

        if (signInResult?.ok) {
          return { ok: true };
        }

        setError("Error al procesar la autenticación");
        return { ok: false };
      });

      if (result?.ok) {
        router.push('/home');
      }
    } catch (error) {
      console.error('[Login] Error:', error);
      setError("Error al procesar la autenticación");
    }
  };

  const fields: BaseFormField[] = [
    {
      name: "username",
      label: "Usuario",
      type: "text",
      required: true,
    },
    {
      name: "password",
      label: "Contraseña",
      type: "password",
      required: true,
      passwordVisibilityToggle: true,
    },
  ];

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-page py-6">
      <div className="w-full max-w-md rounded-xl border p-4 shadow-2xl sm:p-6" style={{ 
  
      }}>
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img
            src="/logo.svg"
            alt="Logo"
            className="w-20 h-20 object-contain"
          />
        </div>
        
        <h1 className="text-3xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
          Iniciar Sesión
        </h1>
        
        <CreateBaseForm
          fields={fields}
          values={values}
          onChange={(field, value) => setValues(prev => ({ ...prev, [field]: value }))}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitLabel="Ingresar"
          errors={error ? [error] : []}
        />
      </div>

      <IconButton 
        icon="settings" 
        variant="text"
        aria-label="Ver configuración de BD" 
        className="fixed bottom-4 right-4 p-2 rounded-full shadow-lg" 
        style={{ zIndex: 1000, fontSize: 28 }} 
        onClick={() => setDbDialogOpen(true)} 
      />

      <UpdateDataBaseDialog 
        open={dbDialogOpen} 
        onClose={() => setDbDialogOpen(false)} 
      />
    </main>
  );
}
