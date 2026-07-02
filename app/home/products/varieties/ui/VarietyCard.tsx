'use client';
import React, { useState } from 'react';
import Badge from '@/app/baseComponents/Badge/Badge';
import IconButton from '@/app/baseComponents/IconButton/IconButton';
import DeleteVarietyDialog from './DeleteVarietyDialog';
import UpdateVarietyDialog from './UpdateVarietyDialog';
import { Currency } from '../../../../../data/entities/Variety';

export interface VarietyCardProps {
  variety: {
    id: number;
    name: string;
    priceCLP: number;
    priceUSD: number;
    currency: Currency;
  };
  'data-test-id'?: string;
}

const VarietyCard: React.FC<VarietyCardProps> = ({ variety, 'data-test-id': dataTestId }) => {
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);

  const formatPrice = (price: number, currency: Currency) => {
    const symbol = currency === Currency.CLP ? '$' : 'USD';
    return `${symbol} ${price.toLocaleString('es-CL')}`;
  };

  const getCurrencyBadgeVariant = (currency: Currency): 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' | 'primary-outlined' | 'secondary-outlined' | 'success-outlined' | 'error-outlined' | 'warning-outlined' | 'info-outlined' => {
    // CLP azul, USD verde
    return currency === Currency.CLP ? 'primary-outlined' : 'success-outlined';
  };

  const getCurrencyLabel = (currency: Currency): string => {
    return currency === Currency.CLP ? 'CLP' : 'USD';
  };

  return (
    <article className="border border-neutral-200 bg-white rounded-lg shadow-sm p-4 flex flex-col justify-between min-w-[260px]" data-test-id={dataTestId}>
      {/* Información principal */}
      <div className="flex flex-col gap-2 w-full overflow-hidden mb-2">
        <h3 className="text-lg font-semibold text-foreground truncate break-all" data-test-id={`${dataTestId}-name`}>
          {variety.name}
        </h3>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-600">Precio CLP:</span>
            <span className="font-medium text-gray-900">{formatPrice(variety.priceCLP, Currency.CLP)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-600">Precio USD:</span>
            <span className="font-medium text-gray-900">{formatPrice(variety.priceUSD, Currency.USD)}</span>
          </div>
        </div>
      </div>

      {/* Acciones y badge en la parte inferior */}
      <div className="flex justify-between items-center mt-4" data-test-id={`${dataTestId}-actions-row`}>
        {/* Badge moneda a la izquierda */}
        <div data-test-id={`${dataTestId}-currency-badge`}>
          <Badge
            variant={getCurrencyBadgeVariant(variety.currency)}
            className="mb-0"
          >
            {getCurrencyLabel(variety.currency)}
          </Badge>
        </div>
        {/* IconButtons a la derecha */}
        <div className="flex gap-2" data-test-id={`${dataTestId}-buttons`}>
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
      </div>

      <UpdateVarietyDialog
        open={openUpdateDialog}
        onClose={() => setOpenUpdateDialog(false)}
        variety={variety}
        data-test-id={`${dataTestId}-update-dialog`}
      />

      <DeleteVarietyDialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        variety={variety}
        data-test-id={`${dataTestId}-delete-dialog`}
      />
    </article>
  );
};

export default VarietyCard;