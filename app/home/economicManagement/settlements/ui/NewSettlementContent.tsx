'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import type { Option } from '@/app/baseComponents/AutoComplete/AutoComplete';
import { Button } from '@/app/baseComponents/Button/Button';
import {
  saveSettlement,
  type PendingAdvancesResult,
  type PendingReceptionsResult,
  type SettlementStatus,
  type SettlementWizardData,
} from '@/app/actions/settlements';
import { useAlert } from '@/app/state/contexts/AlertContext';
import { useSubmitLock } from '@/app/state/hooks/useSubmitLock';
import PendingReceptionsSection from './PendingReceptionsSection';
import PendingAdvancesSection from './PendingAdvancesSection';
import SettlementSummary from './SettlementSummary';

interface NewSettlementContentProps {
  producerOptions: Option[];
  selectedProducerId?: string;
  receptions: PendingReceptionsResult;
  advances: PendingAdvancesResult;
  editingSettlement?: SettlementWizardData | null;
}

const STEPS = [
  { id: 1, label: 'Recepciones' },
  { id: 2, label: 'Anticipos' },
  { id: 3, label: 'Resumen' },
] as const;

const clpFormatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});

function formatCLP(value: number): string {
  return clpFormatter.format(Number.isFinite(value) ? value : 0);
}

const toIdSet = (ids: string[]): Set<string> => new Set(ids);

