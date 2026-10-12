"use client";

import { useState } from 'react';
import IconButton from '@/app/baseComponents/IconButton/IconButton';
import Dialog from '@/app/baseComponents/Dialog/Dialog';
import DeleteBaseForm from '@/app/baseComponents/BaseForm/DeleteBaseForm';
import { useAlert } from '@/app/state/contexts/AlertContext';
import { deletePallet } from '@/app/actions/pallets';
import type { PalletRow } from './types';
import { useSubmitLock } from '@/app/state/hooks/useSubmitLock';

interface DeletePalletButtonProps {
  pallet: PalletRow;
  onSuccess: () => void;
}

export default function DeletePalletButton({ pallet, onSuccess }: DeletePalletButtonProps) {
  const { showAlert } = useAlert();
  const [open, setOpen] = useState(false);
  const { isSubmitting, run } = useSubmitLock();
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = async () => {
    setErrors([]);

    const result = await run(async () => {
      try {
        const deleteResult = await deletePallet(pallet.id);

        if (deleteResult.success) {
          showAlert({
            message: 'Pallet eliminado exitosamente',
            type: 'success',
            duration: 4000,
          });
          return { ok: true };
        }

        const errorMessage = deleteResult.error || 'Error al eliminar el pallet';
        showAlert({ message: errorMessage, type: 'error', duration: 5000 });
        setErrors([errorMessage]);
        return { ok: false };
      } catch (error) {
        console.error('[DeletePalletButton] Error eliminando pallet:', error);
        const errorMessage = 'Error inesperado al eliminar el pallet';
        showAlert({ message: errorMessage, type: 'error', duration: 5000 });
        setErrors([errorMessage]);
        return { ok: false };
      }
    });

    if (result?.ok) {
      setOpen(false);
      onSuccess();
    }
  };

  const trayLabel = pallet.trayName || 'sin bandeja';

  return (
    <>
      <IconButton
        icon="delete"
        variant="basicSecondary"
        size="sm"
        onClick={() => setOpen(true)}
        title="Eliminar"
      />
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Eliminar Pallet"
        size="xs"
      >
        <DeleteBaseForm
          message={`¿Está seguro que desea eliminar el pallet #${pallet.id} (bandeja "${trayLabel}")? Esta acción no se puede deshacer.`}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          errors={errors}
          cancelButton
          cancelButtonText="Cancelar"
          onCancel={() => setOpen(false)}
          submitLabel="Eliminar"
          title="Eliminar Pallet"
        />
      </Dialog>
    </>
  );
}
