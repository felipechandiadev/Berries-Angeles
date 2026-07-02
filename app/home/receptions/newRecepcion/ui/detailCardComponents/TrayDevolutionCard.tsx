"use client";

import React from 'react';
import Select from '@/app/baseComponents/Select/Select';
import { NumberStepper } from '@/app/baseComponents/NumberStepper/NumberStepper';
import IconButton from '@/app/baseComponents/IconButton/IconButton';

export interface TrayOption {
  id: string;
  label: string;
}

interface TrayDevolutionCardProps {
  trayId: string | null;
  quantity: number;
  trayOptions: TrayOption[];
  onTrayChange: (trayId: string | null) => void;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
  index?: number;
}

const TrayDevolutionCard: React.FC<TrayDevolutionCardProps> = ({
  trayId,
  quantity,
  trayOptions,
  onTrayChange,
  onQuantityChange,
  onRemove,
  index,
}) => {
  return (
    <div className="flex flex-col gap-4 rounded-md border border-border bg-white p-4 shadow-sm" data-test-id="tray-devolution-card">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">Bandeja a devolver{typeof index === 'number' ? ` #${index + 1}` : ''}</p>
        <IconButton
          icon="delete"
          variant="basicSecondary"
          size="sm"
          ariaLabel="Eliminar registro de devolución"
          onClick={onRemove}
        />
      </div>

      <div className="flex flex-col gap-3">
        <Select
          label="Tipo de bandeja"
          options={trayOptions}
          placeholder="Selecciona una bandeja"
          value={trayId}
          onChange={(value) => onTrayChange(value ? String(value) : null)}
          allowClear
          data-test-id="tray-devolution-select"
        />
        <NumberStepper
          label="Cantidad"
          value={quantity}
          onChange={onQuantityChange}
          min={0}
          allowNegative={false}
          data-test-id="tray-devolution-quantity"
          disabled={!trayId}
        />
      </div>
    </div>
  );
};

export default TrayDevolutionCard;
