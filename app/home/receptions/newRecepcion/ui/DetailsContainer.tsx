import React from 'react';
import { Button } from '@/app/baseComponents/Button/Button';

interface DetailsContainerProps {
  cards: React.ReactNode[];
  numbered?: boolean;
  onAdd?: () => void;
  addDisabled?: boolean;
}

export const DetailsContainer: React.FC<DetailsContainerProps> = ({ cards, numbered = false, onAdd, addDisabled = false }) => {
  const renderedCards = cards.map((card, index) => {
    const key = index;
    const content = numbered && React.isValidElement(card)
      ? React.cloneElement(card, { packNumber: index + 1 } as any)
      : card;

    return (
      <div key={key} className="flex w-full">
        {content}
      </div>
    );
  });

  const placeholderSlots = React.useMemo(() => {
    const needed = Math.max(3 - renderedCards.length, 0);
    return Array.from({ length: needed }, (_, index) => (
      <div
        key={`details-placeholder-${index}`}
        className="flex min-h-[170px] items-center justify-center rounded-md border border-dashed border-border bg-white/40 text-xs text-muted-foreground"
        data-test-id="details-placeholder"
      />
    ));
  }, [renderedCards.length]);

  return (
    <div className="mt-6 rounded-lg border border-border bg-gray-50 p-4 shadow-sm" data-test-id="details-container">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">Detalles de bandejas</h3>
          <p className="text-sm text-muted-foreground">Administra los packs que componen la recepción.</p>
        </div>
        {onAdd ? (
          <Button
            variant="outlined"
            className="mt-2 inline-flex items-center gap-1 rounded-full px-3 py-1 sm:mt-0"
            onClick={onAdd}
            disabled={addDisabled}
            data-test-id="details-container-add-pack"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            pack
          </Button>
        ) : null}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {renderedCards}
        {placeholderSlots}
      </div>
    </div>
  );
};