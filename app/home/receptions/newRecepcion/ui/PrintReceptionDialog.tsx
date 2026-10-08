"use client";
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DialogToPrint from '@/app/baseComponents/Dialog/DialogToPrint';
import type { ReceptionDataSnapshot, ReceptionTotals, ReceptionPackSummary } from './TransactionData';
import type { TrayDevolutionItem } from './TrayDevolutionContainer';
import { Currency } from '@/data/entities/Variety';
import {
  aggregatePalletLines,
  buildReceptionTicketEscPos,
  COMPANY_PRINT_HEADER,
  getDefaultReceptionPrintOptions,
  loadReceptionPrintOptions,
  printRaw,
  resolveReceptionTicketDate,
  resolveTicketHeaderParties,
  saveReceptionPrintOptions,
  type ReceptionPrintOptions,
} from '@/lib/printing';
import PrintOptionsPanel from './PrintOptionsPanel';
import { paymentStatusLabel } from '@/lib/receptionPayment';

interface PrintReceptionDialogProps {
  open: boolean;
  onClose: () => void;
  snapshot: ReceptionDataSnapshot | null;
  receptionTransactionId?: string | null;
}

const EMPTY_TOTALS: ReceptionTotals = {
  totalPacks: 0,
  totalTraysInPacks: 0,
  totalTraysDevolved: 0,
  totalGrossWeight: 0,
  totalNetWeight: 0,
  totalToPayUSD: 0,
  totalToPayCLP: 0,
  totalCLPToPay: 0,
};

const EMPTY_SNAPSHOT: ReceptionDataSnapshot = {
  producer: null,
  guide: '',
  packs: [],
  trayDevolutions: [],
  totals: EMPTY_TOTALS,
  exchangeRate: 0,
};

/** Same preview logo size for every print profile. */
const PRINT_PREVIEW_LOGO_STYLE: React.CSSProperties = {
  display: 'block',
  width: '14mm',
  minWidth: '14mm',
  maxWidth: '14mm',
  height: 'auto',
  flexShrink: 0,
  marginLeft: 'auto',
  marginRight: 'auto',
  objectFit: 'contain',
};

const formatNumber = (value: number, decimals = 2) =>
  new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value ?? 0);

