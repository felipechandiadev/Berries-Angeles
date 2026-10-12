'use client';
import React, { useEffect, useState } from 'react';
import VarietySelector from './detailCardComponents/VarietySelector';
import FormatSelector from './detailCardComponents/FormatSelector';
import TraySelector from './detailCardComponents/TraySelector';
import TraysQuantityStepper from './detailCardComponents/TraysQuantityStepper';
import GrossWeightInput from './detailCardComponents/GrossWeightInput';
import ImpurityPercent from './detailCardComponents/ImpurityPercent';
import { getVarietiesSimpleList } from '@/app/actions/varieties';
import { getFormatsSimpleList } from '@/app/actions/formats';
import { Currency } from '@/data/entities/Variety';
import IconButton from '@/app/baseComponents/IconButton/IconButton';

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
  const [varietyOptions, setVarietyOptions] = useState<{ id: number; label: string }[]>([]);
  const [formatOptions, setFormatOptions] = useState<{ id: number; label: string }[]>([]);
  const [receptionDetails, setReceptionDetails] = useState<ReceptionDetailsState>({
    varietyId: null,
    formatId: null,
    trayId: null,
    trayLabel: null,
    traysQuantity: 0,
    impurityPercent: 0,
    price: 0,
    currency: null,
    grossWeight: 0,
    palletAssignments: [],
  });
  const [unitTrayWeight, setUnitTrayWeight] = useState(0);
  const [showImpurityWeight, setShowImpurityWeight] = useState(false);

  useEffect(() => {
    const fetchVarieties = async () => {
      const varieties = await getVarietiesSimpleList();
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

    const traysTotalWeightCalculated =
      unitTrayWeight > 0 && receptionDetails.traysQuantity > 0
        ? unitTrayWeight * receptionDetails.traysQuantity
        : 0;

    const grossWeightValue = receptionDetails.grossWeight > 0 ? receptionDetails.grossWeight : 0;
    const netWeightBeforeImpuritiesValue = Math.max(grossWeightValue - traysTotalWeightCalculated, 0);
    const impurityFractionValue =
      receptionDetails.impurityPercent > 0 ? receptionDetails.impurityPercent / 100 : 0;
    const netWeightValue = Math.max(
      netWeightBeforeImpuritiesValue - netWeightBeforeImpuritiesValue * impurityFractionValue,
      0,
    );
    const totalToPayValue =
      receptionDetails.price > 0 && netWeightValue > 0 ? netWeightValue * receptionDetails.price : 0;

    const varietyOption =
      receptionDetails.varietyId !== null
        ? varietyOptions.find((option) => option.id === receptionDetails.varietyId)
        : undefined;
    const formatOption =
      receptionDetails.formatId !== null
        ? formatOptions.find((option) => option.id === receptionDetails.formatId)
        : undefined;

    onChange({
      ...receptionDetails,
      palletAssignments: [],
      unitTrayWeight,
      traysTotalWeight: traysTotalWeightCalculated,
      netWeightBeforeImpurities: netWeightBeforeImpuritiesValue,
      netWeight: netWeightValue,
      totalToPay: totalToPayValue,
      varietyName: varietyOption?.label ?? null,
      formatName: formatOption?.label ?? null,
    });
  }, [receptionDetails, unitTrayWeight, onChange, varietyOptions, formatOptions]);

  const handleVarietyChange = (id: number | null) => {
    setReceptionDetails((prev) => ({
      ...prev,
      varietyId: id,
      formatId: null,
      price: 0,
      currency: null,
    }));
  };

  const handleFormatChange = (id: number | null, price: number, currency: Currency | null) => {
    setReceptionDetails((prev) => ({
      ...prev,
      formatId: id,
      price,
      currency,
    }));
  };

  const handleTrayChange = (id: string | null, weight: number, label: string | null) => {
    setUnitTrayWeight(weight);
    setReceptionDetails((prev) => ({
      ...prev,
      trayId: id,
      trayLabel: label,
      palletAssignments: [],
    }));
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

  const traysTotalWeight =
    unitTrayWeight > 0 && receptionDetails.traysQuantity > 0
      ? unitTrayWeight * receptionDetails.traysQuantity
      : 0;

  const grossWeight = receptionDetails.grossWeight > 0 ? receptionDetails.grossWeight : 0;
  const netWeightBeforeImpurities = Math.max(grossWeight - traysTotalWeight, 0);
  const impurityFraction =
    receptionDetails.impurityPercent > 0 ? receptionDetails.impurityPercent / 100 : 0;
  const netWeight = Math.max(
    netWeightBeforeImpurities - netWeightBeforeImpurities * impurityFraction,
    0,
  );
  const totalToPay =
    receptionDetails.price > 0 && netWeight > 0 ? netWeight * receptionDetails.price : 0;

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
        dataTestIdPrefix="pack"
      />

      <FormatSelector
        formatOptions={formatOptions}
        formatId={receptionDetails.formatId}
        varietyId={receptionDetails.varietyId}
        onFormatChange={handleFormatChange}
        onPriceChange={(price) => setReceptionDetails((prev) => ({ ...prev, price }))}
        onCurrencyChange={(currency) => setReceptionDetails((prev) => ({ ...prev, currency }))}
        currentPrice={receptionDetails.price}
        currentCurrency={receptionDetails.currency}
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

      <div>
        <GrossWeightInput
          grossWeight={receptionDetails.grossWeight}
          onGrossWeightChange={handleGrossWeightChange}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-md border bg-card p-4">
          <h3 className="mb-2 text-xs font-semibold">Peso neto</h3>
          <p className="text-xl font-semibold">{formatNumber(netWeight)} kg</p>
        </div>

        <div className="rounded-md border bg-card p-4">
          <h3 className="mb-2 text-xs font-semibold">Total a pagar</h3>
          <p className="text-xl font-semibold">
            {currencySymbol} {formatTotal(totalToPay)}
          </p>
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
    </div>
  );
};

export default DetailReceptionCard;
