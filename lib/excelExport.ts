import * as XLSX from 'xlsx';
import { formatAuditDate } from './dateTimeUtils';
import moment from 'moment-timezone';

export interface AuditExcelRow {
  id: string;
  entityName: string;
  action: string;
  description: string;
  userId: string | null;
  createdAt: string;
  oldValues: string;
  newValues: string;
}

export interface ExcelExportOptions {
  fileName?: string;
  sheetName?: string;
  maxRows?: number;
}

/**
 * Formatea datos de auditoría para exportar a Excel
 */
export function formatAuditDataForExcel(auditData: any[]): AuditExcelRow[] {
  return auditData.map((audit) => ({
    id: audit.id,
    entityName: audit.entityName,
    action: audit.action,
    description: audit.description || '-',
    userId: audit.userId || '-',
    createdAt: typeof audit.createdAt === 'string' 
      ? formatAuditDate(audit.createdAt)
      : formatAuditDate(audit.createdAt),
    oldValues: audit.oldValues ? JSON.stringify(audit.oldValues, null, 2) : '-',
    newValues: audit.newValues ? JSON.stringify(audit.newValues, null, 2) : '-',
  }));
}

/**
 * Crea un workbook de Excel con estilos
 */
export function createAuditWorkbook(data: AuditExcelRow[], options: ExcelExportOptions = {}) {
  const {
    sheetName = 'Auditorías',
    maxRows = 10000,
  } = options;

  // Validar límite de filas
  if (data.length > maxRows) {
    console.warn(`Se limitaron los registros a ${maxRows} (total: ${data.length})`);
    data = data.slice(0, maxRows);
  }

  // Crear workbook
  const workbook = XLSX.utils.book_new();

  // Crear hoja de datos
  const dataSheet = XLSX.utils.json_to_sheet(data);

  // Aplicar estilos a los encabezados
  const headerStyle = {
    fill: { fgColor: { rgb: 'FF1F4E78' } }, // Azul oscuro
    font: { bold: true, color: { rgb: 'FFFFFFFF' } }, // Blanco
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    },
  };

  // Aplicar estilos a todas las celdas de encabezado
  const range = XLSX.utils.decode_range(dataSheet['!ref'] || 'A1');
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_col(C) + '1';
    if (!dataSheet[address]) continue;
    dataSheet[address].s = headerStyle;
  }

  // Establecer anchos de columna
  const colWidths = [
    { wch: 36 }, // id
    { wch: 15 }, // entityName
    { wch: 12 }, // action
    { wch: 30 }, // description
    { wch: 20 }, // userId
    { wch: 18 }, // createdAt
    { wch: 25 }, // oldValues
    { wch: 25 }, // newValues
  ];
  dataSheet['!cols'] = colWidths;

  // Agregar filtros automáticos
  dataSheet['!autofilter'] = { ref: XLSX.utils.encode_range(range) };

  // Agregar hoja al workbook
  XLSX.utils.book_append_sheet(workbook, dataSheet, sheetName);

  // Crear hoja de resumen (opcional)
  const summaryData = [
    { Métrica: 'Total de Registros', Valor: data.length },
    { Métrica: 'CREATE', Valor: data.filter((d) => d.action === 'CREATE').length },
    { Métrica: 'UPDATE', Valor: data.filter((d) => d.action === 'UPDATE').length },
    { Métrica: 'DELETE', Valor: data.filter((d) => d.action === 'DELETE').length },
  ];

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 25 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');

  return workbook;
}

/**
 * Genera un archivo Excel y lo descarga
 */
export function downloadExcelFile(workbook: XLSX.WorkBook, fileName: string) {
  try {
    XLSX.writeFile(workbook, fileName);
    return true;
  } catch (error) {
    console.error('Error descargando Excel:', error);
    return false;
  }
}

/**
 * Genera el nombre del archivo con timestamp
 */
export function generateExcelFileName(prefix = 'auditorias'): string {
  const timestamp = moment().format('DD-MM-YYYY_HHmmss');
  return `${prefix}_${timestamp}.xlsx`;
}

/**
 * Función principal para exportar auditoría a Excel
 */
