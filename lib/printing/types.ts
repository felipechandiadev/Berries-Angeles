export type PrinterTransportKind = 'usb' | 'bluetooth' | 'serial';

export const PRINTER_TRANSPORT_ORDER: PrinterTransportKind[] = [
  'usb',
  'bluetooth',
  'serial',
];

export const PRINTER_TRANSPORT_LABELS: Record<PrinterTransportKind, string> = {
  usb: 'USB',
  bluetooth: 'Bluetooth',
  serial: 'Serial / COM',
};

export const PRINTER_TRANSPORT_HINTS: Record<PrinterTransportKind, string> = {
  usb: 'Cable USB (permiso del navegador)',
  bluetooth: 'Bluetooth LE (prioriza ya autorizados)',
  serial: 'Puerto COM (Bluetooth Classic del sistema)',
};
