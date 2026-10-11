/**
 * Multi-transport facade for ESC/POS ticket printing:
 * USB (WebUSB) → Bluetooth LE (Web Bluetooth) → Serial (Web Serial / Classic).
 */

import {
  PRINTER_TRANSPORT_LABELS,
  PRINTER_TRANSPORT_ORDER,
  type PrinterTransportKind,
} from './types';
import {
  hasPairedPrinter as hasPairedUsbPrinter,
  isWebUsbSupported,
  listPairedPrinters as listPairedUsbPrinters,
  pairPrinter as pairUsbPrinter,
  printRaw as printRawUsb,
} from './webUsbPrinter';
import {
  hasPairedBluetoothPrinter,
  isWebBluetoothSupported,
  listPairedBluetoothPrinters,
  pairBluetoothPrinter,
  printRawBluetooth,
} from './webBluetoothPrinter';
import {
  hasPairedSerialPrinter,
  isWebSerialSupported,
  listPairedSerialPrinters,
  pairSerialPrinter,
  printRawSerial,
} from './webSerialPrinter';
import { localizePrinterError } from './localizePrinterError';

export type { PrinterTransportKind } from './types';
export {
  PRINTER_TRANSPORT_HINTS,
  PRINTER_TRANSPORT_LABELS,
  PRINTER_TRANSPORT_ORDER,
} from './types';

export type LinkedPrinterInfo = {
  paired: boolean;
  kind: PrinterTransportKind | null;
  name: string | null;
};

const PREF_KEY = 'berries.printer.transport';
const NAME_KEY = 'berries.printer.name';

export class PrinterTransportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PrinterTransportError';
  }
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function readStorage(key: string): string | null {
  if (!isBrowser()) return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string | null): void {
  if (!isBrowser()) return;
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // ignore quota / private mode
  }
}

function isTransportKind(value: string | null): value is PrinterTransportKind {
  return value === 'usb' || value === 'bluetooth' || value === 'serial';
}

export function getPreferredTransport(): PrinterTransportKind | null {
  const value = readStorage(PREF_KEY);
  return isTransportKind(value) ? value : null;
}

export function setPreferredTransport(kind: PrinterTransportKind | null): void {
  writeStorage(PREF_KEY, kind);
}

export function getStoredPrinterName(): string | null {
  return readStorage(NAME_KEY);
}

export function setStoredPrinterName(name: string | null): void {
  writeStorage(NAME_KEY, name);
}

async function resolveNameForKind(kind: PrinterTransportKind): Promise<string> {
  switch (kind) {
    case 'usb': {
      const devices = await listPairedUsbPrinters();
      const device = devices[0];
      const product = device?.productName?.trim();
      const manufacturer = device?.manufacturerName?.trim();
      if (product && manufacturer) return `${product} (${manufacturer})`;
      return product || manufacturer || 'Impresora USB';
    }
    case 'bluetooth': {
      const devices = await listPairedBluetoothPrinters();
      const device = devices[0];
      return device?.name?.trim() || 'Impresora Bluetooth';
    }
    case 'serial': {
      const ports = await listPairedSerialPrinters();
      const port = ports[0];
      if (!port) return 'Puerto serial';
      const info = port.getInfo();
      if (info.usbVendorId != null && info.usbProductId != null) {
        const vid = info.usbVendorId.toString(16).padStart(4, '0');
        const pid = info.usbProductId.toString(16).padStart(4, '0');
        return `Serial USB ${vid}:${pid}`;
      }
      return 'Puerto serial';
    }
  }
}

/**
 * Active linked printer for UI. Browser permissions persist across sessions
 * for the same origin; we also cache the display name in localStorage.
 */
export async function getLinkedPrinterInfo(): Promise<LinkedPrinterInfo> {
  if (!isAnyTicketTransportSupported()) {
    return { paired: false, kind: null, name: null };
  }

  const preferred = getPreferredTransport();
  const order = preferred
    ? ([preferred, ...PRINTER_TRANSPORT_ORDER.filter((k) => k !== preferred)] as PrinterTransportKind[])
    : PRINTER_TRANSPORT_ORDER;

  for (const kind of order) {
    if (!(await hasPairedKind(kind))) continue;
    try {
      const name = await resolveNameForKind(kind);
      setStoredPrinterName(name);
      return { paired: true, kind, name };
    } catch {
      const stored = getStoredPrinterName();
      return {
        paired: true,
        kind,
        name: stored || PRINTER_TRANSPORT_LABELS[kind],
      };
    }
  }

  setStoredPrinterName(null);
  return { paired: false, kind: null, name: null };
}

export function isAnyTicketTransportSupported(): boolean {
  return (
    isWebUsbSupported() || isWebBluetoothSupported() || isWebSerialSupported()
  );
}

export function isKindSupported(kind: PrinterTransportKind): boolean {
  switch (kind) {
    case 'usb':
      return isWebUsbSupported();
    case 'bluetooth':
      return isWebBluetoothSupported();
    case 'serial':
      return isWebSerialSupported();
  }
}

