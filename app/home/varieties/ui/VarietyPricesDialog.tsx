'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Dialog from '@/app/baseComponents/Dialog/Dialog';
import { Button } from '@/app/baseComponents/Button/Button';
import { TextField } from '@/app/baseComponents/TextField/TextField';
import Select from '@/app/baseComponents/Select/Select';
import { useAlert } from '@/app/state/hooks/useAlert';
import { useSubmitLock } from '@/app/state/hooks/useSubmitLock';
import {
  getVarietyPriceHistory,
  updateVarietyQualityPrice,
  updateVarietyQualityPricesBulk,
} from '@/app/actions/varieties';
import { Currency, type VarietyQualityPrice } from '@/data/entities/Variety';

interface VarietyPricesDialogProps {
  open: boolean;
  onClose: () => void;
  variety: {
    id: number;
    name: string;
    qualityPrices: VarietyQualityPrice[];
  };
}

type RowState = {
  qualityId: number;
  qualityName: string;
  priceCLP: string;
  priceUSD: string;
  currency: Currency;
  active: boolean;
};

export default function VarietyPricesDialog({ open, onClose, variety }: VarietyPricesDialogProps) {
  const router = useRouter();
  const { success, error, warning } = useAlert();
  const { isSubmitting, run } = useSubmitLock();
  const [rows, setRows] = useState<RowState[]>([]);
  const [history, setHistory] = useState<
    Array<{ qualityName: string; priceCLP: number; currency: string; changedAt: string; source: string }>
  >([]);
  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkCurrency, setBulkCurrency] = useState<Currency>(Currency.CLP);

  useEffect(() => {
    if (!open) return;
    setRows(
      (variety.qualityPrices ?? []).map((p) => ({
        qualityId: p.qualityId,
        qualityName: p.qualityName,
        priceCLP: String(p.priceCLP ?? 0),
        priceUSD: String(p.priceUSD ?? 0),
        currency: p.currency === Currency.USD ? Currency.USD : Currency.CLP,
        active: p.active !== false,
      })),
    );
    void getVarietyPriceHistory(variety.id).then((res) => {
      if (res.success && res.data) {
        setHistory(
          res.data.slice(0, 12).map((h) => ({
            qualityName: h.qualityName,
            priceCLP: h.priceCLP,
            currency: h.currency,
            changedAt: h.changedAt,
            source: h.source,
          })),
        );
      }
    });
  }, [open, variety]);

  const currencyOptions = [
    { id: Currency.CLP, label: 'CLP' },
    { id: Currency.USD, label: 'USD' },
  ];

  const updateRow = (qualityId: number, patch: Partial<RowState>) => {
    setRows((prev) => prev.map((r) => (r.qualityId === qualityId ? { ...r, ...patch } : r)));
  };

  const saveOne = async (row: RowState) => {
    if (!row.active) {
      warning('Esta calidad está inactiva');
      return;
    }
    const result = await run(async () => {
      const res = await updateVarietyQualityPrice({
        varietyId: variety.id,
        qualityId: row.qualityId,
        priceCLP: Number(row.priceCLP) || 0,
        priceUSD: Number(row.priceUSD) || 0,
        currency: row.currency,
      });
      if (!res.success) {
        error(res.error || 'Error al guardar precio');
        return { ok: false };
      }
      success(`Precio de ${row.qualityName} actualizado`);
      return { ok: true };
    });
    if (result?.ok) router.refresh();
  };

  const applyBulk = async () => {
    const price = Number(bulkPrice);
    if (!Number.isFinite(price) || price < 0) {
      warning('Ingresa un precio válido');
      return;
    }
    const activeRows = rows.filter((r) => r.active);
    if (activeRows.length === 0) {
      warning('No hay calidades activas para actualizar');
      return;
    }
    const result = await run(async () => {
      const res = await updateVarietyQualityPricesBulk({
        varietyId: variety.id,
        updates: activeRows.map((r) => ({
          qualityId: r.qualityId,
          priceCLP: bulkCurrency === Currency.CLP ? price : Number(r.priceCLP) || 0,
          priceUSD: bulkCurrency === Currency.USD ? price : Number(r.priceUSD) || 0,
          currency: bulkCurrency,
        })),
      });
      if (!res.success) {
        error(res.error || 'Error al aplicar precios');
        return { ok: false };
      }
      success('Precios aplicados a las calidades activas');
      return { ok: true };
    });
    if (result?.ok) router.refresh();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Precios · ${variety.name}`}
      size="xl"
      showCloseButton
    >
      <div className="space-y-4 max-h-[70vh] overflow-y-auto">
        {rows.length === 0 ? (
          <p className="text-sm text-secondary">
            No hay tipos de calidad. Crea calidades en la pestaña Calidades.
          </p>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <div
                key={row.qualityId}
                className={`grid grid-cols-1 gap-2 rounded-md border border-border p-3 sm:grid-cols-5 sm:items-end ${
                  row.active ? '' : 'opacity-50'
                }`}
                aria-disabled={!row.active || undefined}
              >
                <div className="sm:col-span-1">
                  <div className="text-xs text-secondary">Calidad</div>
                  <div className={`font-medium ${row.active ? '' : 'line-through'}`}>
                    {row.qualityName}
                    {!row.active ? ' (inactiva)' : ''}
                  </div>
                </div>
                <TextField
                  label="Precio CLP"
                  type="number"
                  value={row.priceCLP}
                  disabled={!row.active}
                  onChange={(e) => updateRow(row.qualityId, { priceCLP: e.target.value })}
                />
                <TextField
                  label="Precio USD"
                  type="number"
                  value={row.priceUSD}
                  disabled={!row.active}
                  onChange={(e) => updateRow(row.qualityId, { priceUSD: e.target.value })}
                />
                <Select
                  label="Moneda"
                  options={currencyOptions}
                  value={row.currency}
                  disabled={!row.active}
                  onChange={(value) =>
                    updateRow(row.qualityId, {
                      currency: (value as Currency) || Currency.CLP,
                    })
                  }
                />
                <Button
                  variant="outlined"
                  type="button"
                  loading={isSubmitting}
                  disabled={!row.active}
                  onClick={() => void saveOne(row)}
                >
                  Guardar
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-md border border-border p-3 space-y-2">
          <h4 className="text-sm font-semibold">Aplicar a todas las calidades</h4>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:items-end">
            <TextField
              label="Precio"
              type="number"
              value={bulkPrice}
              onChange={(e) => setBulkPrice(e.target.value)}
            />
            <Select
              label="Moneda"
              options={currencyOptions}
              value={bulkCurrency}
              onChange={(value) => setBulkCurrency((value as Currency) || Currency.CLP)}
            />
            <Button variant="primary" type="button" loading={isSubmitting} onClick={() => void applyBulk()}>
              Aplicar a todas
            </Button>
          </div>
        </div>

        {history.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Historial reciente</h4>
            <ul className="text-xs text-secondary space-y-1">
              {history.map((h, i) => (
                <li key={`${h.changedAt}-${i}`}>
                  {new Date(h.changedAt).toLocaleString('es-CL')} · {h.qualityName} ·{' '}
                  {h.currency} {h.priceCLP.toLocaleString('es-CL')} · {h.source}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Dialog>
  );
}