const formatCurrency = (value: number, currency: Currency | null) => {
  if (!value) {
    return currency === Currency.CLP ? '$0' : 'US$0.00';
  }

  if (currency === Currency.USD) {
    return new Intl.NumberFormat('es-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  if (currency === Currency.CLP) {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  return formatNumber(value, 2);
};

const PrintReceptionDialog: React.FC<PrintReceptionDialogProps> = ({
  open,
  onClose,
  snapshot,
  receptionTransactionId,
}) => {
  const data = snapshot ?? EMPTY_SNAPSHOT;
  const totals = data?.totals ?? EMPTY_TOTALS;
  const packs: ReceptionPackSummary[] = Array.isArray(data?.packs) ? data.packs : [];
  const trayDevolutions: TrayDevolutionItem[] = Array.isArray(data?.trayDevolutions)
    ? data.trayDevolutions
    : [];
  const [printOptions, setPrintOptions] = useState<ReceptionPrintOptions>(
    getDefaultReceptionPrintOptions
  );

  useEffect(() => {
    if (!open) return;
    setPrintOptions(loadReceptionPrintOptions());
  }, [open]);

  const handlePrintOptionsChange = useCallback((next: ReceptionPrintOptions) => {
    setPrintOptions(next);
    saveReceptionPrintOptions(next);
  }, []);

  const palletLines = useMemo(() => aggregatePalletLines(packs), [packs]);
  const currencyBreakdown = useMemo(() => {
    const clpFromTotals = Math.max(0, totals?.totalToPayCLP ?? 0);
    const usdFromTotals = Math.max(0, totals?.totalToPayUSD ?? 0);
    const exchangeRateRaw = typeof data?.exchangeRate === 'number' ? data.exchangeRate : 0;
    const exchangeRate = exchangeRateRaw && Number.isFinite(exchangeRateRaw)
      ? Math.max(0, exchangeRateRaw)
      : 0;

    const clpFromPacks = packs.reduce((sum, pack) => {
      const rawTotal = typeof pack.totalToPay === 'number'
        ? pack.totalToPay
        : Number(pack.totalToPay ?? 0);
      const normalizedTotal = Number.isFinite(rawTotal) ? Math.max(0, rawTotal) : 0;
      const currencyCode = String(pack.currency ?? Currency.CLP).toUpperCase();
      if (currencyCode === Currency.USD) {
        return sum;
      }
      return sum + normalizedTotal;
    }, 0);

    const usdFromPacks = packs.reduce((sum, pack) => {
      const rawTotal = typeof pack.totalToPay === 'number'
        ? pack.totalToPay
        : Number(pack.totalToPay ?? 0);
      const normalizedTotal = Number.isFinite(rawTotal) ? Math.max(0, rawTotal) : 0;
      const currencyCode = String(pack.currency ?? Currency.CLP).toUpperCase();
      if (currencyCode === Currency.USD) {
        return sum + normalizedTotal;
      }
      return sum;
    }, 0);

    const resolvedCLP = clpFromTotals > 0 ? clpFromTotals : clpFromPacks;
    const resolvedUSD = usdFromTotals > 0 ? usdFromTotals : usdFromPacks;
    const combinedFromTotals = Math.max(0, totals?.totalCLPToPay ?? 0);

    let totalToPay = resolvedCLP + resolvedUSD * exchangeRate;
    if (!(totalToPay > 0) && combinedFromTotals > 0) {
      totalToPay = combinedFromTotals;
    }

    let normalizedCLP = resolvedCLP;
    if (!(normalizedCLP > 0) && totalToPay > 0) {
      const difference = totalToPay - resolvedUSD * exchangeRate;
      normalizedCLP = difference > 0 ? difference : 0;
    }

    return {
      clp: normalizedCLP,
      usd: resolvedUSD,
      exchangeRate,
      total: totalToPay,
    };
  }, [data?.exchangeRate, packs, totals]);

  const receptionDate = useMemo(
    () => resolveReceptionTicketDate(data?.createdAt),
    [data?.createdAt, open, receptionTransactionId]
  );

  const isClassic = printOptions.profile === 'classic';

  const formattedDate = useMemo(() => (
    new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(receptionDate)
  ), [receptionDate]);

  const formattedTime = useMemo(() => (
    new Intl.DateTimeFormat('es-CL', {
      timeStyle: 'short',
      hour12: false,
    }).format(receptionDate)
  ), [receptionDate]);

  const ticketParties = useMemo(
    () =>
      resolveTicketHeaderParties({
        producer: data?.producer
          ? {
              label: data.producer.label,
            }
          : null,
        driver: (data as { driver?: string | null })?.driver ?? null,
      }),
    [data?.producer, data]
  );

  const totalTraysReturned = useMemo(() => (
    trayDevolutions.reduce((sum, item) => sum + (item.quantity ?? 0), 0)
  ), [trayDevolutions]);

  const classicPriceLabel = useMemo(() => {
    const prices = packs
      .map((p) => (typeof p.price === 'number' && Number.isFinite(p.price) ? p.price : null))
      .filter((p): p is number => p !== null && p > 0);
    if (prices.length === 0) return '—';
    const unique = Array.from(new Set(prices.map((p) => Math.round(p * 100) / 100)));
    if (unique.length === 1) {
      return formatNumber(unique[0], unique[0] % 1 === 0 ? 0 : 2);
    }
    return unique.map((p) => formatNumber(p, p % 1 === 0 ? 0 : 2)).join(' / ');
  }, [packs]);

  const classicGross = Math.max(0, totals.totalGrossWeight ?? 0);
  const classicNet = Math.max(0, totals.totalNetWeight ?? 0);
  const classicDiscount = Math.max(0, classicGross - classicNet);
  const classicAmountToPay = Math.max(
    0,
    totals.totalCLPToPay && totals.totalCLPToPay > 0
      ? totals.totalCLPToPay
      : currencyBreakdown.total
  );

  const receptionMetadata = useMemo(() => {
    const varieties = new Set<string>();
    const formats = new Set<string>();
    const trayTypes = new Set<string>();
    let traysWeightKg = 0;
    let totalImpurities = 0;

    packs.forEach((pack) => {
      if (pack.varietyName) {
        varieties.add(pack.varietyName);
      }
      if (pack.formatName) {
        formats.add(pack.formatName);
      }
      if (pack.trayLabel) {
        trayTypes.add(pack.trayLabel);
      }

      traysWeightKg += pack.traysTotalWeight ?? 0;

      const netBeforeImpurities = pack.netWeightBeforeImpurities ?? 0;
      const netWeight = pack.netWeight ?? 0;
      const impurityWeight = Math.max(netBeforeImpurities - netWeight, 0);
      totalImpurities += impurityWeight;
    });

    return {
      varieties: Array.from(varieties),
      formats: Array.from(formats),
      trayTypes: Array.from(trayTypes),
      traysWeightKg,
      totalImpurities,
    };
  }, [packs]);

  const receptionOverviewRows = useMemo(() => {
    const rows: Array<{ key: string; label: string; value: string }> = [
      {
        key: 'varieties',
        label: 'Variedad',
        value: receptionMetadata.varieties.length
          ? receptionMetadata.varieties.join(', ')
          : '—',
      },
      {
        key: 'trayTypes',
        label: 'Tipo de bandeja',
        value: receptionMetadata.trayTypes.length
          ? receptionMetadata.trayTypes.join(', ')
          : '—',
      },
      {
        key: 'totalTrays',
        label: 'Total bandejas',
        value: formatNumber(totals.totalTraysInPacks ?? 0, 0),
      },
      {
        key: 'traysKg',
        label: 'Kg bandejas',
        value: `${formatNumber(receptionMetadata.traysWeightKg ?? 0, 2)} kg`,
      },
      {
        key: 'gross',
        label: 'kg bruto',
        value: `${formatNumber(totals.totalGrossWeight ?? 0, 2)} kg`,
      },
      {
        key: 'net',
        label: 'kg neto',
        value: `${formatNumber(totals.totalNetWeight ?? 0, 2)} kg`,
      },
    ];

    if (receptionMetadata.totalImpurities > 0) {
      rows.push({
        key: 'impurities',
        label: 'Kg impurezas',
        value: `${formatNumber(receptionMetadata.totalImpurities, 2)} kg`,
      });
    }

    if (printOptions.showPrices) {
      rows.push({
        key: 'totalClp',
        label: 'Total CLP',
        value: formatCurrency(currencyBreakdown.clp, Currency.CLP),
      });

      rows.push({
        key: 'totalUsd',
        label: 'Total USD',
        value: formatCurrency(currencyBreakdown.usd, Currency.USD),
      });
    }

    if (printOptions.showTrayDevolutions && totalTraysReturned > 0) {
      rows.push({
        key: 'returnedTrays',
        label: 'Bandejas devueltas',
        value: formatNumber(totalTraysReturned, 0),
      });
    }

    rows.push({
      key: 'paymentStatus',
      label: 'Estado del pago',
      value: paymentStatusLabel(data.paymentStatus),
    });

    return rows;
  }, [receptionMetadata, totals, totalTraysReturned, currencyBreakdown, printOptions.showPrices, printOptions.showTrayDevolutions, data.paymentStatus]);

  const thermalPrintStyles = `
    @page {
      size: 80mm auto;
      margin: 0;
    }
    @media print {
      html, body {
        width: 80mm !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      #print-root {
        width: 80mm !important;
        padding: 2mm !important;
        margin: 0 !important;
      }
    }
  `;

  const handlePrintTicket = useCallback(async () => {
    const bytes = await buildReceptionTicketEscPos(
      data,
      receptionTransactionId,
      new Date(),
      printOptions
    );
    await printRaw(bytes, { requestIfMissing: true });
  }, [data, receptionTransactionId, printOptions]);

  return (
    <DialogToPrint
      open={open}
      onClose={onClose}
      title={isClassic ? 'Vista previa ticket' : 'Recibo de recepción'}
      size="sm"
      contentClassName="bg-white"
      printLabel="Imprimir"
      onBeforePrint={onClose}
      printStyles={thermalPrintStyles}
      onPrintTicket={handlePrintTicket}
      ticketLabel="Ticket USB"
      controls={
        <PrintOptionsPanel options={printOptions} onChange={handlePrintOptionsChange} />
      }
    >
      {isClassic ? (
        <div
          className="flex flex-col gap-1 text-[13px] leading-tight text-foreground"
          style={{ width: '76mm', maxWidth: '76mm', padding: '0' }}
          data-test-id="print-preview-classic"
        >
          <header className="flex flex-col items-center gap-1 text-center">
            {printOptions.showLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src="/logoPrint.png"
                alt="MAUGRO"
                style={PRINT_PREVIEW_LOGO_STYLE}
              />
            ) : null}
            <p className="text-[13px] font-semibold">{COMPANY_PRINT_HEADER.legalName}</p>
            <p className="text-[12px]">{COMPANY_PRINT_HEADER.rut}</p>
            <p className="text-[11px]">{COMPANY_PRINT_HEADER.address}</p>
            <p className="text-[11px]">{COMPANY_PRINT_HEADER.phones}</p>
          </header>

          <section className="flex flex-col border-t border-border pt-1 text-[13px]">
            <div>
              <span>Recepción N°: </span>
              <span>{receptionTransactionId ?? '—'}</span>
            </div>
            <div>
              <span>Fecha: </span>
              <span>{formattedDate}</span>
            </div>
            <div>
              <span>Hora: </span>
              <span>{formattedTime}</span>
            </div>
            <div>
              <span>Productor: </span>
              <span>{ticketParties.displayProducerName}</span>
            </div>
            <div>
              <span>Rut: </span>
              <span>{ticketParties.displayProducerDni}</span>
            </div>
            <div>
              <span>Chófer: </span>
              <span>{String((data as { driver?: string | null })?.driver ?? '').trim() || '—'}</span>
            </div>
            <div>
              <span>Guía: </span>
              <span>{data.guide?.trim() || '—'}</span>
            </div>
            <div>
              <span>Variedad: </span>
              <span>
                {receptionMetadata.varieties.length
                  ? receptionMetadata.varieties.join(', ')
                  : '—'}
              </span>
            </div>
            <div>
              <span>Precio: </span>
              <span>{classicPriceLabel}</span>
            </div>
          </section>

          <section className="flex flex-col border-t border-border pt-1 text-[13px]">
            <div>
              <span>Cantidad bandejas: </span>
              <span>{formatNumber(totals.totalTraysInPacks ?? 0, 0)}</span>
            </div>
            <div>
              <span>Kg Bruto: </span>
              <span>{formatNumber(classicGross, classicGross % 1 === 0 ? 0 : 1)}</span>
            </div>
            <div>
              <span>Descuento Kg: </span>
              <span>{formatNumber(classicDiscount, classicDiscount % 1 === 0 ? 0 : 1)}</span>
            </div>
            <div>
              <span>Kg Neto: </span>
              <span>{formatNumber(classicNet, classicNet % 1 === 0 ? 0 : 1)}</span>
            </div>
            <div>
              <span>Bandejas devueltas: </span>
              <span>{formatNumber(totalTraysReturned, 0)}</span>
            </div>
            <div>
              <span>Estado del pago: </span>
              <span>{paymentStatusLabel(data.paymentStatus)}</span>
            </div>
          </section>

          <section className="border-t border-border pt-1 text-right text-[14px] font-semibold">
            <span>A pagar: {formatCurrency(classicAmountToPay, Currency.CLP)}</span>
          </section>
        </div>
      ) : (
        <div
          className="flex flex-col gap-1 text-[13px] leading-tight text-foreground"
          style={{ width: '76mm', maxWidth: '76mm', padding: '0' }}
        >
          <header className="flex flex-col items-center gap-1 text-center">
            <p className="text-[13px]">Comprobante recepción</p>
            {printOptions.showLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src="/logoPrint.png"
                alt="MAUGRO"
                style={PRINT_PREVIEW_LOGO_STYLE}
              />
            ) : null}
            <p className="text-[18px] font-bold tracking-wide">MAUGRO</p>
          </header>

          <section className="flex flex-col border-t border-dashed border-border pt-1">
            <div className="text-[13px] uppercase">
              <span className="font-semibold">Recepción: </span>
              <span>#{receptionTransactionId ?? '—'}</span>
            </div>
            <div className="text-[13px]">
              <span>Fecha: </span>
              <span>{formattedDate}</span>
            </div>
            <div className="text-[13px]">
              <span>Hora: </span>
              <span>{formattedTime}</span>
            </div>
            <div className="text-[13px]">
              <span>Productor: </span>
              <span>{ticketParties.displayProducerName}</span>
            </div>
            <div className="text-[13px]">
              <span>RUT: </span>
              <span>{ticketParties.displayProducerDni}</span>
            </div>
            {printOptions.showGuideDriver && data.guide ? (
              <div className="text-[13px]">
                <span>Guía: </span>
                <span>{data.guide}</span>
              </div>
            ) : null}
          </section>

          <section className="border-t border-dashed border-border pt-1">
            <h4 className="text-left text-[13px] font-semibold uppercase">Resumen</h4>
            <div className="flex flex-col text-[13px]">
              {receptionOverviewRows.map((row) => (
                <div key={row.key} className="text-left">
                  <span>{row.label}: </span>
                  <span>{row.value}</span>
                </div>
              ))}
            </div>
          </section>

          {printOptions.showPackDetails && packs.length > 0 ? (
            <section className="border-t border-dashed border-border pt-1">
              <h4 className="text-left text-[13px] font-semibold uppercase">
                Packs ({packs.length})
              </h4>
              {packs.map((pack, index) => (
                <div
                  key={pack.id ?? index}
                  className="mb-1 border-b border-dotted border-border pb-1 text-[12px]"
                >
                  <div className="font-medium">Pack #{pack.packNumber || index + 1}</div>
                  <div>
                    <span>Variedad: </span>
                    <span>{pack.varietyName || '—'}</span>
                  </div>
                  <div>
                    <span>Bandeja: </span>
                    <span>{pack.trayLabel || '—'}</span>
                  </div>
                  <div>
                    <span>Cant: </span>
                    <span>{pack.traysQuantity || 0} uds</span>
                  </div>
                  <div>
                    <span>P.Neto: </span>
                    <span>{formatNumber(pack.netWeight ?? 0)} kg</span>
                  </div>
                  {printOptions.showPrices ? (
                    <div>
                      <span>Total: </span>
                      <span>{formatCurrency(pack.totalToPay ?? 0, pack.currency)}</span>
                    </div>
                  ) : null}
                </div>
              ))}
            </section>
          ) : null}

          {printOptions.showPallets ? (
            <section className="border-t border-dashed border-border pt-1">
              <h4 className="text-left text-[13px] font-semibold uppercase">Pallets</h4>
              <div className="flex flex-col text-[13px]">
                {palletLines.length > 0 ? (
                  palletLines.map((line) => (
                    <div key={line.palletId} className="text-left">
                      <span>Pallet #{line.palletId}: </span>
                      <span>
                        {formatNumber(line.traysAssigned, 0)} ban.
                        {line.grossWeightKg > 0
                          ? ` · ${formatNumber(line.grossWeightKg, 2)} kg`
                          : ''}
                        {line.packNumbers.length
                          ? ` (pack ${line.packNumbers.join(',')})`
                          : ''}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-left text-muted-foreground">Sin asignación a pallets</div>
                )}
              </div>
            </section>
          ) : null}

          {printOptions.showTrayDevolutions && trayDevolutions.length > 0 ? (
            <section className="border-t border-dashed border-border pt-1">
              <h4 className="text-left text-[13px] font-semibold uppercase">Devolución de bandejas</h4>
              <div className="flex flex-col text-[13px]">
                {trayDevolutions.map((item, index) => (
                  <div key={`${item.trayId ?? 'tray'}-${index}`} className="text-left">
                    <span>{item.trayLabel ?? item.trayId ?? 'Bandeja'}: </span>
                    <span>{formatNumber(item.quantity ?? 0, 0)}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <footer className="border-t border-dashed border-border pt-1 text-left text-[13px] text-muted-foreground">
            <p>Gracias por su entrega.</p>
            <p>Conserve este comprobante.</p>
          </footer>
        </div>
      )}
    </DialogToPrint>
  );
};

export default PrintReceptionDialog;