/** Transports available in this browser (for the TopBar pair menu). */
export function listSupportedTransports(): PrinterTransportKind[] {
  return PRINTER_TRANSPORT_ORDER.filter(isKindSupported);
}

async function hasPairedKind(kind: PrinterTransportKind): Promise<boolean> {
  if (!isKindSupported(kind)) return false;
  switch (kind) {
    case 'usb':
      return hasPairedUsbPrinter();
    case 'bluetooth':
      return hasPairedBluetoothPrinter();
    case 'serial':
      return hasPairedSerialPrinter();
  }
}

export async function hasPairedPrinter(): Promise<boolean> {
  if (!isAnyTicketTransportSupported()) return false;
  for (const kind of PRINTER_TRANSPORT_ORDER) {
    if (await hasPairedKind(kind)) return true;
  }
  return false;
}

function errorMessage(error: unknown, fallback: string): string {
  return localizePrinterError(error, fallback);
}

async function pairKind(kind: PrinterTransportKind): Promise<void> {
  switch (kind) {
    case 'usb':
      await pairUsbPrinter();
      break;
    case 'bluetooth':
      await pairBluetoothPrinter();
      break;
    case 'serial':
      await pairSerialPrinter();
      break;
  }
}

async function printKind(
  kind: PrinterTransportKind,
  data: Uint8Array,
  options?: { requestIfMissing?: boolean }
): Promise<void> {
  switch (kind) {
    case 'usb':
      await printRawUsb(data, options);
      break;
    case 'bluetooth':
      await printRawBluetooth(data, options);
      break;
    case 'serial':
      await printRawSerial(data, options);
      break;
  }
}

function orderFrom(start: PrinterTransportKind | null): PrinterTransportKind[] {
  const supported = PRINTER_TRANSPORT_ORDER.filter(isKindSupported);
  if (!start) return supported;
  const idx = supported.indexOf(start);
  if (idx <= 0) return supported;
  return [...supported.slice(idx), ...supported.slice(0, idx)];
}

/**
 * Pair a specific transport (USB / Bluetooth / Serial).
 * Bluetooth reuses already-authorized BLE devices before opening the picker.
 */
export async function pairPrinter(
  kind: PrinterTransportKind
): Promise<PrinterTransportKind> {
  if (!isAnyTicketTransportSupported()) {
    throw new PrinterTransportError(
      'Ningún transporte de ticket está disponible. Usa Chrome o Edge en HTTPS o localhost (USB, Bluetooth LE o Serial).'
    );
  }
  if (!isKindSupported(kind)) {
    throw new PrinterTransportError(
      `${PRINTER_TRANSPORT_LABELS[kind]} no está disponible en este navegador.`
    );
  }

  try {
    await pairKind(kind);
    setPreferredTransport(kind);
    try {
      setStoredPrinterName(await resolveNameForKind(kind));
    } catch {
      setStoredPrinterName(PRINTER_TRANSPORT_LABELS[kind]);
    }
    return kind;
  } catch (error: unknown) {
    throw new PrinterTransportError(
      errorMessage(error, `Error emparejando ${PRINTER_TRANSPORT_LABELS[kind]}.`)
    );
  }
}

/**
 * Sends ESC/POS bytes using the preferred/authorized transport.
 * Falls back across authorized transports; optionally pairs if missing.
 */
export async function printRaw(
  data: Uint8Array,
  options?: { requestIfMissing?: boolean }
): Promise<void> {
  if (!data || data.length === 0) {
    throw new PrinterTransportError('No hay datos para imprimir.');
  }
  if (!isAnyTicketTransportSupported()) {
    throw new PrinterTransportError(
      'Ningún transporte de ticket está disponible. Usa Chrome o Edge en HTTPS o localhost.'
    );
  }

  const preferred = getPreferredTransport();
  const tryOrder = orderFrom(preferred);
  const authorized: PrinterTransportKind[] = [];
  for (const kind of tryOrder) {
    if (await hasPairedKind(kind)) authorized.push(kind);
  }

  const errors: string[] = [];
  for (const kind of authorized) {
    try {
      await printKind(kind, data, { requestIfMissing: false });
      setPreferredTransport(kind);
      return;
    } catch (error: unknown) {
      errors.push(
        `${PRINTER_TRANSPORT_LABELS[kind]}: ${errorMessage(error, 'falló')}`
      );
    }
  }

  if (options?.requestIfMissing) {
    const kind = getPreferredTransport() ?? listSupportedTransports()[0];
    if (!kind) {
      throw new PrinterTransportError(
        'Ningún transporte de ticket está disponible. Usa Chrome o Edge en HTTPS o localhost.'
      );
    }
    await pairPrinter(kind);
    await printKind(kind, data, { requestIfMissing: false });
    setPreferredTransport(kind);
    return;
  }

  if (errors.length > 0) {
    throw new PrinterTransportError(
      `No se pudo imprimir. ${errors.join(' · ')}. Emparejá la impresora desde la barra superior.`
    );
  }

  throw new PrinterTransportError(
    'No hay impresora emparejada. Elegí USB, Bluetooth o Serial en el botón Impresora de la barra superior.'
  );
}
