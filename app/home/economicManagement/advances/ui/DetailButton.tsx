'use client';

import { useState } from 'react';
import { getAdvanceDetail, type AdvanceDetail } from '@/app/actions/advances';
import Dialog from '@/app/baseComponents/Dialog/Dialog';
import IconButton from '@/app/baseComponents/IconButton/IconButton';
import { formatAuditDate } from '@/lib/dateTimeUtils';

const clpFormatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});

function formatCLP(value: number): string {
  return clpFormatter.format(Number.isFinite(value) ? value : 0);
}

interface DetailButtonProps {
  advanceId: string;
}

export default function DetailButton({ advanceId }: DetailButtonProps) {
  const [detail, setDetail] = useState<AdvanceDetail | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const d = await getAdvanceDetail(advanceId);
      setDetail(d);
      setOpen(true);
    } catch (error) {
      console.error('Error fetching advance detail', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setDetail(null);
  };

  return (
    <>
      <IconButton
        icon="more_horiz"
        variant="basicSecondary"
        size="sm"
        onClick={handleClick}
        disabled={loading}
        ariaLabel="Ver detalle"
      />

      {detail && (
        <Dialog open={open} onClose={handleClose} title="Detalle del Anticipo" size="lg">
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {/* Información del Anticipo */}
            <div className="border border-border rounded-lg p-4 bg-white">
              <h3 className="text-lg font-semibold mb-4 text-primary">Información del Anticipo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-muted-foreground">ID de Transacción:</span>
                    <span className="font-mono text-sm">{detail.transactionId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Fecha de Creación:</span>
                    <span className="text-sm">{formatAuditDate(detail.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Productor:</span>
                    <span className="text-sm">{detail.producerName || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Temporada:</span>
                    <span className="text-sm">{detail.seasonName || '—'}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Monto Total:</span>
                    <span className="text-sm font-semibold">{formatCLP(detail.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Método de Pago:</span>
                    <span className="text-sm">{detail.paymentMethod === 'CASH' ? 'Efectivo' : detail.paymentMethod === 'TRANSFER' ? 'Transferencia' : 'Cheque'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Referencia de Pago:</span>
                    <span className="text-sm">{detail.paymentReference || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Cuenta Bancaria (Origen):</span>
                    <span className="text-sm">{detail.bankAccountName || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Cuenta Bancaria (Productor):</span>
                    <span className="text-sm">{detail.producerAccountName || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Operador:</span>
                    <span className="text-sm">{detail.operatorName || '—'}</span>
                  </div>
                </div>
              </div>
              {detail.notes && (
                <div className="mt-4">
                  <span className="text-sm font-medium text-muted-foreground">Notas:</span>
                  <p className="text-sm mt-1 leading-relaxed text-foreground">{detail.notes}</p>
                </div>
              )}
            </div>

            {/* Aplicaciones */}
            {detail.applications.length > 0 && (
              <div className="border border-border rounded-lg p-4 bg-white">
                <h3 className="text-lg font-semibold mb-4 text-primary">Aplicaciones del Anticipo</h3>
                <div className="space-y-3">
                  {detail.applications.map((app, index) => (
                    <div key={index} className="border border-border rounded p-3 bg-white">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-muted-foreground">Monto Aplicado:</span>
                          <span className="text-sm font-semibold">{formatCLP(app.amount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-muted-foreground">Fecha de Aplicación:</span>
                          <span className="text-sm">{formatAuditDate(app.appliedAt)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-muted-foreground">Usuario:</span>
                          <span className="text-sm">{app.userName || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-muted-foreground">ID de Liquidación:</span>
                          <span className="font-mono text-sm">{app.settlementTransactionId || '—'}</span>
                        </div>
                      </div>
                      {app.notes && (
                        <div className="mt-2">
                          <span className="text-sm font-medium text-muted-foreground">Notas de Aplicación:</span>
                          <p className="text-sm mt-1 leading-relaxed text-foreground">{app.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Dialog>
      )}
    </>
  );
}