'use client';

import { useState } from 'react';
import IconButton from '@/app/baseComponents/IconButton/IconButton';
import Dialog from '@/app/baseComponents/Dialog/Dialog';
import UpdateBaseForm from '@/app/baseComponents/BaseForm/UpdateBaseForm';
import { useAlert } from '@/app/state/contexts/AlertContext';
import { updateProductiveUnit } from '@/app/actions/productiveUnits';

interface ProductiveUnit {
  id: string;
  name: string;
  address?: string | null;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface UpdateUnitButtonProps {
  unit: ProductiveUnit;
  onSuccess: () => void;
}

export default function UpdateUnitButton({ unit, onSuccess }: UpdateUnitButtonProps) {
  const { showAlert } = useAlert();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: Record<string, any>) => {
    setIsSubmitting(true);
    try {
      const result = await updateProductiveUnit({
        id: unit.id,
        name: values.name,
        address: values.address,
        description: values.description,
      });

      if (result.success) {
        showAlert({
          message: 'Unidad productiva actualizada exitosamente',
          type: 'success',
          duration: 4000,
        });
        setOpen(false);
        onSuccess();
      } else {
        showAlert({
          message: result.error || 'Error al actualizar la unidad productiva',
          type: 'error',
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('Error updating productive unit:', error);
      showAlert({
        message: 'Error al actualizar la unidad productiva',
        type: 'error',
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fields = [
    { name: 'name', label: 'Nombre', type: 'text' as const, required: true },
    { name: 'address', label: 'Ubicación', type: 'text' as const },
    { name: 'description', label: 'Descripción', type: 'textarea' as const, rows: 3 },
  ];

  return (
    <>
      <IconButton
        icon="edit"
        variant="basicSecondary"
        size="sm"
        onClick={() => setOpen(true)}
        title="Editar"
      />
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Editar Unidad Productiva"
        size="md"
      >
        <UpdateBaseForm 
          fields={fields}
          initialState={unit as Record<string, any>}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </Dialog>
    </>
  );
}
