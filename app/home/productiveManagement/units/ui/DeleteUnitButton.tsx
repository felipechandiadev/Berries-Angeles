'use client';

import { useState } from 'react';
import IconButton from '@/app/baseComponents/IconButton/IconButton';
import Dialog from '@/app/baseComponents/Dialog/Dialog';
import DeleteBaseForm from '@/app/baseComponents/BaseForm/DeleteBaseForm';
import { useAlert } from '@/app/state/contexts/AlertContext';
import { deleteProductiveUnit } from '@/app/actions/productiveUnits';
import { useSubmitLock } from '@/app/state/hooks/useSubmitLock';

interface ProductiveUnit {
  id: string;
  name: string;
  address?: string | null;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface DeleteUnitButtonProps {
  unit: ProductiveUnit;
  onSuccess: () => void;
}

export default function DeleteUnitButton({ unit, onSuccess }: DeleteUnitButtonProps) {
  const { showAlert } = useAlert();
  const [open, setOpen] = useState(false);
  const { isSubmitting, run } = useSubmitLock();
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = async () => {
    setErrors([]);

    const result = await run(async () => {
      try {
        const deleteResult = await deleteProductiveUnit(unit.id);

        if (deleteResult.success) {
          showAlert({
            message: 'Unidad productiva eliminada exitosamente',
            type: 'success',
            duration: 4000,
          });
          return { ok: true };
        }

        const errorMessage = deleteResult.error || 'Error al eliminar la unidad productiva';
        showAlert({
          message: errorMessage,
          type: 'error',
          duration: 4000,
        });
        setErrors([errorMessage]);
        return { ok: false };
      } catch (error) {
        console.error('Error deleting productive unit:', error);
        const errorMessage = 'Error al eliminar la unidad productiva';
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
        title=""
        size="xs"
      >
        <DeleteBaseForm
          message={`¿Está seguro que desea eliminar la unidad productiva "${unit.name}"? Esta acción no se puede deshacer.`}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          errors={errors}
          cancelButton={true}
          cancelButtonText="Cancelar"
          onCancel={() => setOpen(false)}
          submitLabel="Eliminar"
          title="Eliminar Unidad Productiva"
        />
      </Dialog>
    </>
  );
}
