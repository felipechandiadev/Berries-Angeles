'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bluetooth, Cable, Printer, Usb } from 'lucide-react';
import DotProgress from '@/app/baseComponents/DotProgress/DotProgress';
import {
  getLinkedPrinterInfo,
  getStoredPrinterName,
  isAnyTicketTransportSupported,
  isWebSerialSupported,
  isWebUsbSupported,
  listSupportedTransports,
  pairPrinter,
  PRINTER_TRANSPORT_LABELS,
  type PrinterTransportKind,
} from '@/lib/printing';
import { TopBarIconSkeleton } from './TopBarIconSkeleton';

type PrinterUiState = 'unsupported' | 'unpaired' | 'paired' | 'error' | 'busy';

const TRANSPORT_ICONS: Record<
  PrinterTransportKind,
  React.ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean }>
> = {
  usb: Usb,
  bluetooth: Bluetooth,
  serial: Cable,
};

/**
 * Emparejado de impresora térmica (USB / Bluetooth LE / Serial) en la top bar.
 * El menú pide el transporte; no encadena pickers del browser.
 */
const PrinterSetupButton: React.FC = () => {
  const [ready, setReady] = useState(false);
  const [supported, setSupported] = useState(false);
  const [paired, setPaired] = useState(false);
  const [printerName, setPrinterName] = useState<string | null>(null);
  const [printerKind, setPrinterKind] = useState<PrinterTransportKind | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const transports = listSupportedTransports();

  const refresh = useCallback(async () => {
    if (!isAnyTicketTransportSupported()) {
      setSupported(false);
      setPaired(false);
      setPrinterName(null);
      setPrinterKind(null);
      setReady(true);
      return;
    }
    setSupported(true);
    try {
      const info = await getLinkedPrinterInfo();
      setPaired(info.paired);
      setPrinterName(info.name ?? (info.paired ? getStoredPrinterName() : null));
      setPrinterKind(info.kind);
    } catch {
      setPaired(false);
      setPrinterName(null);
      setPrinterKind(null);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refresh();

    const onChange = () => {
      void refresh();
    };

    if (isWebUsbSupported()) {
      navigator.usb.addEventListener('connect', onChange);
      navigator.usb.addEventListener('disconnect', onChange);
    }
    if (isWebSerialSupported() && navigator.serial) {
      navigator.serial.addEventListener('connect', onChange);
      navigator.serial.addEventListener('disconnect', onChange);
    }

    return () => {
      if (isWebUsbSupported()) {
        navigator.usb.removeEventListener('connect', onChange);
        navigator.usb.removeEventListener('disconnect', onChange);
      }
      if (isWebSerialSupported() && navigator.serial) {
        navigator.serial.removeEventListener('connect', onChange);
        navigator.serial.removeEventListener('disconnect', onChange);
      }
    };
  }, [refresh]);

  useEffect(() => {
    if (!menuOpen) return;
    void refresh();
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (rootRef.current && target && !rootRef.current.contains(target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [menuOpen, refresh]);

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
        ? 'Impresora térmica no disponible en este navegador'
        : uiState === 'error'
          ? 'Error de impresora; toca para ver opciones'
          : uiState === 'paired'
            ? `Impresora vinculada${printerName ? `: ${printerName}` : ''}`
            : 'Emparejar impresora: elegí USB, Bluetooth o Serial';

  const handleOpenMenu = () => {
    setError(null);
    if (!supported) {
      setMenuOpen(true);
      return;
    }
    setMenuOpen((open) => !open);
  };

  const handlePair = async (kind: PrinterTransportKind) => {
    setError(null);
    setBusy(true);
    try {
      await pairPrinter(kind);
      await refresh();
      setError(null);
      setMenuOpen(false);
    } catch (err: unknown) {
      const raw =
        err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string'
          ? (err as { message: string }).message
          : 'No fue posible emparejar la impresora.';
      const message = /unsupported\s*device/i.test(raw)
        ? 'Dispositivo no soportado. En USB elegí el dispositivo en el selector de Chrome (el emparejado del sistema no alcanza). Si sigue fallando, probá Bluetooth o Serial desde el menú.'
        : raw;
      setError(message);
      await refresh();
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
  const linkedLabel = printerName?.trim()
    ? printerName.trim()
    : paired
      ? 'Impresora vinculada'
      : 'Sin impresora vinculada';
  const linkedKindLabel = printerKind ? PRINTER_TRANSPORT_LABELS[printerKind] : null;

  if (!ready) {
    return <TopBarIconSkeleton kind="printer" testId="topbar-printer-skeleton" />;
  }

  return (
    <div className="relative" ref={rootRef} data-test-id="topbar-printer-setup">
      <button
        type="button"
        onClick={handleOpenMenu}
        disabled={busy}
        title={ariaLabel}
        aria-label={ariaLabel}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        aria-busy={busy || undefined}
        className="group relative flex h-9 w-9 items-center justify-center rounded-full bg-secondary/10 transition-colors duration-200 hover:bg-secondary/20 focus:outline-none disabled:cursor-wait disabled:opacity-70"
        data-test-id="topbar-printer-button"
      >
        {busy ? (
          <DotProgress
            variant="wave"
            count={3}
            size={4}
            gap={2}
            colorPrimary="currentColor"
            colorNeutral="currentColor"
            className="fs-button__loading-dots text-foreground"
          />
        ) : (
          <Printer size={22} className={`transition-colors duration-200 ${iconClass}`} aria-hidden />
        )}
        {showStatusDot ? (
          <span
            className={`absolute bottom-0.5 right-0.5 h-1.5 w-1.5 rounded-full ring-2 ring-background ${statusDotClass}`}
            aria-hidden
            data-test-id="topbar-printer-status-dot"
            data-state={uiState}
          />
        ) : null}
      </button>

      {menuOpen ? (
        <div
          className="absolute right-0 top-full z-50 -mt-0.5 w-72 max-w-[calc(100vw-2rem)] rounded-md border border-border bg-white text-sm shadow-lg"
          role="menu"
          data-test-id="topbar-printer-menu"
        >
          <div
            className="flex items-center gap-2 border-b border-border bg-neutral-50 px-3 py-2"
            data-test-id="topbar-printer-linked-bar"
          >
            <Printer size={16} className="shrink-0 text-foreground" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-foreground" title={linkedLabel}>
                {linkedLabel}
              </p>
              {linkedKindLabel ? (
                <p className="truncate text-xs text-muted-foreground">{linkedKindLabel}</p>
              ) : null}
            </div>
          </div>

          <div className="p-2">
            {!supported ? (
              <p className="px-2 pb-2 text-xs text-muted-foreground">
                Requiere Chrome o Edge en HTTPS o localhost. En iOS/Safari suele no estar disponible.
              </p>
            ) : (
              <ul className="flex flex-col gap-1">
                {transports.map((kind) => {
                  const Icon = TRANSPORT_ICONS[kind];
                  const selected = paired && printerKind === kind;
                  return (
                    <li key={kind}>
                      <button
                        type="button"
                        role="menuitem"
                        disabled={busy}
                        onClick={() => void handlePair(kind)}
                        className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left focus:outline-none focus:ring-2 focus:ring-secondary/40 disabled:opacity-60 ${
                          selected ? 'bg-secondary/15' : 'hover:bg-neutral-100'
                        }`}
                        data-test-id={`topbar-printer-pair-${kind}`}
                      >
                        <Icon size={18} className="shrink-0 text-foreground" aria-hidden />
                        <span className="min-w-0 font-medium text-foreground">
                          {PRINTER_TRANSPORT_LABELS[kind]}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {error ? (
              <p className="mt-2 border-t border-border px-2 pt-2 text-xs text-red-600" role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="button"
              className="mt-2 w-full px-2 py-1 text-left text-xs text-primary underline"
              onClick={() => setMenuOpen(false)}
            >
              Cerrar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default PrinterSetupButton;
