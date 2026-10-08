"use client";
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import AutoComplete, { Option } from '@/app/baseComponents/AutoComplete/AutoComplete';
import { TextField } from '@/app/baseComponents/TextField/TextField';
import DetailReceptionCard, { type DetailReceptionSummary } from './DetailReceptionCard';
import { DetailsContainer } from './DetailsContainer';
import TrayDevolutionContainer, { type TrayDevolutionItem } from './TrayDevolutionContainer';
import { Currency } from '@/data/entities/Variety';
import { useRouter } from 'next/navigation';
import type { ReceptionPaymentStatus } from '@/lib/receptionPayment';

export interface ReceptionTotals {
  totalPacks: number;
  totalTraysInPacks: number;
  totalTraysDevolved: number;
  totalGrossWeight: number;
  totalNetWeight: number;
  totalToPayUSD: number;
  totalToPayCLP: number;
  totalCLPToPay: number;
}

export interface ReceptionPackSummary extends DetailReceptionSummary {
  id: number;
  packNumber: number;
}

export interface ReceptionDataSnapshot {
  producer: Option | null;
  guide: string;
  packs: ReceptionPackSummary[];
  trayDevolutions: TrayDevolutionItem[];
  totals: ReceptionTotals;
  exchangeRate: number;
  /** Fecha de registro de la recepción (ISO); usada al reimprimir. */
  createdAt?: string | null;
  paymentStatus?: ReceptionPaymentStatus;
}

interface TransactionDataProps {
  producers?: Option[];
  initialProducerId?: string | number | undefined;
  initialGuide?: string | undefined;
  onProducerChange?: (id: string | number | null) => void;
  onGuideChange?: (id: string | number | null) => void;
  dataTestId?: string;
  onReceptionDataChange?: (data: ReceptionDataSnapshot) => void;
}

const TransactionData: React.FC<TransactionDataProps> = ({ producers, initialProducerId, initialGuide, onProducerChange, onGuideChange, dataTestId, onReceptionDataChange }) => {
  const router = useRouter();
  const [selected, setSelected] = useState<Option | null>(null);
  const [guide, setGuide] = useState<string>('');
  const [detailCardIds, setDetailCardIds] = useState<number[]>([]);
  const [packDetails, setPackDetails] = useState<Record<number, DetailReceptionSummary>>({});
  const [trayDevolutions, setTrayDevolutions] = useState<TrayDevolutionItem[]>([]);
  const nextCardIdRef = useRef(0);
  const options: Option[] = producers ?? [];
  const exchangeRate = 0;

  // If initialProducerId is present, set initial selected option
  useEffect(() => {
    if (!initialProducerId) return;
    const found = options.find(o => String(o.id) === String(initialProducerId));
    if (found) {
      setSelected(found);
      onProducerChange?.(found.id);
    }
  }, [options, initialProducerId]);

  useEffect(() => {
    if (initialGuide === undefined || initialGuide === null) return;
    setGuide(String(initialGuide));
    onGuideChange?.(initialGuide ?? null);
  }, [initialGuide]);

  const addDetailCard = () => {
    setDetailCardIds((prev) => {
      const nextId = nextCardIdRef.current + 1;
      nextCardIdRef.current = nextId;
      return [...prev, nextId];
    });
  };

  const removeDetailCard = useCallback((id: number) => {
    setDetailCardIds((prev) => prev.filter((item) => item !== id));
    setPackDetails((prev) => {
      const { [id]: _removed, ...rest } = prev;
      return rest;
    });
  }, [setPackDetails]);

  const detailCards = useMemo(() => (
    detailCardIds.map((id) => (
      <DetailReceptionCard
        key={id}
        onRemove={() => removeDetailCard(id)}
        onChange={(details) => setPackDetails((prev) => ({ ...prev, [id]: details }))}
      />
    ))
  ), [detailCardIds, removeDetailCard, setPackDetails]);

  const totals = useMemo(() => {
    const summaries = Object.values(packDetails);
    const totalPacks = summaries.length;
    const totalTraysInPacks = summaries.reduce((sum, details) => sum + (details.traysQuantity || 0), 0);
    const totalTraysDevolved = trayDevolutions.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalGrossWeight = summaries.reduce((sum, details) => sum + (details.grossWeight || 0), 0);
    const totalNetWeight = summaries.reduce((sum, details) => sum + (details.netWeight || 0), 0);
    const totalToPayUSD = summaries.reduce((sum, details) => sum + (details.currency === Currency.USD ? details.totalToPay || 0 : 0), 0);
    const totalToPayCLP = summaries.reduce((sum, details) => sum + (details.currency === Currency.CLP ? details.totalToPay || 0 : 0), 0);
    const totalCLPToPay = totalToPayCLP;

    return {
      totalPacks,
      totalTraysInPacks,
      totalTraysDevolved,
      totalGrossWeight,
      totalNetWeight,
      totalToPayUSD,
      totalToPayCLP,
      totalCLPToPay,
    };
  }, [packDetails, trayDevolutions]);

  const packSummaries = useMemo(() => (
    detailCardIds
      .map((id, index) => {
        const details = packDetails[id];
        if (!details) {
          return null;
        }

        return {
          ...details,
          id,
          packNumber: index + 1,
        } as ReceptionPackSummary;
      })
      .filter((item): item is ReceptionPackSummary => item !== null)
  ), [detailCardIds, packDetails]);

  useEffect(() => {
    if (!onReceptionDataChange) {
      return;
    }

    onReceptionDataChange({
      producer: selected,
      guide,
      packs: packSummaries,
      trayDevolutions,
      totals,
      exchangeRate,
    });
  }, [onReceptionDataChange, selected, guide, packSummaries, trayDevolutions, totals]);

  return (
    <div className="w-full">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <div className="flex-1 min-w-[220px]">
          <AutoComplete
            options={options}
            label="Productor"
            placeholder="Selecciona un productor"
            value={selected}
            onChange={(opt) => {
              const option = opt as Option | null;
              setSelected(option);
              const id = option?.id ?? null;
              onProducerChange?.(id);
              // Update the URL param producerId
              try {
                const url = new URL(window.location.href);
                if (id) {
                  url.searchParams.set('producerId', String(id));
                } else {
                  url.searchParams.delete('producerId');
                }
                router.push(url.pathname + url.search);
              } catch (e) {
                // ignore errors on window not available
              }
            }}
            data-test-id={dataTestId}
          />
        </div>
        <div className="flex w-full items-start sm:w-[260px]">
          <div className="relative flex-1 rounded-md border border-border focus-within:border-primary">
            <TextField
              variante="autocomplete"
              label="Guía"
              placeholder="Número de guía"
              value={guide}
              onChange={(e) => {
                const val = (e.target as HTMLInputElement).value;
                setGuide(val);
                onGuideChange?.(val || null);
                try {
                  const url = new URL(window.location.href);
                  if (val) {
                    url.searchParams.set('guide', String(val));
                  } else {
                    url.searchParams.delete('guide');
                  }
                  router.push(url.pathname + url.search);
                } catch (err) {
                  // no-op
                }
              }}
              data-test-id="transaction-data-guide"
            />
          </div>
        </div>
      </div>

      <DetailsContainer cards={detailCards} numbered onAdd={addDetailCard} />

      <TrayDevolutionContainer onChange={setTrayDevolutions} />
    </div>
  );
};

export default TransactionData;
