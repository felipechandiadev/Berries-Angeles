'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Printer } from 'lucide-react';
import DotProgress from '@/app/baseComponents/DotProgress/DotProgress';
import {
  hasPairedPrinter,
  isWebUsbSupported,
  pairPrinter,
} from '@/lib/printing';

type PrinterUiState = 'unsupported' | 'unpaired' | 'paired' | 'error' | 'busy';

/**
 * Emparejado de impresora térmica USB en la top bar: icono + indicador de estado.
 */
const PrinterSetupButton: React.FC = () => {
  const [supported, setSupported] = useState(false);
  const [paired, setPaired] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    if (!isWebUsbSupported()) {
      setSupported(false);
      setPaired(false);
      return;
    }
    setSupported(true);
    try {
      setPaired(await hasPairedPrinter());
    } catch {
      setPaired(false);
    }
  }, []);

  useEffect(() => {
    void refresh();

    if (!isWebUsbSupported()) return;

    const onChange = () => {
      void refresh();
    };
    navigator.usb.addEventListener('connect', onChange);
    navigator.usb.addEventListener('disconnect', onChange);
    return () => {
      navigator.usb.removeEventListener('connect', onChange);
      navigator.usb.removeEventListener('disconnect', onChange);
    };
  }, [refresh]);

  useEffect(() => {
    if (!showHint) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (rootRef.current && target && !rootRef.current.contains(target)) {
        setShowHint(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [showHint]);

  const uiState: PrinterUiState = busy
    ? 'busy'
    : !supported
      ? 'unsupported'
      : error
        ? 'error'
        : paired
          ? 'paired'
          : 'unpaired';

  const ariaLabel =
    uiState === 'busy'
      ? 'Emparejando impresora'
      : uiState === 'unsupported'
        ? 'Impresora USB no disponible en este navegador'
        : uiState === 'error'
          ? 'Error de impresora; toca para ver detalle'
          : uiState === 'paired'
            ? 'Impresora USB emparejada; toca para volver a emparejar'
            : 'Emparejar impresora térmica USB';

  const handleClick = async () => {
    setError(null);
    if (!supported) {
      setShowHint(true);
      return;
    }
    setBusy(true);
    setShowHint(false);
    try {
      await pairPrinter();
      setPaired(true);
      setError(null);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string'
          ? (err as { message: string }).message
          : 'No fue posible emparejar la impresora.';
      setError(message);
      setPaired(false);
      setShowHint(true);
    } finally {
      setBusy(false);
    }
  };

  const iconClass =
    uiState === 'unsupported'
      ? 'text-muted-foreground opacity-50'
      : uiState === 'error'
        ? 'text-red-600'
        : uiState === 'paired'
          ? 'text-primary'
          : 'text-foreground group-hover:text-secondary';

  const statusDotClass =
    uiState === 'paired'
      ? 'bg-emerald-500'
      : uiState === 'error'
        ? 'bg-red-500'
        : uiState === 'unsupported'
          ? 'bg-neutral-400'
          : 'bg-amber-400';

  const showStatusDot = uiState !== 'busy';

  return (
    <div className="relative" ref={rootRef} data-test-id="topbar-printer-setup">
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        title={ariaLabel}
        aria-label={ariaLabel}
        aria-busy={busy || undefined}
        className="group relative flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10 transition-colors duration-200 hover:bg-secondary/20 focus:outline-none disabled:cursor-wait disabled:opacity-70"
        data-test-id="topbar-printer-button"
      >
        {busy ? (
          <DotProgress
            variant="wave"
            count={3}
            size={5}
            gap={2}
            colorPrimary="currentColor"
            colorNeutral="currentColor"
            className="fs-button__loading-dots text-foreground"
          />
        ) : (
          <Printer size={28} className={`transition-colors duration-200 ${iconClass}`} aria-hidden />
        )}
        {showStatusDot ? (
          <span
            className={`absolute bottom-1 right-1 h-2 w-2 rounded-full ring-2 ring-background ${statusDotClass}`}
            aria-hidden
            data-test-id="topbar-printer-status-dot"
            data-state={uiState}
          />
        ) : null}
      </button>

      {showHint && (error || !supported) ? (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-md border border-border bg-white p-3 text-xs shadow-lg"
          role="status"
          data-test-id="topbar-printer-hint"
        >
          {!supported ? (
            <p className="text-muted-foreground">
              Ticket USB requiere Chrome o Edge en HTTPS o localhost. En mobile suele no estar disponible.
            </p>
          ) : (
            <p className="text-red-600">{error}</p>
          )}
          <button
            type="button"
            className="mt-2 text-primary underline"
            onClick={() => setShowHint(false)}
          >
            Cerrar
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default PrinterSetupButton;
