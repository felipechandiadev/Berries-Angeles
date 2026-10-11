export { EscPosEncoder } from './escpos';
export type { EscPosAlign } from './escpos';

export {
  WebUsbPrinterError,
  isWebUsbSupported,
  listPairedPrinters,
  requestPrinter,
} from './webUsbPrinter';

export {
  WebBluetoothPrinterError,
  isWebBluetoothSupported,
  hasPairedBluetoothPrinter,
  listPairedBluetoothPrinters,
  requestBluetoothPrinter,
  pairBluetoothPrinter,
  printRawBluetooth,
} from './webBluetoothPrinter';

export {
  WebSerialPrinterError,
  isWebSerialSupported,
  hasPairedSerialPrinter,
  listPairedSerialPrinters,
  requestSerialPrinter,
  pairSerialPrinter,
  printRawSerial,
} from './webSerialPrinter';

export {
  PrinterTransportError,
  isAnyTicketTransportSupported,
  isKindSupported,
  listSupportedTransports,
  hasPairedPrinter,
  getLinkedPrinterInfo,
  pairPrinter,
  printRaw,
  getPreferredTransport,
  setPreferredTransport,
  getStoredPrinterName,
  setStoredPrinterName,
  PRINTER_TRANSPORT_HINTS,
  PRINTER_TRANSPORT_LABELS,
  PRINTER_TRANSPORT_ORDER,
} from './printerTransport';
export type { PrinterTransportKind } from './types';
export type { LinkedPrinterInfo } from './printerTransport';

export {
  buildReceptionTicketEscPos,
  buildClassicReceptionTicketEscPos,
  buildMultipackReceptionTicketEscPos,
  resolveReceptionTicketDate,
  resolveTicketHeaderParties,
} from './receptionTicket';
export type {
  ReceptionTicketSnapshot,
  TicketPack,
  TicketPalletAssignment,
  TicketProducer,
  TicketTotals,
  TicketTrayDevolution,
} from './receptionTicket';

export { getPrintLogoRaster } from './logo';
export type { EscPosRaster } from './logo';

export { COMPANY_PRINT_HEADER } from './companyHeader';

export {
  aggregatePalletLines,
  applyPrintProfile,
  getDefaultReceptionPrintOptions,
  loadReceptionPrintOptions,
  saveReceptionPrintOptions,
  PRINT_PROFILE_LABELS,
} from './printOptions';
export type {
  AggregatedPalletLine,
  ReceptionPrintOptions,
  ReceptionPrintProfile,
} from './printOptions';