export default function NewSettlementContent({
  producerOptions,
  selectedProducerId,
  receptions,
  advances,
  editingSettlement = null,
}: NewSettlementContentProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const currentUserId = (session?.user as { id?: string } | undefined)?.id;
  const { showAlert } = useAlert();
  const { isSubmitting, run } = useSubmitLock();

  const [step, setStep] = useState(1);
  const [selectedReceptionIds, setSelectedReceptionIds] = useState<Set<string>>(() => {
    if (editingSettlement) {
      return toIdSet(editingSettlement.receptionTransactionIds);
    }
    return toIdSet(receptions.rows.map((row) => row.transactionId));
  });
  const [selectedAdvanceIds, setSelectedAdvanceIds] = useState<Set<string>>(() => {
    if (editingSettlement) {
      return toIdSet(editingSettlement.advanceApplications.map((a) => a.transactionId));
    }
    return toIdSet(advances.rows.map((row) => row.transactionId));
  });

  useEffect(() => {
    if (editingSettlement) return;
    setSelectedReceptionIds(toIdSet(receptions.rows.map((row) => row.transactionId)));
  }, [editingSettlement, receptions.rows]);

  useEffect(() => {
    if (editingSettlement) return;
    setSelectedAdvanceIds(toIdSet(advances.rows.map((row) => row.transactionId)));
  }, [advances.rows, editingSettlement]);

  const producerLabel =
    producerOptions.find((opt) => opt.id === selectedProducerId)?.label ||
    selectedProducerId ||
    'Sin productor';

  const handleReceptionToggle = (id: string, checked: boolean) => {
    setSelectedReceptionIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleAdvanceToggle = (id: string, checked: boolean) => {
    setSelectedAdvanceIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const {
    selectedReceptions,
    selectedAdvances,
    receptionsCount,
    receptionsTotal,
    advancesCount,
    advancesTotal,
    balance,
    validationError,
  } = useMemo(() => {
    const selectedReceptionRows = receptions.rows.filter((row) =>
      selectedReceptionIds.has(row.transactionId),
    );
    const selectedAdvanceRows = advances.rows.filter((row) =>
      selectedAdvanceIds.has(row.transactionId),
    );

    const receptionsTotalAmount = selectedReceptionRows.reduce(
      (total, row) => total + row.totalCLPToPay,
      0,
    );
    const advancesTotalAmount = selectedAdvanceRows.reduce(
      (total, row) => total + row.availableAmount,
      0,
    );

    let error: string | null = null;
    if (selectedReceptionRows.length > 0 && advancesTotalAmount > receptionsTotalAmount) {
      error = 'Los anticipos no pueden superar el total de las recepciones.';
    } else if (selectedReceptionRows.length === 0 && selectedAdvanceRows.length === 0) {
      error = 'Debe seleccionar al menos una recepción o un anticipo.';
    }

    return {
      selectedReceptions: selectedReceptionRows,
      selectedAdvances: selectedAdvanceRows,
      receptionsCount: selectedReceptionRows.length,
      receptionsTotal: receptionsTotalAmount,
      advancesCount: selectedAdvanceRows.length,
      advancesTotal: advancesTotalAmount,
      balance: Math.max(0, receptionsTotalAmount - advancesTotalAmount),
      validationError: error,
    };
  }, [advances.rows, selectedAdvanceIds, selectedReceptionIds, receptions.rows]);

  const canSave = Boolean(selectedProducerId && !validationError);

  const canGoNextFromStep1 = Boolean(selectedProducerId);
  const canGoNextFromStep2 = true;

  const persist = async (nextStatus: SettlementStatus) => {
    if (status === 'loading') {
      showAlert({
        message: 'Cargando sesión de usuario. Por favor, espere un momento.',
        type: 'error',
        duration: 4000,
      });
      return;
    }

    if (!currentUserId) {
      showAlert({
        message: 'Usuario no autenticado. Por favor, inicie sesión nuevamente.',
        type: 'error',
        duration: 4000,
      });
      return;
    }

    if (!selectedProducerId) {
      showAlert({
        message: 'Debe seleccionar un productor.',
        type: 'error',
        duration: 4000,
      });
      return;
    }

    if (validationError) {
      showAlert({
        message: validationError,
        type: 'error',
        duration: 5000,
      });
      return;
    }

    const result = await run(async () => {
      const response = await saveSettlement({
        producerId: selectedProducerId,
        userId: currentUserId,
        status: nextStatus,
        settlementId: editingSettlement?.settlementId,
        receptionTransactionIds: selectedReceptions.map((row) => row.transactionId),
        advanceApplications: selectedAdvances.map((row) => ({
          transactionId: row.transactionId,
          amount: Math.round(row.availableAmount),
        })),
      });

      if (!response.success) {
        showAlert({
          message: response.error || 'Error al guardar la liquidación.',
          type: 'error',
          duration: 5000,
        });
        return { ok: false };
      }

      showAlert({
        message:
          nextStatus === 'BORRADOR'
            ? 'Borrador guardado. Las recepciones y anticipos quedaron asociados.'
            : 'Liquidación completada exitosamente.',
        type: 'success',
        duration: 4000,
      });
      return { ok: true };
    });

    if (result?.ok) {
      router.push('/home/economicManagement/settlements?tab=list');
      router.refresh();
    }
  };

  const stepBaseClass =
    'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors duration-200 focus-visible:outline-none';
  const stepInteractiveClass =
    'hover:bg-[color-mix(in_srgb,var(--color-primary)_8%,transparent)] focus-visible:bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)]';
  const stepActiveClass =
    'bg-[color-mix(in_srgb,var(--color-secondary)_28%,transparent)] hover:bg-[color-mix(in_srgb,var(--color-secondary)_38%,transparent)]';
  const stepDoneClass =
    'bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] text-primary';
  const stepIdleClass = 'text-muted-foreground';

  return (
    <div className="space-y-6">
      {/* Flush under app TopBar: same token as shell inset (--app-topbar-height) */}
      <div className="sticky top-[var(--app-topbar-height)] z-20 -mx-page border-b border-border/80 bg-background/90 px-page py-3 shadow-sm backdrop-blur-md backdrop-saturate-150 supports-[backdrop-filter]:bg-background/75">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <ol className="flex flex-wrap items-center gap-1.5" aria-label="Pasos de liquidación">
            {STEPS.map((item, index) => {
              const active = step === item.id;
              const done = step > item.id;
              const canNavigate =
                item.id === 1 ||
                (item.id === 2 && canGoNextFromStep1) ||
                (item.id === 3 && canGoNextFromStep1);

              return (
                <li key={item.id} className="flex items-center gap-1.5">
                  {index > 0 && (
                    <span
                      className="mx-0.5 h-px w-4 bg-border sm:w-6"
                      aria-hidden
                    />
                  )}
                  <button
                    type="button"
                    aria-current={active ? 'step' : undefined}
                    disabled={!canNavigate && !active}
                    onClick={() => {
                      if (!canNavigate) return;
                      setStep(item.id);
                    }}
                    className={[
                      stepBaseClass,
                      active ? stepActiveClass : stepInteractiveClass,
                      !active && done ? stepDoneClass : '',
                      !active && !done ? stepIdleClass : '',
                      !canNavigate && !active ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <span
                      className={[
                        'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold',
                        active
                          ? 'bg-[color-mix(in_srgb,var(--color-secondary)_45%,transparent)] text-foreground'
                          : done
                            ? 'bg-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] text-primary'
                            : 'border border-border bg-white text-muted-foreground',
                      ].join(' ')}
                    >
                      {item.id}
                    </span>
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ol>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-secondary sm:text-sm">
            {editingSettlement && (
              <span className="rounded-lg bg-[color-mix(in_srgb,var(--color-secondary)_22%,transparent)] px-2.5 py-1 font-medium text-foreground">
                Borrador #{editingSettlement.settlementId}
              </span>
            )}
            <span className="truncate max-w-[12rem]" title={producerLabel}>
              {producerLabel}
            </span>
            <span>
              Rec. {receptionsCount} · {formatCLP(receptionsTotal)}
            </span>
            <span>
              Ant. {advancesCount} · {formatCLP(advancesTotal)}
            </span>
            <span className="font-semibold text-primary">Neto {formatCLP(balance)}</span>
          </div>
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-4 pb-24">
          <PendingReceptionsSection
            producerOptions={producerOptions}
            selectedProducerId={selectedProducerId}
            data={receptions}
            selectedIds={selectedReceptionIds}
            onToggle={handleReceptionToggle}
          />
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 pb-24">
          <PendingAdvancesSection
            selectedProducerId={selectedProducerId}
            data={advances}
            selectedIds={selectedAdvanceIds}
            onToggle={handleAdvanceToggle}
          />
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 pb-24">
          <SettlementSummary
            receptionsCount={receptionsCount}
            receptionsTotal={receptionsTotal}
            advancesCount={advancesCount}
            advancesTotal={advancesTotal}
            balance={balance}
            canSave={canSave}
            validationError={validationError}
            isSubmitting={isSubmitting}
            onSaveDraft={() => void persist('BORRADOR')}
            onComplete={() => void persist('COMPLETA')}
          />
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-border/80 bg-background/90 px-page py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] backdrop-blur-md backdrop-saturate-150 supports-[backdrop-filter]:bg-background/75">
        <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="justify-self-start">
            {step > 1 ? (
              <Button type="button" variant="outlined" onClick={() => setStep(step - 1)}>
                Anterior
              </Button>
            ) : (
              <span className="inline-block min-w-[6.5rem]" aria-hidden />
            )}
          </div>

          <div className="justify-self-center text-center">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {step === 2 ? 'Anticipos seleccionados' : 'Recepciones seleccionadas'}
            </p>
            <p className="text-sm font-semibold text-foreground sm:text-base">
              {step === 2
                ? `${advancesCount} · ${formatCLP(advancesTotal)}`
                : `${receptionsCount} · ${formatCLP(receptionsTotal)}`}
            </p>
          </div>

          <div className="justify-self-end">
            {step < 3 ? (
              <Button
                type="button"
                variant="primary"
                disabled={step === 1 ? !canGoNextFromStep1 : !canGoNextFromStep2}
                onClick={() => setStep(step + 1)}
              >
                Siguiente
              </Button>
            ) : (
              <span className="inline-block min-w-[6.5rem]" aria-hidden />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
