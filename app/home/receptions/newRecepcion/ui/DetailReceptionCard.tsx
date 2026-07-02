'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import VarietySelector from './detailCardComponents/VarietySelector';
import FormatSelector from './detailCardComponents/FormatSelector';
import TraySelector from './detailCardComponents/TraySelector';
import TraysQuantityStepper from './detailCardComponents/TraysQuantityStepper';
import GrossWeightInput from './detailCardComponents/GrossWeightInput';
import ImpurityPercent from './detailCardComponents/ImpurityPercent';
import { getVarietiesWithPriceAndCurrency } from '@/app/actions/varieties';
import { getFormatsSimpleList } from '@/app/actions/formats';
import { Currency } from '@/data/entities/Variety';
import PalletPicker, { type PalletPickerSelection } from './PalletPicker';
import IconButton from '@/app/baseComponents/IconButton/IconButton';
import CreatePalletDialog from './detailCardComponents/CreatePalletDialog';

type ReceptionDetailsState = {
  varietyId: number | null;
  formatId: number | null;
  trayId: string | null;
  trayLabel: string | null;
  traysQuantity: number;
  impurityPercent: number;
  price: number;
  currency: Currency | null;
  grossWeight: number;
  palletAssignments: Array<{ palletId: number; traysAssigned: number }>;
};
type DetailReceptionSummary = ReceptionDetailsState & {
  unitTrayWeight: number;
  traysTotalWeight: number;
  netWeightBeforeImpurities: number;
  netWeight: number;
  totalToPay: number;
  varietyName: string | null;
  formatName: string | null;
};

export type { DetailReceptionSummary };

interface DetailReceptionCardProps {
  packNumber?: number;
  onRemove?: () => void;
  onChange?: (details: DetailReceptionSummary) => void;
}

