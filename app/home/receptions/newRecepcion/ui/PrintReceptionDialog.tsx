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

/** Inline layout — survives print iframe (Tailwind utilities often do not). */
const TICKET_ROOT_STYLE: React.CSSProperties = {
  width: '76mm',
  maxWidth: '76mm',
  padding: 0,
  margin: '0 auto',
  boxSizing: 'border-box',
  color: '#111',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  fontSize: '13px',
  lineHeight: 1.25,
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const TICKET_SECTION_STYLE: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  borderTop: '1px solid #333',
  paddingTop: '4px',
};

const TICKET_HEADER_STYLE: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '2px',
  textAlign: 'center',
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

/** Two-column ticket row; both columns left-aligned (80mm). Inline styles for print. */
function TicketRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      className="ticket-row"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        alignItems: 'baseline',
        columnGap: '8px',
        fontSize: '13px',
        width: '100%',
      }}
    >
      <span style={{ textAlign: 'left' }}>{label}</span>
      <span style={{ textAlign: 'left', wordBreak: 'break-word', minWidth: 0 }}>{value}</span>
    </div>
  );
}

function TicketPaymentFooter({
  amountLabel,
  paymentLabel,
}: {
  amountLabel: string;
  paymentLabel: string;
}) {
  return (
    <section
      className="ticket-payment-footer"
      style={{
        borderTop: '1px solid #333',
        paddingTop: '8px',
        textAlign: 'center',
      }}
    >
      <p style={{ margin: 0, fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        A PAGAR
      </p>
      <p style={{ margin: '2px 0 0', fontSize: '14px', fontWeight: 700, lineHeight: 1.15 }}>
        {amountLabel}
      </p>
      <div style={{ margin: '8px 0', borderTop: '1px solid #333' }} />
      <p style={{ margin: 0, fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        Estado del pago
      </p>
      <p style={{ margin: '2px 0 0', fontSize: '11px', fontWeight: 700, lineHeight: 1.15 }}>
        {paymentLabel}
      </p>
    </section>
  );
}

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
  const amountToPay = Math.max(
    0,
    totals.totalCLPToPay && totals.totalCLPToPay > 0
      ? totals.totalCLPToPay
      : currencyBreakdown.total
  );
  const amountToPayLabel = formatCurrency(amountToPay, Currency.CLP);
  const paymentLabel = paymentStatusLabel(data.paymentStatus);

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

    return rows;
  }, [receptionMetadata, totals, totalTraysReturned, currencyBreakdown, printOptions.showPrices, printOptions.showTrayDevolutions]);

  const companyHeader = printOptions.showCompanyHeader ? (
    <header style={TICKET_HEADER_STYLE}>
      {printOptions.showLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/logoPrint.png"
          alt="MAUGRO"
          style={PRINT_PREVIEW_LOGO_STYLE}
        />
      ) : null}
      <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>{COMPANY_PRINT_HEADER.legalName}</p>
      <p style={{ margin: 0, fontSize: '12px' }}>{COMPANY_PRINT_HEADER.rut}</p>
      <p style={{ margin: 0, fontSize: '11px' }}>{COMPANY_PRINT_HEADER.address}</p>
      <p style={{ margin: 0, fontSize: '11px' }}>{COMPANY_PRINT_HEADER.phones}</p>
    </header>
  ) : printOptions.showLogo ? (
    <header style={TICKET_HEADER_STYLE}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logoPrint.png"
        alt="MAUGRO"
        style={PRINT_PREVIEW_LOGO_STYLE}
      />
    </header>
  ) : null;

  const thermalPrintStyles = `
    @page {
      size: 80mm auto;
      margin: 0;
    }
    html, body {
      width: 80mm !important;
      max-width: 80mm !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #fff !important;
      color: #111 !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    #print-root {
      width: 80mm !important;
      max-width: 80mm !important;
      padding: 2mm !important;
      margin: 0 auto !important;
      box-sizing: border-box !important;
    }
    #print-root .ticket-root,
    #print-root [data-test-id="print-preview-classic"] {
      width: 76mm !important;
      max-width: 76mm !important;
      margin: 0 auto !important;
    }
    #print-root .ticket-row {
      display: grid !important;
      grid-template-columns: 1fr 1fr !important;
      column-gap: 8px !important;
      width: 100% !important;
      font-size: 13px !important;
    }
    #print-root .ticket-row > span {
      text-align: left !important;
    }
    #print-root .ticket-payment-footer {
      text-align: center !important;
    }
    #print-root img {
      max-width: 14mm !important;
      height: auto !important;
      display: block !important;
      margin-left: auto !important;
      margin-right: auto !important;
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
          className="ticket-root"
          style={TICKET_ROOT_STYLE}
          data-test-id="print-preview-classic"
        >
          {companyHeader}

          <section style={TICKET_SECTION_STYLE}>
            <TicketRow label="Recepción" value={receptionTransactionId ?? '—'} />
            <TicketRow label="Fecha" value={formattedDate} />
            <TicketRow label="Hora" value={formattedTime} />
            <TicketRow label="Productor" value={ticketParties.displayProducerName} />
            <TicketRow label="Rut" value={ticketParties.displayProducerDni} />
            <TicketRow
              label="Chofer"
              value={String((data as { driver?: string | null })?.driver ?? '').trim() || '—'}
            />
            <TicketRow label="Guía" value={data.guide?.trim() || '—'} />
            <TicketRow label="Precio" value={classicPriceLabel} />
          </section>

          <section style={TICKET_SECTION_STYLE}>
            <TicketRow
              label="Cantidad bandejas"
              value={formatNumber(totals.totalTraysInPacks ?? 0, 0)}
            />
            <TicketRow
              label="Kg Bruto"
              value={formatNumber(classicGross, classicGross % 1 === 0 ? 0 : 1)}
            />
            <TicketRow
              label="Descuento Kg"
              value={formatNumber(classicDiscount, classicDiscount % 1 === 0 ? 0 : 1)}
            />
            <TicketRow
              label="Kg Neto"
              value={formatNumber(classicNet, classicNet % 1 === 0 ? 0 : 1)}
            />
            <TicketRow
              label="Variedad"
              value={
                receptionMetadata.varieties.length
                  ? receptionMetadata.varieties.join(', ')
                  : '—'
              }
            />
            <TicketRow
              label="Bandejas devueltas"
              value={formatNumber(totalTraysReturned, 0)}
            />
          </section>

          <TicketPaymentFooter amountLabel={amountToPayLabel} paymentLabel={paymentLabel} />
        </div>
      ) : (
        <div className="ticket-root" style={TICKET_ROOT_STYLE}>
          {companyHeader}
          {!printOptions.showCompanyHeader ? (
            <header style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '13px' }}>Comprobante recepción</p>
            </header>
          ) : null}

          <section style={TICKET_SECTION_STYLE}>
            <TicketRow label="Recepción" value={`#${receptionTransactionId ?? '—'}`} />
            <TicketRow label="Fecha" value={formattedDate} />
            <TicketRow label="Hora" value={formattedTime} />
            <TicketRow label="Productor" value={ticketParties.displayProducerName} />
            <TicketRow label="RUT" value={ticketParties.displayProducerDni} />
            {printOptions.showGuideDriver ? (
              <TicketRow label="Guía" value={data.guide?.trim() || '—'} />
            ) : null}
          </section>

          <section style={TICKET_SECTION_STYLE}>
            <h4 style={{ margin: '0 0 2px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', textAlign: 'left' }}>
              Resumen
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {receptionOverviewRows.map((row) => (
                <TicketRow key={row.key} label={row.label} value={row.value} />
              ))}
            </div>
          </section>

          {printOptions.showPackDetails && packs.length > 0 ? (
            <section style={TICKET_SECTION_STYLE}>
              <h4 style={{ margin: '0 0 2px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', textAlign: 'left' }}>
                Packs ({packs.length})
              </h4>
              {packs.map((pack, index) => (
                <div
                  key={pack.id ?? index}
                  style={{
                    marginBottom: '4px',
                    borderBottom: '1px dotted #999',
                    paddingBottom: '4px',
                    fontSize: '12px',
                  }}
                >
                  <div style={{ fontWeight: 600 }}>Pack #{pack.packNumber || index + 1}</div>
                  <TicketRow label="Variedad" value={pack.varietyName || '—'} />
                  <TicketRow label="Bandeja" value={pack.trayLabel || '—'} />
                  <TicketRow label="Cant" value={`${pack.traysQuantity || 0} uds`} />
                  <TicketRow label="P.Neto" value={`${formatNumber(pack.netWeight ?? 0)} kg`} />
                  {printOptions.showPrices ? (
                    <TicketRow
                      label="Total"
                      value={formatCurrency(pack.totalToPay ?? 0, pack.currency)}
                    />
                  ) : null}
                </div>
              ))}
            </section>
          ) : null}

          {printOptions.showPallets ? (
            <section style={TICKET_SECTION_STYLE}>
              <h4 style={{ margin: '0 0 2px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', textAlign: 'left' }}>
                Pallets
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {palletLines.length > 0 ? (
                  palletLines.map((line) => (
                    <TicketRow
                      key={line.palletId}
                      label={`Pallet #${line.palletId}`}
                      value={
                        <>
                          {formatNumber(line.traysAssigned, 0)} ban.
                          {line.grossWeightKg > 0
                            ? ` · ${formatNumber(line.grossWeightKg, 2)} kg`
                            : ''}
                          {line.packNumbers.length
                            ? ` (pack ${line.packNumbers.join(',')})`
                            : ''}
                        </>
                      }
                    />
                  ))
                ) : (
                  <div style={{ textAlign: 'left', color: '#666' }}>Sin asignación a pallets</div>
                )}
              </div>
            </section>
          ) : null}

          {printOptions.showTrayDevolutions && trayDevolutions.length > 0 ? (
            <section style={TICKET_SECTION_STYLE}>
              <h4 style={{ margin: '0 0 2px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', textAlign: 'left' }}>
                Devolución de bandejas
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {trayDevolutions.map((item, index) => (
                  <TicketRow
                    key={`${item.trayId ?? 'tray'}-${index}`}
                    label={item.trayLabel ?? item.trayId ?? 'Bandeja'}
                    value={formatNumber(item.quantity ?? 0, 0)}
                  />
                ))}
              </div>
            </section>
          ) : null}

          <TicketPaymentFooter amountLabel={amountToPayLabel} paymentLabel={paymentLabel} />
        </div>
      )}
    </DialogToPrint>
  );
};

export default PrintReceptionDialog;
