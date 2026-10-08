'use client';

import { useState } from 'react';
import { formatAuditDate } from '@/lib/dateTimeUtils';
import IconButton from '@/app/baseComponents/IconButton/IconButton';
import Dialog from '@/app/baseComponents/Dialog/Dialog';
import { Button } from '@/app/baseComponents/Button/Button';
import { TextField } from '@/app/baseComponents/TextField/TextField';
import UpdateBaseForm, { BaseUpdateFormField } from '@/app/baseComponents/BaseForm/UpdateBaseForm';
import { updateReceptionDate, updateReceptionExchangeRate } from '@/app/actions/receptions';
import { useAlert } from '@/app/state/hooks/useAlert';
import { useSession } from 'next-auth/react';
import type { ReceptionDetailSummary, ReceptionDetailTotals, ReceptionDetailDocumentInfo } from '../types';
import { paymentStatusLabel } from '@/lib/receptionPayment';

interface SummarySectionProps {
  summary: ReceptionDetailSummary;
  totals: ReceptionDetailTotals | null;
  documents: ReceptionDetailDocumentInfo;
  onRefresh?: () => void;
}

const numberFormatter = new Intl.NumberFormat('es-CL', {
  maximumFractionDigits: 2,
});

const currencyFormatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});

const usdFormatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

