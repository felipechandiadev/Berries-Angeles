"use client";
import React, { useMemo } from 'react';
import DialogToPrint from '@/app/baseComponents/Dialog/DialogToPrint';
import type { ReceptionDataSnapshot, ReceptionTotals, ReceptionPackSummary } from './TransactionData';
import type { TrayDevolutionItem } from './TrayDevolutionContainer';
import { Currency } from '@/data/entities/Variety';

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

  const printedAt = useMemo(() => new Date(), [open, receptionTransactionId]);

  const formattedDate = useMemo(() => (
    new Intl.DateTimeFormat('es-CL', { dateStyle: 'short' }).format(printedAt)
  ), [printedAt]);

  const formattedTime = useMemo(() => (
    new Intl.DateTimeFormat('es-CL', { timeStyle: 'short' }).format(printedAt)
  ), [printedAt]);

  const totalTraysReturned = useMemo(() => (
    trayDevolutions.reduce((sum, item) => sum + (item.quantity ?? 0), 0)
  ), [trayDevolutions]);

  return (
    <DialogToPrint
      open={open}
      onClose={onClose}
      title="Recibo de recepción"
      size="xs"
      contentClassName="bg-white"
      printLabel="Imprimir recibo"
      onBeforePrint={onClose}
    >
      <div
        className="mx-auto flex flex-col gap-2 text-[11px] leading-tight text-foreground"
        style={{ width: '70mm', maxWidth: '80mm' }}
      >
        <header className="text-center">
          <h3 className="text-sm font-semibold uppercase">Recepción de fruta</h3>
          <p className="text-[10px]">Comprobante para productor</p>
        </header>

        <section className="flex flex-col gap-1 border-t border-dashed border-border pt-2">
          <div className="flex justify-between text-[10px] uppercase">
            <span className="font-semibold">Recepción</span>
            <span>#{receptionTransactionId ?? '—'}</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span>Fecha:</span>
            <span>{formattedDate}</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span>Hora:</span>
            <span>{formattedTime}</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span>Guía:</span>
            <span>{data?.guide || '—'}</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span>Productor:</span>
            <span className="text-right">{data?.producer?.label ?? '—'}</span>
          </div>
        </section>

        <section className="border-t border-dashed border-border pt-2">
          <h4 className="text-center text-[10px] font-semibold uppercase">Detalle de packs</h4>
          <div className="mt-1 flex flex-col gap-1">
            {packs.length === 0 ? (
              <p className="text-center text-[10px] italic text-muted-foreground">Sin packs registrados</p>
            ) : (
              packs.map((pack) => (
                <div key={pack.id} className="rounded border border-border/70 p-1">
                  <div className="flex justify-between text-[10px] font-semibold">
                    <span>Pack #{pack.packNumber}</span>
                    <span>{formatNumber(pack.netWeight || 0, 2)} kg</span>
                  </div>
                  <div className="mt-1 flex flex-col gap-[2px] text-[9px]">
                    <div className="flex justify-between">
                      <span>Variedad:</span>
                      <span className="text-right">{pack.varietyName ?? '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Formato:</span>
                      <span className="text-right">{pack.formatName ?? '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Precio:</span>
                      <span>{formatCurrency(pack.price ?? 0, pack.currency ?? null)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total a pagar:</span>
                      <span>{formatCurrency(pack.totalToPay ?? 0, pack.currency ?? null)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="border-t border-dashed border-border pt-2">
          <h4 className="text-center text-[10px] font-semibold uppercase">Totales</h4>
          <div className="mt-1 flex flex-col gap-[2px] text-[10px]">
            <div className="flex justify-between">
              <span>Peso bruto</span>
              <span>{formatNumber(totals.totalGrossWeight ?? 0, 2)} kg</span>
            </div>
            <div className="flex justify-between">
              <span>Peso neto</span>
              <span>{formatNumber(totals.totalNetWeight ?? 0, 2)} kg</span>
            </div>
            <div className="flex justify-between">
              <span>Bandejas</span>
              <span>{formatNumber(totals.totalTraysInPacks ?? 0, 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Devoluciones</span>
              <span>{formatNumber(totalTraysReturned, 0)}</span>
            </div>
            {totals.totalToPayCLP > 0 && (
              <div className="flex justify-between">
                <span>Total CLP</span>
                <span>{formatCurrency(totals.totalToPayCLP ?? 0, Currency.CLP)}</span>
              </div>
            )}
            {totals.totalToPayUSD > 0 && (
              <div className="flex justify-between">
                <span>Total USD</span>
                <span>{formatCurrency(totals.totalToPayUSD ?? 0, Currency.USD)}</span>
              </div>
            )}
            {totals.totalCLPToPay > 0 && totals.totalToPayUSD > 0 && (
              <div className="flex justify-between">
                <span>Total CLP (cambio)</span>
                <span>{formatCurrency(totals.totalCLPToPay ?? 0, Currency.CLP)}</span>
              </div>
            )}
          </div>
        </section>

        {trayDevolutions.length > 0 ? (
          <section className="border-t border-dashed border-border pt-2">
            <h4 className="text-center text-[10px] font-semibold uppercase">Devolución de bandejas</h4>
            <div className="mt-1 flex flex-col gap-[2px] text-[10px]">
              {trayDevolutions.map((item, index) => (
                <div key={`${item.trayId ?? 'tray'}-${index}`} className="flex justify-between">
                  <span>{item.trayLabel ?? item.trayId ?? 'Bandeja'}</span>
                  <span>{formatNumber(item.quantity ?? 0, 0)}</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <footer className="border-t border-dashed border-border pt-2 text-center text-[9px] text-muted-foreground">
          <p>Gracias por su entrega.</p>
          <p>Conserve este comprobante para sus registros.</p>
        </footer>
      </div>
    </DialogToPrint>
  );
};

export default PrintReceptionDialog;
