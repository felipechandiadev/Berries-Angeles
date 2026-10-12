import React, { useEffect, useRef, useState } from 'react';
import Select from '@/app/baseComponents/Select/Select';
import { TextField } from '@/app/baseComponents/TextField/TextField';
import { Currency } from '@/data/entities/Variety';
import { getVarietyQualityPrice } from '@/app/actions/varieties';

interface FormatSelectorProps {
  formatOptions: { id: number; label: string }[];
  formatId: number | null;
  varietyId: number | null;
  onFormatChange: (id: number | null, price: number, currency: Currency | null) => void;
  onPriceChange: (price: number) => void;
  onCurrencyChange: (currency: Currency) => void;
  currentPrice: number;
  currentCurrency: Currency | null;
  dataTestIdPrefix?: string;
}

const FormatSelector: React.FC<FormatSelectorProps> = ({
  formatOptions,
  formatId,
  varietyId,
  onFormatChange,
  onPriceChange,
  onCurrencyChange,
  currentPrice,
  currentCurrency,
  dataTestIdPrefix,
}) => {
  const [priceInput, setPriceInput] = useState('');
  const isUserEditingPriceRef = useRef(false);

  const currencyOptions = [
    { id: Currency.CLP, label: 'CLP' },
    { id: Currency.USD, label: 'USD' },
  ];

  const getCurrencySymbol = (currency: Currency | null) => {
    switch (currency) {
      case Currency.USD:
        return 'US$';
      default:
        return '$';
    }
  };

  const allowDecimalComma = currentCurrency === Currency.USD;

  useEffect(() => {
    if (isUserEditingPriceRef.current) {
      isUserEditingPriceRef.current = false;
      return;
    }
    if (!formatId || !Number.isFinite(currentPrice)) {
      setPriceInput('');
      return;
    }
    if (allowDecimalComma) {
      const fixedValue = currentPrice.toFixed(2);
      const [integerPart, decimalPart = '00'] = fixedValue.split('.');
      setPriceInput(`${integerPart},${decimalPart}`);
    } else {
      setPriceInput(Math.trunc(currentPrice).toString());
    }
  }, [formatId, currentPrice, currentCurrency, allowDecimalComma]);

  const handleFormatSelect = async (selectedId: number | null) => {
    if (!selectedId || !varietyId) {
      onFormatChange(null, 0, null);
      return;
    }
    const result = await getVarietyQualityPrice(varietyId, selectedId);
    if (result.success && result.entry) {
      onFormatChange(selectedId, result.price ?? 0, result.currency ?? Currency.CLP);
    } else {
      onFormatChange(selectedId, 0, Currency.CLP);
    }
  };

  return (
    <div>
      <Select
        label="Calidad"
        options={formatOptions.map((f) => ({ id: f.id, label: f.label }))}
        placeholder={varietyId ? 'Selecciona una calidad' : 'Primero selecciona una variedad'}
        value={formatId || null}
        onChange={(value) => {
          const selectedId = value ? parseInt(value.toString(), 10) : null;
          void handleFormatSelect(selectedId);
        }}
        disabled={!varietyId}
        data-test-id={dataTestIdPrefix ? `${dataTestIdPrefix}-format-select` : 'format-select'}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextField
          label="Precio"
          type="currency"
          currencySymbol={getCurrencySymbol(currentCurrency)}
          value={priceInput}
          onChange={(e) => {
            const rawValue = e.target.value;
            setPriceInput(rawValue);
            isUserEditingPriceRef.current = true;
            const normalizedValue = rawValue.replace(/\./g, '').replace(',', '.');
            const parsedPrice = Number.parseFloat(normalizedValue);
            onPriceChange(Number.isNaN(parsedPrice) ? 0 : parsedPrice);
          }}
          allowDecimalComma={allowDecimalComma}
          disabled={!formatId}
          data-test-id={dataTestIdPrefix ? `${dataTestIdPrefix}-quality-price` : 'quality-price'}
        />
        <Select
          label="Moneda"
          options={currencyOptions}
          value={currentCurrency}
          onChange={(value) => {
            if (value) onCurrencyChange(value as Currency);
          }}
          disabled={!formatId}
          data-test-id={
            dataTestIdPrefix ? `${dataTestIdPrefix}-currency-select` : 'quality-currency-select'
          }
        />
      </div>
    </div>
  );
};

export default FormatSelector;
