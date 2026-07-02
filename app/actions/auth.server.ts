'use server';

/**
 * Obtiene la sesión del usuario actual de forma segura
 * Esta función debe llamarse SOLO en Server Actions
 * 
 * IMPORTANTE: No usa getServerSession porque puede causar problemas
 * en ciertos contextos. En su lugar, espera que el userId se pase como parámetro.
 */
export async function getCurrentUserSession() {
  // Esta función ahora es un placeholder
  // Los componentes client-side deben obtener la sesión y pasarla explícitamente
  return {
    userId: undefined,
    userName: undefined,
  };
}
