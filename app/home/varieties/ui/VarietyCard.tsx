'use client';
import React, { useState } from 'react';
import IconButton from '@/app/baseComponents/IconButton/IconButton';
import DeleteVarietyDialog from './DeleteVarietyDialog';
import UpdateVarietyDialog from './UpdateVarietyDialog';
import VarietyPricesDialog from './VarietyPricesDialog';
import type { VarietyQualityPrice } from '@/data/entities/Variety';

export interface VarietyCardProps {
  variety: {
    id: number;
    name: string;
    qualityPrices?: VarietyQualityPrice[];
  };
  'data-test-id'?: string;
}

const VarietyCard: React.FC<VarietyCardProps> = ({ variety, 'data-test-id': dataTestId }) => {
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [openPricesDialog, setOpenPricesDialog] = useState(false);
  const prices = variety.qualityPrices ?? [];

  return (
    <article
      className="border border-neutral-200 bg-white rounded-lg shadow-sm p-4 flex flex-col justify-between min-w-[260px]"
      data-test-id={dataTestId}
    >
      <div className="flex flex-col gap-2 w-full overflow-hidden mb-2">
        <h3 className="text-lg font-semibold text-foreground truncate break-all" data-test-id={`${dataTestId}-name`}>
          {variety.name}
        </h3>
        <p className="text-xs text-secondary">
          {prices.length === 0
            ? 'Sin precios por calidad'
            : `${prices.length} calidad${prices.length === 1 ? '' : 'es'} configurada${prices.length === 1 ? '' : 's'}`}
        </p>
        <ul className="text-xs text-neutral-700 space-y-0.5 max-h-24 overflow-y-auto">
          {prices.slice(0, 4).map((p) => {
            const inactive = p.active === false;
            return (
              <li
                key={p.qualityId}
                className={`flex justify-between gap-2 ${inactive ? 'opacity-40 pointer-events-none' : ''}`}
                aria-disabled={inactive || undefined}
                title={inactive ? 'Calidad inactiva' : undefined}
              >
                <span className={`truncate ${inactive ? 'line-through' : ''}`}>
                  {p.qualityName}
                  {inactive ? ' (inactiva)' : ''}
                </span>
                <span className={`shrink-0 font-medium ${inactive ? 'line-through' : ''}`}>
                  {p.currency === 'USD' ? 'US$' : '$'}{' '}
                  {(p.currency === 'USD' ? p.priceUSD : p.priceCLP).toLocaleString('es-CL')}
                </span>
              </li>
            );
          })}
          {prices.length > 4 && (
            <li className="text-secondary">+{prices.length - 4} más…</li>
          )}
        </ul>
      </div>

      <div className="flex justify-end items-center mt-4 gap-2" data-test-id={`${dataTestId}-buttons`}>
        <IconButton
          icon="payments"
          variant="basicSecondary"
          aria-label={`Precios de ${variety.name}`}
          title="Precios por calidad"
          onClick={() => setOpenPricesDialog(true)}
          data-test-id={`${dataTestId}-prices-button`}
        />
        <IconButton
          icon="edit"
          variant="basicSecondary"
          aria-label={`Editar variedad ${variety.name}`}
          onClick={() => setOpenUpdateDialog(true)}
          data-test-id={`${dataTestId}-edit-button`}
        />
        <IconButton
          icon="delete"
          variant="basicSecondary"
          aria-label={`Eliminar variedad ${variety.name}`}
          onClick={() => setOpenDeleteDialog(true)}
          data-test-id={`${dataTestId}-delete-button`}
        />
      </div>

      <UpdateVarietyDialog
        open={openUpdateDialog}
        onClose={() => setOpenUpdateDialog(false)}
        variety={variety}
      />
      <DeleteVarietyDialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        variety={variety}
      />
      <VarietyPricesDialog
        open={openPricesDialog}
        onClose={() => setOpenPricesDialog(false)}
        variety={{
          id: variety.id,
          name: variety.name,
          qualityPrices: prices,
        }}
      />
    </article>
  );
};

export default VarietyCard;