const DetailReceptionCard: React.FC<DetailReceptionCardProps> = ({ packNumber, onRemove, onChange }) => {
  const [varietyOptions, setVarietyOptions] = useState<{ id: number; label: string; price: number; currency: Currency }[]>([]);
  const [selectedVariety, setSelectedVariety] = useState<{ price: number; currency: Currency } | null>(null);
  const [formatOptions, setFormatOptions] = useState<{ id: number; label: string }[]>([]);
  const [receptionDetails, setReceptionDetails] = useState<ReceptionDetailsState>({
    varietyId: null as number | null,
    formatId: null as number | null,
    trayId: null as string | null,
    trayLabel: null,
    traysQuantity: 0,
    impurityPercent: 0,
    price: 0, // Add price to receptionDetails
    currency: null as Currency | null, // Add currency to receptionDetails
    grossWeight: 0,
    palletAssignments: [] as Array<{ palletId: number; traysAssigned: number }>,
  });
  const [unitTrayWeight, setUnitTrayWeight] = useState(0);
  const [showImpurityWeight, setShowImpurityWeight] = useState(false);
  const [palletAssignments, setPalletAssignments] = useState<PalletPickerSelection>([]);
  const [isPalletPickerOpen, setIsPalletPickerOpen] = useState(false);
  const [createPalletDialogOpen, setCreatePalletDialogOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchVarieties = async () => {
      const varieties = await getVarietiesWithPriceAndCurrency();
      setVarietyOptions(varieties);
    };

    const fetchFormats = async () => {
      const formats = await getFormatsSimpleList();
      setFormatOptions(formats);
    };

    fetchVarieties();
    fetchFormats();
  }, []);

  useEffect(() => {
    if (!onChange) {
      return;
    }

    const traysTotalWeightCalculated = unitTrayWeight > 0 && receptionDetails.traysQuantity > 0
      ? unitTrayWeight * receptionDetails.traysQuantity
      : 0;

    const grossWeightValue = receptionDetails.grossWeight > 0 ? receptionDetails.grossWeight : 0;
    const netWeightBeforeImpuritiesValue = Math.max(grossWeightValue - traysTotalWeightCalculated, 0);
    const impurityFractionValue = receptionDetails.impurityPercent > 0 ? receptionDetails.impurityPercent / 100 : 0;
    const netWeightValue = Math.max(netWeightBeforeImpuritiesValue - netWeightBeforeImpuritiesValue * impurityFractionValue, 0);
    const totalToPayValue = receptionDetails.price > 0 && netWeightValue > 0
      ? netWeightValue * receptionDetails.price
      : 0;

    const varietyOption = receptionDetails.varietyId !== null
      ? varietyOptions.find((option) => option.id === receptionDetails.varietyId)
      : undefined;
    const formatOption = receptionDetails.formatId !== null
      ? formatOptions.find((option) => option.id === receptionDetails.formatId)
      : undefined;

    onChange({
      ...receptionDetails,
      unitTrayWeight,
      traysTotalWeight: traysTotalWeightCalculated,
      netWeightBeforeImpurities: netWeightBeforeImpuritiesValue,
      netWeight: netWeightValue,
      totalToPay: totalToPayValue,
      varietyName: varietyOption?.label ?? null,
      formatName: formatOption?.label ?? null,
    });
  }, [receptionDetails, unitTrayWeight, onChange, varietyOptions, formatOptions]);

  const handleVarietyChange = (id: number | null, price: number, currency: Currency | null) => {
    setReceptionDetails((prev) => ({
      ...prev,
      varietyId: id,
      price: price,
      currency: currency,
    }));
  };

  const handleFormatChange = (id: number | null) => {
    setReceptionDetails((prev) => ({ ...prev, formatId: id }));
  };

  const handleTrayChange = (id: string | null, weight: number, label: string | null) => {
    setUnitTrayWeight(weight);
    setReceptionDetails((prev) => ({
      ...prev,
      trayId: id,
      trayLabel: label,
      palletAssignments: [],
    }));
    setPalletAssignments([]);
    setIsPalletPickerOpen(false);
  };

  const handleQuantityChange = (quantity: number) => {
    setReceptionDetails((prev) => ({ ...prev, traysQuantity: quantity }));
  };

  const handleImpurityToggle = (checked: boolean) => {
    setShowImpurityWeight(checked);
  };

  const handleImpurityChange = (percent: number) => {
    setReceptionDetails((prev) => ({ ...prev, impurityPercent: percent }));
  };

  const handleGrossWeightChange = (weight: number) => {
    setReceptionDetails((prev) => ({ ...prev, grossWeight: weight }));
  };

  const handlePalletSelectionChange = useCallback((selection: PalletPickerSelection) => {
    setPalletAssignments(selection);

    setReceptionDetails((prev) => {
      const normalized = selection.map(({ pallet, traysToAssign }) => ({
        palletId: pallet.id,
        traysAssigned: traysToAssign,
      }));

      const unchanged =
        prev.palletAssignments.length === normalized.length &&
        prev.palletAssignments.every((item, index) => {
          const nextItem = normalized[index];
          return (
            nextItem !== undefined &&
            item.palletId === nextItem.palletId &&
            item.traysAssigned === nextItem.traysAssigned
          );
        });

      if (unchanged) {
        return prev;
      }

      return {
        ...prev,
        palletAssignments: normalized,
      };
    });
  }, []);

  const traysTotalWeight = unitTrayWeight > 0 && receptionDetails.traysQuantity > 0
    ? unitTrayWeight * receptionDetails.traysQuantity
    : 0;

  const grossWeight = receptionDetails.grossWeight > 0 ? receptionDetails.grossWeight : 0;
  const netWeightBeforeImpurities = Math.max(grossWeight - traysTotalWeight, 0);
  const impurityFraction = receptionDetails.impurityPercent > 0 ? receptionDetails.impurityPercent / 100 : 0;
  const netWeight = Math.max(netWeightBeforeImpurities - netWeightBeforeImpurities * impurityFraction, 0);
  const totalToPay = receptionDetails.price > 0 && netWeight > 0
    ? netWeight * receptionDetails.price
    : 0;

  const totalAssignedToPallets = useMemo(() => (
    palletAssignments.reduce((acc, item) => acc + item.traysToAssign, 0)
  ), [palletAssignments]);

  const currencySymbol = receptionDetails.currency === Currency.USD ? 'US$' : '$';

  const formatNumber = (value: number, decimals = 2) =>
    new Intl.NumberFormat('es-CL', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);

  const formatTotal = (value: number) => {
    if (receptionDetails.currency === Currency.CLP) {
      return new Intl.NumberFormat('es-CL', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    }

    return formatNumber(value, 2);
  };

  return (
    <div className="p-4 rounded-md border border-border bg-white" data-test-id="reception-pack-card">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Pack</h2>
          {packNumber !== undefined ? (
            <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-primary/10 px-2 text-sm font-semibold text-primary">
              {packNumber}
            </span>
          ) : null}
        </div>
        <IconButton
          icon="delete"
          variant="basicSecondary"
          size="sm"
          ariaLabel="Eliminar pack"
          onClick={onRemove}
          disabled={!onRemove}
        />
      </div>

      <VarietySelector
        varietyId={receptionDetails.varietyId}
        onVarietyChange={handleVarietyChange}
        onPriceChange={(price) => setReceptionDetails((prev) => ({ ...prev, price }))}
        onCurrencyChange={(currency) => setReceptionDetails((prev) => ({ ...prev, currency }))}
        currentPrice={receptionDetails.price}
        currentCurrency={receptionDetails.currency}
        dataTestIdPrefix="pack"
      />

      <FormatSelector
        formatOptions={formatOptions}
        formatId={receptionDetails.formatId}
        onFormatChange={handleFormatChange}
        dataTestIdPrefix="pack"
      />

      <TraySelector
        trayId={receptionDetails.trayId}
        onTrayChange={handleTrayChange}
        dataTestIdPrefix="pack"
      />

      <div className="mt-2">
        <TraysQuantityStepper
          traysQuantity={receptionDetails.traysQuantity}
          unitTrayWeight={unitTrayWeight}
          onQuantityChange={handleQuantityChange}
        />
      </div>

      <div >
        <GrossWeightInput
          grossWeight={receptionDetails.grossWeight}
          onGrossWeightChange={handleGrossWeightChange}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded-md bg-card">
          <h3 className="text-xs font-semibold mb-2">Peso neto</h3>
          <p className="text-xl font-semibold">{formatNumber(netWeight)} kg</p>
        </div>

        <div className="p-4 border rounded-md bg-card">
          <h3 className="text-xs font-semibold mb-2">Total a pagar</h3>
          <p className="text-xl font-semibold">{currencySymbol} {formatTotal(totalToPay)}</p>
        </div>
      </div>

      <div className="mt-4">
        <ImpurityPercent
          showImpurityWeight={showImpurityWeight}
          impurityPercent={receptionDetails.impurityPercent}
          onToggle={handleImpurityToggle}
          onImpurityChange={handleImpurityChange}
        />
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setIsPalletPickerOpen((prev) => !prev)}
          disabled={!receptionDetails.trayId || receptionDetails.traysQuantity === 0}
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition-transform transition-colors duration-150 ${
            !receptionDetails.trayId || receptionDetails.traysQuantity === 0
              ? 'border-gray-300 text-gray-400 cursor-not-allowed'
              : 'border-primary text-primary hover:bg-primary/10 hover:-translate-y-0.5 hover:shadow-sm'
          }`}
          data-test-id="pack-pallet-toggle"
        >
          <span className="material-symbols-outlined text-base">category</span>
          <span>Pallet</span>
          {palletAssignments.length > 0 ? (
            <span className="text-xs text-gray-500">
              {palletAssignments.length === 1
                ? `#${palletAssignments[0].pallet.id} · ${formatNumber(palletAssignments[0].traysToAssign, 0)} bandejas`
                : `${palletAssignments.length} pallets · ${formatNumber(totalAssignedToPallets, 0)} bandejas`}
            </span>
          ) : null}
        </button>
        <IconButton
          icon="add"
          variant="basicSecondary"
          size="sm"
          ariaLabel="Crear pallet"
          onClick={() => setCreatePalletDialogOpen(true)}
          disabled={!receptionDetails.trayId}
          className="transition-transform duration-150 hover:-translate-y-0.5"
        />
      </div>

      {isPalletPickerOpen ? (
        <div className="mt-4">
          <PalletPicker
            expectedTrays={receptionDetails.traysQuantity}
            onSelectionChange={handlePalletSelectionChange}
            disabled={!receptionDetails.trayId || receptionDetails.traysQuantity === 0}
            trayId={receptionDetails.trayId}
            onClose={() => setIsPalletPickerOpen(false)}
            refreshTrigger={refreshTrigger}
          />
        </div>
      ) : null}

      {palletAssignments.length > 0 ? (
        <div className="mt-4 rounded-md border bg-card p-3 text-xs text-gray-500">
          <p className="font-semibold text-gray-700">Distribución de pallets</p>
          <ul className="mt-2 space-y-1">
            {palletAssignments.map(({ pallet, traysToAssign }) => (
              <li key={pallet.id}>Pallet #{pallet.id}: {formatNumber(traysToAssign, 0)} bandejas</li>
            ))}
          </ul>
          <p className="mt-2 text-gray-600">
            Total asignado: {formatNumber(totalAssignedToPallets, 0)} / {formatNumber(receptionDetails.traysQuantity, 0)} bandejas
          </p>
        </div>
      ) : null}

      <CreatePalletDialog
        open={createPalletDialogOpen}
        onClose={() => setCreatePalletDialogOpen(false)}
        trayId={receptionDetails.trayId!}
        onSuccess={() => setRefreshTrigger(prev => prev + 1)}
      />
    </div>
  );
};

export default DetailReceptionCard;