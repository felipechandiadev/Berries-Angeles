/**
 * Web Bluetooth (BLE) transport for ESC/POS thermal ticket printers.
 * Requires Chrome/Edge on HTTPS or localhost and a user gesture to pair.
 */

import { localizePrinterError } from './localizePrinterError';

export class WebBluetoothPrinterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WebBluetoothPrinterError';
  }
}

/** Common thermal / UART-over-BLE services we may need to access after acceptAllDevices. */
const OPTIONAL_SERVICES: BluetoothServiceUUID[] = [
  '000018f0-0000-1000-8000-00805f9b34fb',
  '49535343-fe7d-4ae5-8fa9-9fafd205e455',
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
  '0000ff00-0000-1000-8000-00805f9b34fb',
  '0000ae30-0000-1000-8000-00805f9b34fb',
  '0000ffe0-0000-1000-8000-00805f9b34fb',
  '0000fff0-0000-1000-8000-00805f9b34fb',
  'battery_service',
  'device_information',
];

const CHUNK_SIZE = 20;
const CHUNK_DELAY_MS = 12;

let cachedDevice: BluetoothDevice | null = null;

export function isWebBluetoothSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    Boolean(navigator.bluetooth) &&
    typeof navigator.bluetooth.requestDevice === 'function'
  );
}

function getBluetooth(): Bluetooth {
  if (!isWebBluetoothSupported()) {
    throw new WebBluetoothPrinterError(
      'Web Bluetooth no está disponible. Usa Chrome o Edge en HTTPS o localhost.'
    );
  }
  return navigator.bluetooth;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function listPairedBluetoothPrinters(): Promise<BluetoothDevice[]> {
  const bluetooth = getBluetooth();
  if (typeof bluetooth.getDevices !== 'function') {
    return cachedDevice ? [cachedDevice] : [];
  }
  try {
    const devices = await bluetooth.getDevices();
    return devices;
  } catch {
    return cachedDevice ? [cachedDevice] : [];
  }
}

export async function hasPairedBluetoothPrinter(): Promise<boolean> {
  if (!isWebBluetoothSupported()) return false;
  const devices = await listPairedBluetoothPrinters();
  return devices.length > 0 || Boolean(cachedDevice);
}

async function findWritableCharacteristic(
  server: BluetoothRemoteGATTServer
): Promise<BluetoothRemoteGATTCharacteristic> {
  const services = await server.getPrimaryServices();
  for (const service of services) {
    let characteristics: BluetoothRemoteGATTCharacteristic[];
    try {
      characteristics = await service.getCharacteristics();
    } catch {
      continue;
    }
    const writable = characteristics.find(
      (c) => c.properties.writeWithoutResponse || c.properties.write
    );
    if (writable) return writable;
  }
  throw new WebBluetoothPrinterError(
    'La impresora Bluetooth no expone una característica GATT de escritura ESC/POS.'
  );
}

async function connectDevice(
  device: BluetoothDevice
): Promise<BluetoothRemoteGATTCharacteristic> {
  if (!device.gatt) {
    throw new WebBluetoothPrinterError('El dispositivo Bluetooth no expone GATT.');
  }
  const server = device.gatt.connected
    ? device.gatt
    : await device.gatt.connect();
  return findWritableCharacteristic(server);
}

/**
 * Opens the browser BLE device chooser. Must be called from a user gesture.
 */
export async function requestBluetoothPrinter(): Promise<BluetoothDevice> {
  const bluetooth = getBluetooth();
  try {
    const device = await bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: OPTIONAL_SERVICES,
    });
    // Verify we can open a writable characteristic before accepting.
    await connectDevice(device);
    cachedDevice = device;
    device.addEventListener('gattserverdisconnected', () => {
      if (cachedDevice === device) {
        // keep permission; reconnect on next print
      }
    });
    return device;
  } catch (error: unknown) {
    if (error instanceof WebBluetoothPrinterError) throw error;
    throw new WebBluetoothPrinterError(
      localizePrinterError(error, 'No fue posible emparejar la impresora Bluetooth.')
    );
  }
}

/**
 * Reuse already-authorized BLE devices first; only open the picker if none connect.
 */
export async function pairBluetoothPrinter(): Promise<BluetoothDevice> {
  const existing = await listPairedBluetoothPrinters();
  for (const device of existing) {
    try {
      await connectDevice(device);
      cachedDevice = device;
      return device;
    } catch {
      // try next authorized device, then fall through to picker
    }
  }
  return requestBluetoothPrinter();
}

async function resolveDevice(preferRequestIfEmpty = false): Promise<BluetoothDevice> {
  if (cachedDevice) return cachedDevice;
  const paired = await listPairedBluetoothPrinters();
  if (paired.length > 0) {
    cachedDevice = paired[0];
    return paired[0];
  }
  if (preferRequestIfEmpty) {
    return requestBluetoothPrinter();
  }
  throw new WebBluetoothPrinterError(
    'No hay impresora Bluetooth emparejada. Emparejala desde el botón Impresora en la barra superior.'
  );
}

async function writeChunks(
  characteristic: BluetoothRemoteGATTCharacteristic,
  data: Uint8Array
): Promise<void> {
  const useWithoutResponse = Boolean(characteristic.properties.writeWithoutResponse);
  for (let offset = 0; offset < data.length; offset += CHUNK_SIZE) {
    const chunk = data.subarray(offset, offset + CHUNK_SIZE);
    const payload = new Uint8Array(chunk);
    if (useWithoutResponse) {
      await characteristic.writeValueWithoutResponse(payload);
    } else {
      await characteristic.writeValueWithResponse(payload);
    }
    if (offset + CHUNK_SIZE < data.length) {
      await sleep(CHUNK_DELAY_MS);
    }
  }
}

/**
 * Sends raw ESC/POS bytes to a paired (or newly requested) BLE printer.
 */
export async function printRawBluetooth(
  data: Uint8Array,
  options?: { requestIfMissing?: boolean }
): Promise<void> {
  if (!data || data.length === 0) {
    throw new WebBluetoothPrinterError('No hay datos para imprimir.');
  }

  const device = await resolveDevice(Boolean(options?.requestIfMissing));
  try {
    const characteristic = await connectDevice(device);
    cachedDevice = device;
    await writeChunks(characteristic, data);
  } catch (error: unknown) {
    if (error instanceof WebBluetoothPrinterError) throw error;
    throw new WebBluetoothPrinterError(
      localizePrinterError(error, 'Error enviando el ticket por Bluetooth.')
    );
  }
}
