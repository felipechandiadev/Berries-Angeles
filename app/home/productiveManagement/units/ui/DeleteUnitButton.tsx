'use client';

import { useState } from 'react';
import IconButton from '@/app/baseComponents/IconButton/IconButton';
import Dialog from '@/app/baseComponents/Dialog/Dialog';
import DeleteBaseForm from '@/app/baseComponents/BaseForm/DeleteBaseForm';
import { useAlert } from '@/app/state/contexts/AlertContext';
import { deleteProductiveUnit } from '@/app/actions/productiveUnits';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrors([]);

    try {
      const result = await deleteProductiveUnit(unit.id);

      if (result.success) {
        showAlert({
          message: 'Unidad productiva eliminada exitosamente',
          type: 'success',
          duration: 4000,
        });
        setTimeout(() => {
          setOpen(false);
          onSuccess();
        }, 500);
      } else {
        const errorMessage = result.error || 'Error al eliminar la unidad productiva';
        showAlert({
          message: errorMessage,
          type: 'error',
          duration: 4000,
        });
        setErrors([errorMessage]);
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error deleting productive unit:', error);
      const errorMessage = 'Error al eliminar la unidad productiva';
      showAlert({
        message: errorMessage,
        type: 'error',
        duration: 4000,
      });
      setErrors([errorMessage]);
      setIsSubmitting(false);
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
