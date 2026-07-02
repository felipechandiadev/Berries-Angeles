import React, { useEffect, useRef, useState } from 'react';
import Select from '@/app/baseComponents/Select/Select';
import { TextField } from '@/app/baseComponents/TextField/TextField';
import { getVarietiesWithPriceAndCurrency } from '@/app/actions/varieties';
import { Currency } from '@/data/entities/Variety';

interface VarietySelectorProps {
  varietyId: number | null;
  onVarietyChange: (id: number | null, price: number, currency: Currency | null) => void;
  onPriceChange: (price: number) => void;
  onCurrencyChange: (currency: Currency) => void;
  currentPrice: number;
  currentCurrency: Currency | null;
  dataTestIdPrefix?: string;
}

const VarietySelector: React.FC<VarietySelectorProps> = ({ 
  varietyId, 
  onVarietyChange, 
  onPriceChange, 
  onCurrencyChange, 
  currentPrice, 
  currentCurrency,
  dataTestIdPrefix
}) => {
  const [varietyOptions, setVarietyOptions] = useState<{ id: number; label: string; price: number; currency: Currency }[]>([]);
  const [priceInput, setPriceInput] = useState<string>('');
  const isUserEditingPriceRef = useRef(false);

  useEffect(() => {
    const fetchVarieties = async () => {
      const varieties = await getVarietiesWithPriceAndCurrency();
      setVarietyOptions(varieties);
    };

    fetchVarieties();
  }, []);

  const currencyOptions = [
    { id: Currency.CLP, label: 'CLP' },
    { id: Currency.USD, label: 'USD' },
  ];

  const getCurrencySymbol = (currency: Currency | null) => {
    switch (currency) {
      case Currency.CLP:
        return '$';
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

    if (!varietyId) {
      setPriceInput('');
      return;
    }

    if (!Number.isFinite(currentPrice)) {
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
  }, [varietyId, currentPrice, currentCurrency, allowDecimalComma]);

  return (
    <div>
      <div className="w-full">
        <Select
          label="Variedad"
          options={varietyOptions.map((v) => ({ id: v.id, label: v.label }))}
          placeholder="Selecciona una variedad"
          value={varietyId || null}
          onChange={(value) => {
            const selectedId = value ? parseInt(value.toString(), 10) : null;
            const variety = varietyOptions.find((v) => v.id === selectedId);
            if (variety) {
              onVarietyChange(selectedId, variety.price, variety.currency);
            } else {
              onVarietyChange(null, 0, null);
            }
          }}
          allowClear
          data-test-id={dataTestIdPrefix ? `${dataTestIdPrefix}-variety-select` : 'variety-select'}
        />
      </div>
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
          disabled={!varietyId}
            data-test-id={dataTestIdPrefix ? `${dataTestIdPrefix}-variety-price` : 'variety-price'}
        />
        <Select
          label="Moneda"
          options={currencyOptions}
          value={currentCurrency}
          onChange={(value) => {
            if (value) {
              onCurrencyChange(value as Currency);
            }
          }}
            disabled={!varietyId}
            data-test-id={dataTestIdPrefix ? `${dataTestIdPrefix}-currency-select` : 'variety-currency-select'}
        />
      </div>
    </div>
  );
};

export default VarietySelector;