export function SummarySection({ summary, totals, documents, onRefresh }: SummarySectionProps) {
  const [isEditDateDialogOpen, setIsEditDateDialogOpen] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [reason, setReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [isEditExchangeRateDialogOpen, setIsEditExchangeRateDialogOpen] = useState(false);
  const [exchangeRateFormErrors, setExchangeRateFormErrors] = useState<string[]>([]);

  const { data: session } = useSession();
  const currentUserId = (session?.user as any)?.id;
  const { success, error: showError } = useAlert();

  const handleEditExchangeRate = () => {
    setExchangeRateFormErrors([]);
    setIsEditExchangeRateDialogOpen(true);
  };

  const handleEditDate = () => {
    const currentDate = summary.createdAt ? new Date(summary.createdAt).toISOString().slice(0, 16) : '';
    setNewDate(currentDate);
    setReason('');
    setIsEditDateDialogOpen(true);
  };

  const exchangeRateFormFields: BaseUpdateFormField[] = [
    {
      name: 'newExchangeRate',
      label: 'Nuevo tipo de cambio (CLP/USD)',
      type: 'currency',
      required: true,
      currencySymbol: 'CLP',
      allowDecimalComma: true,
    },
    {
      name: 'reason',
      label: 'Motivo del cambio',
      type: 'textarea',
      required: true,
      rows: 3,
    },
  ];

  const exchangeRateInitialState = {
    newExchangeRate:
      summary.exchangeRate !== undefined && summary.exchangeRate !== null
        ? summary.exchangeRate.toLocaleString('es-CL', { maximumFractionDigits: 2 })
        : '',
    reason: '',
  };

  const handleSaveExchangeRate = async (data: Record<string, unknown>) => {
    const rawValue = String(data.newExchangeRate ?? '').trim();
    const normalizedValue = rawValue.replace(/\./g, '').replace(',', '.');
    const rate = Number(normalizedValue);
    if (!rawValue || Number.isNaN(rate) || rate < 0) {
      throw new Error('Debe ingresar un tipo de cambio válido (número positivo)');
    }

    if (!(data.reason as string)?.trim()) {
      throw new Error('Debe proporcionar un motivo para el cambio de tipo de cambio');
    }

    if (!currentUserId) {
      throw new Error('Usuario no autenticado');
    }

    const result = await updateReceptionExchangeRate({
      receptionId: summary.id,
      newExchangeRate: rate,
      reason: (data.reason as string).trim(),
      userId: currentUserId,
    });

    if (!result.success) {
      throw new Error(result.error || 'Error al actualizar el tipo de cambio');
    }

    success('Tipo de cambio de recepción actualizado correctamente');
    setIsEditExchangeRateDialogOpen(false);
    onRefresh?.();
  };

  const handleSaveDate = async () => {
    if (!reason.trim()) {
      showError('Debe proporcionar un motivo para el cambio de fecha');
      return;
    }

    if (!newDate) {
      showError('Debe seleccionar una fecha válida');
      return;
    }

    if (!currentUserId) {
      showError('Usuario no autenticado');
      return;
    }

    setIsSaving(true);

    try {
      const result = await updateReceptionDate({
        receptionId: summary.id,
        newDate,
        reason: reason.trim(),
        userId: currentUserId,
      });

      if (result.success) {
        success('Fecha de recepción actualizada correctamente');
        setIsEditDateDialogOpen(false);
        onRefresh?.();
      } else {
        showError(result.error || 'Error al actualizar la fecha');
      }
    } catch (err: any) {
      console.error('Error updating reception date:', err);
      showError('Error inesperado al actualizar la fecha');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {/* Row 1 */}
          <div className="border border-gray-200 rounded-md p-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">Temporada</p>
            <p className="text-base font-medium text-gray-900">{summary.seasonName ?? '—'}</p>
          </div>
          <div className="border border-gray-200 rounded-md p-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">Identificador</p>
            <p className="text-lg font-semibold text-gray-900">{summary.id}</p>
            {summary.guideNumber && (
              <p className="text-sm text-gray-600 mt-1">Guía #{summary.guideNumber}</p>
            )}
          </div>
          <div className="border border-gray-200 rounded-md p-3 relative">
            <div className="absolute top-2 right-2">
              <IconButton
                icon="edit"
                size="sm"
                variant="text"
                onClick={handleEditDate}
                title="Editar fecha y hora de recepción"
              />
            </div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Fecha de registro</p>
            <p className="text-base font-medium text-gray-900">
              {summary.createdAt ? formatAuditDate(summary.createdAt) : '—'}
            </p>
            {summary.createdByName && (
              <p className="text-sm text-gray-600 mt-1">Registrada por {summary.createdByName}</p>
            )}
          </div>

          {/* Row 2 */}
          <div className="border border-gray-200 rounded-md p-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">Productor</p>
            <p className="text-base font-medium text-gray-900">{summary.producerName ?? '—'}</p>
          </div>
          <div className="border border-gray-200 rounded-md p-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">Variedades</p>
            <p className="text-base font-medium text-gray-900">
              {documents.varietyNames.length > 0 ? documents.varietyNames.join(', ') : '—'}
            </p>
          </div>
          <div className="border border-gray-200 rounded-md p-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">Formatos</p>
            <p className="text-base font-medium text-gray-900">
              {documents.formatNames.length > 0 ? documents.formatNames.join(', ') : '—'}
            </p>
          </div>

          {/* Row 3 */}
          <div className="border border-gray-200 rounded-md p-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">Tipos de bandeja</p>
            <p className="text-base font-medium text-gray-900">
              {documents.trayLabels.length > 0 ? documents.trayLabels.join(', ') : '—'}
            </p>
          </div>
          <div className="border border-gray-200 rounded-md p-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">CLP</p>
            <p className="text-base font-medium text-gray-900">
              {currencyFormatter.format(totals?.payableCLP ?? 0)}
            </p>
          </div>
          <div className="border border-gray-200 rounded-md p-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">USD</p>
            <p className="text-base font-medium text-gray-900">
              {usdFormatter.format(totals?.payableUSD ?? summary.payableUSD ?? 0)}
            </p>
          </div>

          {/* Row 4 */}
          <div className="border border-gray-200 rounded-md p-3 relative">
            <div className="absolute top-2 right-2">
              <IconButton
                icon="edit"
                size="sm"
                variant="text"
                onClick={handleEditExchangeRate}
                title="Editar tipo de cambio de recepción"
              />
            </div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Cambio</p>
            <p className="text-base font-medium text-gray-900">
              {summary.exchangeRate !== undefined && summary.exchangeRate !== null
                ? numberFormatter.format(summary.exchangeRate)
                : '—'}
            </p>
          </div>
          <div className="border border-gray-200 rounded-md p-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">Total a pagar</p>
            <p className="text-base font-semibold text-gray-900">
              {currencyFormatter.format(totals?.totalCLPToPay ?? summary.totalCLPToPay ?? summary.amount ?? 0)}
            </p>
            {summary.payableUSD != null && Number(summary.payableUSD) > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                Equivalente USD: {Number(summary.payableUSD).toLocaleString('es-CL', { maximumFractionDigits: 2 })}
              </p>
            )}
          </div>
          <div className="border border-gray-200 rounded-md p-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">Estado de pago</p>
            <p className="text-base font-medium text-gray-900">
              {paymentStatusLabel(summary.paymentStatus)}
            </p>
          </div>
        </div>
      {summary.updatedAt && summary.updatedAt !== summary.createdAt && (
        <div className="text-xs text-gray-500">
          Última actualización {formatAuditDate(summary.updatedAt)}
        </div>
      )}
      </div>

      <Dialog
        open={isEditDateDialogOpen}
        onClose={() => !isSaving && setIsEditDateDialogOpen(false)}
        title="Editar fecha y hora de recepción"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div>
            <TextField
              label="Nueva fecha y hora"
              type="datetime-local"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              required
              disabled={isSaving}
            />
          </div>
          <div>
            <TextField
              label="Motivo del cambio"
              type="textarea"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explique por qué necesita cambiar la fecha..."
              rows={3}
              required
              disabled={isSaving}
            />
          </div>
          <div className="text-sm text-gray-600">
            <p>Fecha actual: {summary.createdAt ? formatAuditDate(summary.createdAt) : 'No disponible'}</p>
            <p className="text-xs mt-1 text-amber-600">
              ⚠️ Este cambio afectará reportes históricos y auditoría
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outlined"
              onClick={() => setIsEditDateDialogOpen(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveDate}
              disabled={isSaving}
            >
              {isSaving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={isEditExchangeRateDialogOpen}
        onClose={() => setIsEditExchangeRateDialogOpen(false)}
        title="Editar tipo de cambio de recepción"
        maxWidth="sm"
      >
        <div className="mb-4 text-sm text-gray-600">
          <p>Tipo de cambio actual: {summary.exchangeRate !== undefined && summary.exchangeRate !== null
            ? numberFormatter.format(summary.exchangeRate)
            : 'No disponible'}</p>
          <p className="text-xs mt-1 text-amber-600">
            ⚠️ Este cambio afectará los cálculos de montos en CLP para esta recepción
          </p>
        </div>
        <UpdateBaseForm
          fields={exchangeRateFormFields}
          initialState={exchangeRateInitialState}
          onSubmit={handleSaveExchangeRate}
          onCancel={() => setIsEditExchangeRateDialogOpen(false)}
          submitLabel="Guardar cambios"
          cancelButtonText="Cancelar"
          errors={exchangeRateFormErrors}
        />
      </Dialog>
    </>
  );
}
