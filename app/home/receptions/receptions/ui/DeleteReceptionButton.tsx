'use client';

import { useState } from 'react';
import IconButton from '@/app/baseComponents/IconButton/IconButton';
import Dialog from '@/app/baseComponents/Dialog/Dialog';
import DeleteBaseForm from '@/app/baseComponents/BaseForm/DeleteBaseForm';
import { useAlert } from '@/app/state/contexts/AlertContext';
import { useSubmitLock } from '@/app/state/hooks/useSubmitLock';
import { deleteReception, type ReceptionGridRow } from '@/app/actions/receptions';
import { isPaidOnReception } from '@/lib/receptionPayment';

interface DeleteReceptionButtonProps {
  reception: ReceptionGridRow;
  onSuccess: () => void;
}

export default function DeleteReceptionButton({ reception, onSuccess }: DeleteReceptionButtonProps) {
  const { showAlert } = useAlert();
  const [open, setOpen] = useState(false);
  const { isSubmitting, run } = useSubmitLock();
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = async () => {
    setErrors([]);

    const result = await run(async () => {
      try {
        const deleteResult = await deleteReception(reception.id);

        if (deleteResult.success) {
          showAlert({
            message: 'Recepción eliminada exitosamente',
            type: 'success',
            duration: 4000,
          });
          return { ok: true };
        }

        const errorMessage = deleteResult.error || 'Error al eliminar la recepción';
        showAlert({
          message: errorMessage,
          type: 'error',
          duration: 4000,
        });
        setErrors([errorMessage]);
        return { ok: false };
      } catch (error) {
        console.error('Error deleting reception:', error);
        const errorMessage = 'Error al eliminar la recepción';
        showAlert({
          message: errorMessage,
          type: 'error',
          duration: 4000,
        });
        setErrors([errorMessage]);
        return { ok: false };
      }
    });

    if (result?.ok) {
      setOpen(false);
      onSuccess();
    }
  };

  const guideLabel = reception.guideNumber ? `guía ${reception.guideNumber}` : `ID ${reception.id}`;
  const paidOnReception = isPaidOnReception(reception.paymentStatus);

  return (
    <>
      <IconButton
        icon="delete"
        variant="basicSecondary"
        size="sm"
        onClick={() => setOpen(true)}
        title={
          paidOnReception
            ? 'No se puede eliminar una recepción pagada contra recepción'
            : 'Eliminar'
        }
        disabled={paidOnReception}
      />
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title=""
        size="xs"
      >
        <DeleteBaseForm
          message={`¿Está seguro que desea eliminar la recepción (${guideLabel})? Esta acción no se puede deshacer.`}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          errors={errors}
          cancelButton={true}
          cancelButtonText="Cancelar"
          onCancel={() => setOpen(false)}
          submitLabel="Eliminar"
          title="Eliminar Recepción"
        />
      </Dialog>
    </>
  );
}
