'use client';

import { useEffect, useState } from 'react';
import Dialog from '@/app/baseComponents/Dialog/Dialog';
import DotProgress from '@/app/baseComponents/DotProgress/DotProgress';
import { getDispatchDetail, type DispatchDetail } from '@/app/actions/dispatches';
import { formatAuditDate } from '@/lib/dateTimeUtils';

interface DispatchDetailDialogProps {
  dispatchId: string | null;
  open: boolean;
  onClose: () => void;
}

const kgFmt = new Intl.NumberFormat('es-CL', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
});

export default function DispatchDetailDialog({
  dispatchId,
  open,
  onClose,
}: DispatchDetailDialogProps) {
  const [detail, setDetail] = useState<DispatchDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !dispatchId) {
      setDetail(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getDispatchDetail(dispatchId)
      .then((result) => {
        if (cancelled) return;
        if (result.success && result.data) {
          setDetail(result.data);
        } else {
          setError(result.error || 'No se pudo cargar el despacho');
        }
      })
      .catch(() => {
        if (!cancelled) setError('No se pudo cargar el despacho');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, dispatchId]);

  return (
    <Dialog open={open} onClose={onClose} title="Detalle de despacho" size="lg">
      {loading && (
        <div className="flex min-h-[160px] items-center justify-center">
          <DotProgress />
        </div>
      )}
      {!loading && error && <p className="text-sm text-destructive">{error}</p>}
      {!loading && detail && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div>
              <div className="text-secondary">Folio</div>
              <div className="font-mono">{detail.id}</div>
            </div>
            <div>
              <div className="text-secondary">Fecha</div>
              <div>{detail.createdAt ? formatAuditDate(detail.createdAt) : '—'}</div>
            </div>
            <div>
              <div className="text-secondary">Cliente</div>
              <div>{detail.customerName}</div>
            </div>
            <div>
              <div className="text-secondary">Bandeja</div>
              <div>
                {detail.trayName} ({kgFmt.format(detail.unitTrayWeight)} kg)
              </div>
            </div>
            <div>
              <div className="text-secondary">Almacén</div>
              <div>{detail.storageName}</div>
            </div>
            <div>
              <div className="text-secondary">Totales</div>
              <div>
                {detail.palletsCount} pallets · {detail.traysTotal} bandejas ·{' '}
                {kgFmt.format(detail.fruitKgTotal)} kg fruta
              </div>
            </div>
          </div>

          {detail.notes ? (
            <p className="text-sm text-secondary">Notas: {detail.notes}</p>
          ) : null}

          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-secondary">
                <tr>
                  <th className="px-3 py-2 font-medium">Pallet</th>
                  <th className="px-3 py-2 font-medium">Tara</th>
                  <th className="px-3 py-2 font-medium">Bandejas</th>
                  <th className="px-3 py-2 font-medium">Bruto</th>
                  <th className="px-3 py-2 font-medium">Fruta neta</th>
                </tr>
              </thead>
              <tbody>
                {detail.palletLines.map((line) => (
                  <tr key={line.palletId} className="border-t border-border">
                    <td className="px-3 py-2 font-mono text-xs">#{line.palletId}</td>
                    <td className="px-3 py-2">{kgFmt.format(line.emptyWeightKg)} kg</td>
                    <td className="px-3 py-2">{line.traysQuantity}</td>
                    <td className="px-3 py-2">{kgFmt.format(line.grossWeightKg)} kg</td>
                    <td className="px-3 py-2 font-medium">
                      {kgFmt.format(line.fruitWeightKg)} kg
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Dialog>
  );
}
