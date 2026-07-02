"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/app/baseComponents/Button/Button';
import TrayDevolutionCard, { type TrayOption } from './detailCardComponents/TrayDevolutionCard';
import { getTraysSimpleList } from '@/app/actions/trays';

export interface TrayDevolutionItem {
  id: number;
  trayId: string | null;
  quantity: number;
  trayLabel?: string | null;
}

interface TrayDevolutionContainerProps {
  onChange?: (items: TrayDevolutionItem[]) => void;
}

const TrayDevolutionContainer: React.FC<TrayDevolutionContainerProps> = ({ onChange }) => {
  const [items, setItems] = useState<TrayDevolutionItem[]>([]);
  const [trayOptions, setTrayOptions] = useState<TrayOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nextIdRef = useRef(0);

  useEffect(() => {
    onChange?.(items);
  }, [items, onChange]);

  useEffect(() => {
    const loadTrays = async () => {
      setLoading(true);
      setError(null);
      try {
        const trays = await getTraysSimpleList();
        const formatted: TrayOption[] = trays.map((tray: any) => ({
          id: tray.id,
          label: tray.label,
        }));
        setTrayOptions(formatted);
      } catch (err: any) {
        setError(err?.message ?? 'No fue posible cargar las bandejas disponibles');
      } finally {
        setLoading(false);
      }
    };

    loadTrays();
  }, []);

  const addItem = useCallback(() => {
    setItems((prev) => {
      const nextId = nextIdRef.current + 1;
      nextIdRef.current = nextId;
      return [...prev, { id: nextId, trayId: null, quantity: 0, trayLabel: null }];
    });
  }, []);

  const updateItem = useCallback((id: number, changes: Partial<Omit<TrayDevolutionItem, 'id'>>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...changes } : item)));
  }, []);

  const removeItem = useCallback((id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const cards = useMemo(() => (
    items.map((item, index) => (
      <TrayDevolutionCard
        key={item.id}
        trayId={item.trayId}
        quantity={item.quantity}
        trayOptions={trayOptions}
        onTrayChange={(trayId) => {
          const selected = trayOptions.find((option) => option.id === trayId);
          updateItem(item.id, {
            trayId,
            trayLabel: selected?.label ?? null,
            quantity: trayId ? item.quantity : 0,
          });
        }}
        onQuantityChange={(quantity) => updateItem(item.id, { quantity })}
        onRemove={() => removeItem(item.id)}
        index={index}
      />
    ))
  ), [items, trayOptions, updateItem, removeItem]);

  const placeholders = useMemo(() => {
    const needed = Math.max(4 - items.length, 0);
    return Array.from({ length: needed }, (_, index) => (
      <div
        key={`placeholder-${index}`}
        className="flex h-full min-h-[170px] items-center justify-center rounded-md border border-dashed border-border bg-white/40"
        data-test-id="tray-devolution-placeholder"
      />
    ));
  }, [items.length]);

  return (
    <div className="mt-6 rounded-lg border border-border bg-gray-50 p-4 shadow-sm" data-test-id="tray-devolution-container">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">Devolución de bandejas</h3>
          <p className="text-sm text-muted-foreground">Registra las bandejas devueltas por el productor en esta recepción.</p>
        </div>
        <Button
          variant="outlined"
          className="mt-2 inline-flex items-center gap-1 rounded-full px-3 py-1 sm:mt-0"
          onClick={addItem}
          disabled={loading}
          data-test-id="tray-devolution-add"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          bandeja
        </Button>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-muted-foreground">Cargando bandejas disponibles...</p>
      ) : error ? (
        <p className="mt-4 text-sm text-red-500">{error}</p>
      ) : null}

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards}
        {placeholders}
      </div>
    </div>
  );
};

export default TrayDevolutionContainer;
