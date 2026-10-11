/**
 * Web Serial transport for ESC/POS printers exposed as COM/serial
 * (including many Bluetooth Classic printers after OS pairing).
 */

import { localizePrinterError } from './localizePrinterError';

export class WebSerialPrinterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WebSerialPrinterError';
  }
}

const DEFAULT_BAUD_RATE = 9600;

export function isWebSerialSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    Boolean(navigator.serial) &&
    typeof navigator.serial.requestPort === 'function'
  );
}

function getSerial(): Serial {
  if (!isWebSerialSupported()) {
    throw new WebSerialPrinterError(
      'Web Serial no está disponible. Usa Chrome o Edge en HTTPS o localhost.'
    );
  }
  return navigator.serial;
}

export async function listPairedSerialPrinters(): Promise<SerialPort[]> {
  const serial = getSerial();
  return serial.getPorts();
}

export async function hasPairedSerialPrinter(): Promise<boolean> {
  if (!isWebSerialSupported()) return false;
  const ports = await listPairedSerialPrinters();
  return ports.length > 0;
}

/**
 * Opens the browser serial port chooser. Must be called from a user gesture.
 */
export async function requestSerialPrinter(): Promise<SerialPort> {
  const serial = getSerial();
  try {
    const port = await serial.requestPort();
    if (!port.writable) {
      await port.open({ baudRate: DEFAULT_BAUD_RATE });
    }
    return port;
  } catch (error: unknown) {
    throw new WebSerialPrinterError(
      localizePrinterError(error, 'No fue posible emparejar el puerto serial.')
    );
  }
}

export async function pairSerialPrinter(): Promise<SerialPort> {
  return requestSerialPrinter();
}

async function resolvePort(preferRequestIfEmpty = false): Promise<SerialPort> {
  const paired = await listPairedSerialPrinters();
  if (paired.length > 0) {
    return paired[0];
  }
  if (preferRequestIfEmpty) {
    return requestSerialPrinter();
  }
  throw new WebSerialPrinterError(
    'No hay puerto serial emparejado. Emparejalo desde el botón Impresora en la barra superior (impresoras Bluetooth Classic suelen aparecer aquí).'
  );
}

async function ensureOpen(port: SerialPort): Promise<void> {
  if (!port.writable) {
    await port.open({ baudRate: DEFAULT_BAUD_RATE });
  }
}

/**
 * Sends raw ESC/POS bytes to a paired (or newly requested) serial port.
 */
export async function printRawSerial(
  data: Uint8Array,
  options?: { requestIfMissing?: boolean }
): Promise<void> {
  if (!data || data.length === 0) {
    throw new WebSerialPrinterError('No hay datos para imprimir.');
  }

  const port = await resolvePort(Boolean(options?.requestIfMissing));
  try {
    await ensureOpen(port);
    if (!port.writable) {
      throw new WebSerialPrinterError('El puerto serial no está listo para escribir.');
    }
    const writer = port.writable.getWriter();
    try {
      await writer.write(data);
    } finally {
      writer.releaseLock();
    }
  } catch (error: unknown) {
    if (error instanceof WebSerialPrinterError) throw error;
    throw new WebSerialPrinterError(
      localizePrinterError(error, 'Error enviando el ticket por serial.')
    );
  }
}
