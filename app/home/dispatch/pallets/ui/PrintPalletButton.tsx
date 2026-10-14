'use client';

import { useState } from 'react';
import IconButton from '@/app/baseComponents/IconButton/IconButton';
import PrintDispatchPalletDialog, {
  type DispatchPalletPrintSnapshot,
} from '@/app/home/dispatch/new/ui/PrintDispatchPalletDialog';
import { getPalletStatusLabel } from './PalletStatusBadge';
import type { PalletRow } from './types';
import type { PalletDispatchMetadata } from '@/data/entities/Pallet';

interface PrintPalletButtonProps {
  pallet: PalletRow;
}

function asDispatchMeta(metadata: PalletRow['metadata']): PalletDispatchMetadata | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return null;
  }
  return metadata as PalletDispatchMetadata;
}

export default function PrintPalletButton({ pallet }: PrintPalletButtonProps) {
  const [snapshot, setSnapshot] = useState<DispatchPalletPrintSnapshot | null>(null);

  const handleClick = () => {
    const meta = asDispatchMeta(pallet.metadata);
    const emptyWeightKg =
      meta?.emptyWeightKg != null ? Number(meta.emptyWeightKg) : Number(pallet.weight) || 0;
    const traysQuantity =
      meta?.traysQuantity != null
        ? Number(meta.traysQuantity)
        : Number(pallet.traysQuantity) || 0;
    const grossWeightKg =
      meta?.grossWeightKg != null
        ? Number(meta.grossWeightKg)
        : Number(pallet.dispatchWeight) || 0;
    const unitTrayWeight =
      pallet.trayWeight != null && Number.isFinite(Number(pallet.trayWeight))
        ? Number(pallet.trayWeight)
        : null;
    const traysKg =
      unitTrayWeight != null && traysQuantity > 0
        ? Number((unitTrayWeight * traysQuantity).toFixed(3))
        : null;
    const fruitFromMeta =
      meta?.fruitWeightKg != null ? Number(meta.fruitWeightKg) : null;
    const fruitKg =
      fruitFromMeta ??
      (traysKg != null
        ? Number((grossWeightKg - emptyWeightKg - traysKg).toFixed(3))
        : null);

    setSnapshot({
      palletNumber: pallet.id,
      trayName: pallet.trayName || '—',
      unitTrayWeight,
      emptyWeightKg,
      traysQuantity,
      traysKg,
      grossWeightKg,
      fruitKg,
      statusLabel: getPalletStatusLabel(pallet.status),
      capacity: pallet.capacity,
    });
  };

  return (
    <>
      <IconButton
        icon="print"
        variant="basicSecondary"
        size="xs"
        title="Imprimir pallet"
        ariaLabel={`Imprimir pallet ${pallet.id}`}
        onClick={handleClick}
        data-test-id={`pallet-print-button-${pallet.id}`}
      />
      <PrintDispatchPalletDialog
        open={Boolean(snapshot)}
        onClose={() => setSnapshot(null)}
        snapshot={snapshot}
      />
    </>
  );
}
