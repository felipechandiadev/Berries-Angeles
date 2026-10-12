"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { KaiResponsiveRoot, NextNavProvider } from "@felipechandiadev/ui";
import { AlertProvider } from "./state/contexts/AlertContext";
import { PermissionsProvider } from "./state/contexts/PermissionsContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      {/* search="" evita useSearchParams (no suspende en SSG); grillas pasan search real vía WithNavSearch */}
      <NextNavProvider search="">
        <KaiResponsiveRoot>
          <PermissionsProvider>
            <AlertProvider>
              {children}
            </AlertProvider>
          </PermissionsProvider>
        </KaiResponsiveRoot>
      </NextNavProvider>
    </SessionProvider>
  );
}

/**
 * Minimal provider que solo proporciona AlertProvider sin SessionProvider
 * Esto permite que el resto de la app sea Server Components hasta donde sea posible
 */
export function MinimalProviders({ children }: { children: ReactNode }) {
  return (
    <AlertProvider>
      {children}
    </AlertProvider>
  );
}
