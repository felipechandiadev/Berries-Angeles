'use client';

import { useState } from 'react';
import type { ReceptionDetailPack, ReceptionDetailPalletAssignment } from '../types';
import { DeletePackButton } from './DeletePackButton';
import { UpdatePackImpurityDialog } from './UpdatePackImpurityDialog';
import { UpdatePackPriceDialog } from './UpdatePackPriceDialog';
import IconButton from '@/app/baseComponents/IconButton/IconButton';

interface PackCardProps {
  pack: ReceptionDetailPack;
  receptionId: string;
  onPackDeleted?: () => void;
}

const numberFormatter = new Intl.NumberFormat('es-CL', {
  maximumFractionDigits: 2,
});

const clpCurrencyFormatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});

const usdCurrencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

function formatAssignments(assignments: ReceptionDetailPalletAssignment[]): string[] {
  if (!assignments.length) {
    return [];
  }

  return assignments.map((assignment) => {
    return `Pallet ${assignment.palletId} · ${assignment.traysAssigned} bandejas`;
  });
}

export function PackCard({ pack, receptionId, onPackDeleted }: PackCardProps) {
  const [updateImpurityOpen, setUpdateImpurityOpen] = useState(false);
  const [updatePriceOpen, setUpdatePriceOpen] = useState(false);
  const assignments = formatAssignments(pack.palletAssignments);
  const priceFormatter = pack.currency === 'USD' ? usdCurrencyFormatter : clpCurrencyFormatter;
  const totalFormatter = pack.currency === 'USD' ? usdCurrencyFormatter : clpCurrencyFormatter;

  return (
    <article className="flex flex-col gap-4 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <header className="flex items-start justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-xs uppercase text-muted-foreground">Pack</span>
          <span className="text-lg font-semibold text-foreground">{pack.packId}</span>
        </div>
        <div className="flex items-start gap-3">
          <div className="text-right text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{pack.varietyName ?? 'Variedad no especificada'}</span>
            <span className="block text-[10px] uppercase tracking-wide text-neutral-400">{pack.formatName ?? 'Formato no especificado'}</span>
          </div>
        </div>
      </header>

      <dl className="grid gap-3 text-sm md:grid-cols-2">
        <div>
          <dt className="text-xs uppercase text-muted-foreground">Bandeja</dt>
          <dd className="text-foreground">{pack.trayLabel ?? pack.trayId ?? 'Sin bandeja asignada'}</dd>
        </div>
        <div className="text-right md:text-left">
          <dt className="text-xs uppercase text-muted-foreground">Bandejas</dt>
          <dd className="font-medium text-foreground">{pack.traysQuantity.toLocaleString('es-CL')}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-muted-foreground">Peso bruto</dt>
          <dd className="text-foreground">{numberFormatter.format(pack.grossWeightKg)} kg</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-muted-foreground">Peso neto</dt>
          <dd className="text-foreground">{numberFormatter.format(pack.netWeightKg)} kg</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-muted-foreground">Impureza</dt>
          <dd className="flex items-center gap-1 text-foreground">
            {numberFormatter.format(pack.impurityPercent)} %
            <IconButton
              icon="edit"
              size="sm"
              variant="text"
              onClick={() => setUpdateImpurityOpen(true)}
              aria-label="Editar impureza"
            />
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-muted-foreground">Precio unitario</dt>
          <dd className="flex items-center gap-1 text-foreground">
            {priceFormatter.format(pack.pricePerKg)}
            <span className="ml-1 text-xs uppercase text-muted-foreground">{pack.currency}</span>
            <IconButton icon="edit" size="sm" variant="text" onClick={() => setUpdatePriceOpen(true)} />
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-muted-foreground">Total</dt>
          <dd className="text-foreground">
            {totalFormatter.format(pack.totalToPay)}
            <span className="ml-1 text-xs uppercase text-muted-foreground">{pack.currency}</span>
          </dd>
        </div>
      </dl>

      <section>
        <p className="text-xs uppercase text-muted-foreground">Asignaciones de pallet</p>
        {assignments.length ? (
          <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
            {assignments.map((assignment) => (
              <li key={assignment}>{assignment}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">Sin asignaciones registradas</p>
        )}
      </section>

      <div className="flex justify-end">
        <DeletePackButton
          receptionId={receptionId}
          pack={pack}
          onDeleted={onPackDeleted}
          data-test-id={`delete-pack-button-${pack.packId}`}
        />
      </div>

      <UpdatePackImpurityDialog
        open={updateImpurityOpen}
        onClose={() => setUpdateImpurityOpen(false)}
        receptionId={receptionId}
        pack={pack}
        onSuccess={() => {
          setUpdateImpurityOpen(false);
          // Optionally refresh the parent component
          window.location.reload();
        }}
        data-test-id={`update-impurity-dialog-${pack.packId}`}
      />

      <UpdatePackPriceDialog
        open={updatePriceOpen}
        onClose={() => setUpdatePriceOpen(false)}
        receptionId={receptionId}
        pack={pack}
        onSuccess={() => {
          setUpdatePriceOpen(false);
          // Optionally refresh the parent component
          window.location.reload();
        }}
        data-test-id={`update-price-dialog-${pack.packId}`}
      />
    </article>
  );
}
