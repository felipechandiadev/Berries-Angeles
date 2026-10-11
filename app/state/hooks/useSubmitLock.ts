"use client";

import { useCallback, useRef, useState } from "react";

export type SubmitLockResult = { ok: boolean };

/**
 * Lock de submit: durante el request el UI queda en loading/disabled.
 * En éxito NO se libera (navegación o unmount del diálogo).
 * Solo se desbloquea en error / throw.
 */
export function useSubmitLock() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const lockRef = useRef(false);

  const run = useCallback(
    async (
      action: () => Promise<SubmitLockResult>
    ): Promise<SubmitLockResult | null> => {
      if (lockRef.current) return null;
      lockRef.current = true;
      setIsSubmitting(true);
      try {
        const result = await action();
        if (!result.ok) {
          lockRef.current = false;
          setIsSubmitting(false);
        }
        return result;
      } catch (error) {
        lockRef.current = false;
        setIsSubmitting(false);
        throw error;
      }
    },
    []
  );

  return { isSubmitting, run };
}