export function exportAuditToExcel(
  auditData: any[],
  options: ExcelExportOptions = {}
) {
  try {
    // Formatear datos
    const formattedData = formatAuditDataForExcel(auditData);

    // Crear workbook
    const workbook = createAuditWorkbook(formattedData, options);

    // Generar nombre de archivo
    const fileName = options.fileName || generateExcelFileName('auditorias');

    // Descargar
    downloadExcelFile(workbook, fileName);

    return { success: true, fileName, recordCount: formattedData.length };
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * ============================================================
 * FUNCIONES PARA EXPORTAR UNIDADES PRODUCTIVAS A EXCEL
 * ============================================================
 */

export interface ProductiveUnitExcelRow {
  id: string;
  name: string;
  address: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Formatea datos de unidades productivas para exportar a Excel
 */
export function formatProductiveUnitsDataForExcel(unitsData: any[]): ProductiveUnitExcelRow[] {
  return unitsData.map((unit) => ({
    id: unit.id,
    name: unit.name || '-',
    address: unit.address || '-',
    description: unit.description || '-',
    createdAt: typeof unit.createdAt === 'string' 
      ? formatAuditDate(unit.createdAt)
      : formatAuditDate(unit.createdAt),
    updatedAt: typeof unit.updatedAt === 'string' 
      ? formatAuditDate(unit.updatedAt)
      : formatAuditDate(unit.updatedAt),
  }));
}

/**
 * Crea un workbook de Excel para unidades productivas con estilos
 */
export function createProductiveUnitsWorkbook(data: ProductiveUnitExcelRow[], options: ExcelExportOptions = {}) {
  const {
    sheetName = 'Unidades Productivas',
    maxRows = 10000,
  } = options;

  // Validar límite de filas
  if (data.length > maxRows) {
    console.warn(`Se limitaron los registros a ${maxRows} (total: ${data.length})`);
    data = data.slice(0, maxRows);
  }

  // Crear workbook
  const workbook = XLSX.utils.book_new();

  // Crear hoja de datos con encabezados en español
  const dataWithHeaders = data.map(row => ({
    'ID': row.id,
    'Nombre': row.name,
    'Dirección': row.address,
    'Descripción': row.description,
    'Creado': row.createdAt,
    'Actualizado': row.updatedAt,
  }));

  const dataSheet = XLSX.utils.json_to_sheet(dataWithHeaders);

  // Aplicar estilos a los encabezados
  const headerStyle = {
    fill: { fgColor: { rgb: 'FF1F4E78' } }, // Azul oscuro
    font: { bold: true, color: { rgb: 'FFFFFFFF' } }, // Blanco
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    },
  };

  // Aplicar estilos a todas las celdas de encabezado
  const range = XLSX.utils.decode_range(dataSheet['!ref'] || 'A1');
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_col(C) + '1';
    if (!dataSheet[address]) continue;
    dataSheet[address].s = headerStyle;
  }

  // Establecer anchos de columna
  const colWidths = [
    { wch: 36 }, // ID
    { wch: 25 }, // Nombre
    { wch: 30 }, // Dirección
    { wch: 40 }, // Descripción
    { wch: 18 }, // Creado
    { wch: 18 }, // Actualizado
  ];
  dataSheet['!cols'] = colWidths;

  // Agregar filtros automáticos
  dataSheet['!autofilter'] = { ref: XLSX.utils.encode_range(range) };

  // Agregar hoja al workbook
  XLSX.utils.book_append_sheet(workbook, dataSheet, sheetName);

  // Crear hoja de resumen
  const summaryData = [
    { Métrica: 'Total de Registros', Valor: data.length },
  ];

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 25 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');

  return workbook;
}

/**
 * Función principal para exportar unidades productivas a Excel
 */
export function exportProductiveUnitsToExcel(
  unitsData: any[],
  options: ExcelExportOptions = {}
) {
  try {
    // Formatear datos
    const formattedData = formatProductiveUnitsDataForExcel(unitsData);

    // Crear workbook
    const workbook = createProductiveUnitsWorkbook(formattedData, options);

    // Generar nombre de archivo
    const fileName = options.fileName || generateExcelFileName('unidades_productivas');

    // Descargar
    downloadExcelFile(workbook, fileName);

    return { success: true, fileName, recordCount: formattedData.length };
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * ============================================================
 * FUNCIONES PARA EXPORTAR PALLETS A EXCEL
 * ============================================================
 */

export interface PalletExcelRow {
  id: number;
  storageName: string;
  trayName: string;
  traysQuantity: number;
  capacity: number;
  weight: number;
  dispatchWeight: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const PALLET_STATUS_LABEL_MAP: Record<string, string> = {
  AVAILABLE: 'Disponible',
  CLOSED: 'Cerrado',
  FULL: 'Completo',
  DISPATCHED: 'Despachado',
  Disponible: 'Disponible',
  Cerrado: 'Cerrado',
  Completo: 'Completo',
  Despachado: 'Despachado',
};

export function formatPalletsDataForExcel(palletsData: any[]): PalletExcelRow[] {
  return palletsData.map((pallet) => {
    const statusKey = typeof pallet.status === 'string' ? pallet.status : '';
    return {
      id: Number(pallet.id ?? 0),
      storageName: pallet.storageName || '-',
      trayName: pallet.trayName || '-',
      traysQuantity: Number(pallet.traysQuantity ?? 0),
      capacity: Number(pallet.capacity ?? 0),
      weight: Number(pallet.weight ?? 0),
      dispatchWeight: Number(pallet.dispatchWeight ?? 0),
      status: PALLET_STATUS_LABEL_MAP[statusKey] || statusKey || '-',
      createdAt: typeof pallet.createdAt === 'string'
        ? formatAuditDate(pallet.createdAt)
        : formatAuditDate(pallet.createdAt),
      updatedAt: typeof pallet.updatedAt === 'string'
        ? formatAuditDate(pallet.updatedAt)
        : formatAuditDate(pallet.updatedAt),
    };
  });
}

export function createPalletsWorkbook(data: PalletExcelRow[], options: ExcelExportOptions = {}) {
  const {
    sheetName = 'Pallets',
    maxRows = 10000,
  } = options;

  if (data.length > maxRows) {
    console.warn(`Se limitaron los registros a ${maxRows} (total: ${data.length})`);
    data = data.slice(0, maxRows);
  }

  const workbook = XLSX.utils.book_new();

  const dataWithHeaders = data.map(row => ({
    'ID': row.id,
    'Almacenamiento': row.storageName,
    'Bandeja': row.trayName,
    'Bandejas': row.traysQuantity,
    'Capacidad': row.capacity,
    'Peso inicial (kg)': row.weight,
    'Peso despacho (kg)': row.dispatchWeight,
    'Estado': row.status,
    'Creado': row.createdAt,
    'Actualizado': row.updatedAt,
  }));

  const dataSheet = XLSX.utils.json_to_sheet(dataWithHeaders);

  const headerStyle = {
    fill: { fgColor: { rgb: 'FF1F4E78' } },
    font: { bold: true, color: { rgb: 'FFFFFFFF' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    },
  };

  const range = XLSX.utils.decode_range(dataSheet['!ref'] || 'A1');
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_col(C) + '1';
    if (!dataSheet[address]) continue;
    dataSheet[address].s = headerStyle;
  }

  const colWidths = [
    { wch: 36 }, // ID
    { wch: 28 }, // Almacenamiento
    { wch: 24 }, // Bandeja
    { wch: 12 }, // Bandejas
    { wch: 12 }, // Capacidad
    { wch: 16 }, // Peso inicial
    { wch: 16 }, // Peso despacho
    { wch: 16 }, // Estado
    { wch: 18 }, // Creado
    { wch: 18 }, // Actualizado
  ];
  dataSheet['!cols'] = colWidths;

  dataSheet['!autofilter'] = { ref: XLSX.utils.encode_range(range) };

  XLSX.utils.book_append_sheet(workbook, dataSheet, sheetName);

  const summaryData = [
    { Métrica: 'Total de Registros', Valor: data.length },
  ];

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 25 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');

  return workbook;
}

export function exportPalletsToExcel(
  palletsData: any[],
  options: ExcelExportOptions = {}
) {
  try {
    const formattedData = formatPalletsDataForExcel(palletsData);
    const workbook = createPalletsWorkbook(formattedData, options);
    const fileName = options.fileName || generateExcelFileName('pallets');
    downloadExcelFile(workbook, fileName);

    return { success: true, fileName, recordCount: formattedData.length };
  } catch (error) {
    console.error('Error exporting pallets to Excel:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Interface for Producer Excel rows
 */
export interface ProducerExcelRow {
  id: string;
  name: string;
  dni: string;
  mail: string;
  phone: string;
  productiveUnit: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Format producer data for Excel export
 */
export function formatProducersDataForExcel(producersData: any[]): ProducerExcelRow[] {
  return producersData.map((producer) => ({
    id: producer.id,
    name: producer.name || '-',
    dni: producer.dni || '-',
    mail: producer.mail || '-',
    phone: producer.phone || '-',
    productiveUnit: producer.productiveUnit?.name || '-',
    createdAt: typeof producer.createdAt === 'string' 
      ? formatAuditDate(producer.createdAt)
      : formatAuditDate(producer.createdAt),
    updatedAt: typeof producer.updatedAt === 'string' 
      ? formatAuditDate(producer.updatedAt)
      : formatAuditDate(producer.updatedAt),
  }));
}

/**
 * Create Excel workbook for producers with styling
 */
export function createProducersWorkbook(data: ProducerExcelRow[], options: ExcelExportOptions = {}) {
  const {
    sheetName = 'Producers',
    maxRows = 10000,
  } = options;

  if (data.length > maxRows) {
    console.warn(`Limited records to ${maxRows} (total: ${data.length})`);
    data = data.slice(0, maxRows);
  }

  const workbook = XLSX.utils.book_new();

  const dataWithHeaders = data.map(row => ({
    'ID': row.id,
    'Name': row.name,
    'DNI': row.dni,
    'Email': row.mail,
    'Phone': row.phone,
    'Productive Unit': row.productiveUnit,
    'Created': row.createdAt,
    'Updated': row.updatedAt,
  }));

  const dataSheet = XLSX.utils.json_to_sheet(dataWithHeaders);

  const headerStyle = {
    fill: { fgColor: { rgb: 'FF1F4E78' } },
    font: { bold: true, color: { rgb: 'FFFFFFFF' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    },
  };

  const range = XLSX.utils.decode_range(dataSheet['!ref'] || 'A1');
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_col(C) + '1';
    if (!dataSheet[address]) continue;
    dataSheet[address].s = headerStyle;
  }

  const colWidths = [
    { wch: 36 }, // ID
    { wch: 25 }, // Name
    { wch: 15 }, // DNI
    { wch: 25 }, // Email
    { wch: 15 }, // Phone
    { wch: 25 }, // Productive Unit
    { wch: 18 }, // Created
    { wch: 18 }, // Updated
  ];
  dataSheet['!cols'] = colWidths;

  dataSheet['!autofilter'] = { ref: XLSX.utils.encode_range(range) };

  XLSX.utils.book_append_sheet(workbook, dataSheet, sheetName);

  const summaryData = [
    { Metric: 'Total Records', Value: data.length },
  ];

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 25 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  return workbook;
}

/**
 * Main function to export producers to Excel
 */
export function exportProducersToExcel(
  producersData: any[],
  options: ExcelExportOptions = {}
) {
  try {
    const formattedData = formatProducersDataForExcel(producersData);
    const workbook = createProducersWorkbook(formattedData, options);
    const fileName = options.fileName || generateExcelFileName('producers');
    downloadExcelFile(workbook, fileName);

    return { success: true, fileName, recordCount: formattedData.length };
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * ============================================================
 * FUNCIONES PARA EXPORTAR RECEPCIONES A EXCEL
 * ============================================================
 */

export interface ReceptionExcelRow {
  id: string;
  producerName: string;
  guideNumber: string;
  varieties: string;
  totalTrays: number;
  grossWeightKg: number;
  netWeightKg: number;
  payableCLP: number;
  payableUSD: number;
  exchangeRate: number;
  totalCLP: number;
  createdAt: string;
}

export function formatReceptionsDataForExcel(receptionsData: any[]): ReceptionExcelRow[] {
  return receptionsData.map((reception) => {
    const varieties = Array.isArray(reception.varieties)
      ? reception.varieties.filter((value: unknown) => typeof value === 'string' && value.trim() !== '').join(', ')
      : '-';

    return {
      id: typeof reception.id === 'string' ? reception.id : String(reception.id ?? ''),
      producerName: reception.producerName || '-',
      guideNumber: reception.guideNumber || '-',
      varieties: varieties || '-',
      totalTrays: Number(reception.totalTrays ?? 0),
      grossWeightKg: Number(reception.grossWeightKg ?? 0),
      netWeightKg: Number(reception.netWeightKg ?? 0),
      payableCLP: Number(reception.payableCLP ?? 0),
      payableUSD: Number(reception.payableUSD ?? 0),
      exchangeRate: Number(reception.exchangeRate ?? 0),
      totalCLP: Number(reception.totalCLP ?? 0),
      createdAt: reception.createdAt
        ? formatAuditDate(reception.createdAt)
        : '-',
    };
  });
}

export function createReceptionsWorkbook(data: ReceptionExcelRow[], options: ExcelExportOptions = {}) {
  const {
    sheetName = 'Recepciones',
    maxRows = 10000,
  } = options;

  if (data.length > maxRows) {
    console.warn(`Se limitaron los registros a ${maxRows} (total: ${data.length})`);
    data = data.slice(0, maxRows);
  }

  const workbook = XLSX.utils.book_new();

  const dataWithHeaders = data.map(row => ({
    'ID': row.id,
    'Productor': row.producerName,
    'Guía': row.guideNumber,
    'Variedades': row.varieties,
    'Bandejas': row.totalTrays,
    'Peso bruto (kg)': row.grossWeightKg,
    'Peso neto (kg)': row.netWeightKg,
    'CLP': row.payableCLP,
    'USD': row.payableUSD,
    'Cambio': row.exchangeRate,
    'A Pagar (CLP)': row.totalCLP,
    'Creado': row.createdAt,
  }));

  const dataSheet = XLSX.utils.json_to_sheet(dataWithHeaders);

  const headerStyle = {
    fill: { fgColor: { rgb: 'FF1F4E78' } },
    font: { bold: true, color: { rgb: 'FFFFFFFF' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    },
  };

  const range = XLSX.utils.decode_range(dataSheet['!ref'] || 'A1');
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_col(C) + '1';
    if (!dataSheet[address]) continue;
    dataSheet[address].s = headerStyle;
  }

  const colWidths = [
    { wch: 20 }, // ID
    { wch: 28 }, // Productor
    { wch: 18 }, // Guía
    { wch: 32 }, // Variedades
    { wch: 16 }, // Bandejas
    { wch: 18 }, // Peso bruto
    { wch: 18 }, // Peso neto
    { wch: 18 }, // CLP
    { wch: 18 }, // USD
    { wch: 14 }, // Cambio
    { wch: 20 }, // A Pagar
    { wch: 20 }, // Creado
  ];
  dataSheet['!cols'] = colWidths;

  dataSheet['!autofilter'] = { ref: XLSX.utils.encode_range(range) };

  XLSX.utils.book_append_sheet(workbook, dataSheet, sheetName);

  const totalRows = data.length;
  const totalTrays = data.reduce((acc, row) => acc + Number(row.totalTrays || 0), 0);
  const totalNetWeight = data.reduce((acc, row) => acc + Number(row.netWeightKg || 0), 0);
  const totalPayableCLP = data.reduce((acc, row) => acc + Number(row.payableCLP || 0), 0);
  const totalPayableUSD = data.reduce((acc, row) => acc + Number(row.payableUSD || 0), 0);
  const totalToPayCLP = data.reduce((acc, row) => acc + Number(row.totalCLP || 0), 0);
  const averageExchangeRate = totalRows > 0
    ? Number((data.reduce((acc, row) => acc + Number(row.exchangeRate || 0), 0) / totalRows).toFixed(4))
    : 0;

  const summaryData = [
    { Métrica: 'Total de Registros', Valor: totalRows },
    { Métrica: 'Total Bandejas', Valor: totalTrays },
    { Métrica: 'Peso Neto Total (kg)', Valor: totalNetWeight },
    { Métrica: 'CLP (packs)', Valor: totalPayableCLP },
    { Métrica: 'USD (packs)', Valor: totalPayableUSD },
    { Métrica: 'Cambio promedio', Valor: averageExchangeRate },
    { Métrica: 'A Pagar (CLP)', Valor: totalToPayCLP },
  ];

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 28 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');

  return workbook;
}

export function exportReceptionsToExcel(
  receptionsData: any[],
  options: ExcelExportOptions = {}
) {
  try {
    const formattedData = formatReceptionsDataForExcel(receptionsData);
    const workbook = createReceptionsWorkbook(formattedData, options);
    const fileName = options.fileName || generateExcelFileName('recepciones');
    downloadExcelFile(workbook, fileName);

    return { success: true, fileName, recordCount: formattedData.length };
  } catch (error) {
    console.error('Error exporting receptions to Excel:', error);
    return { success: false, error: String(error) };
  }
}
