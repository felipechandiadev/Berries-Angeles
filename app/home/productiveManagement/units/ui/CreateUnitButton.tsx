'use client';

import { useState } from 'react';
import CreateBaseForm from '@/app/baseComponents/BaseForm/CreateBaseForm';
import { useAlert } from '@/app/state/contexts/AlertContext';
import { createProductiveUnit } from '@/app/actions/productiveUnits';

interface CreateUnitButtonProps {
  onSuccess: () => void;
  onClose?: () => void;
}

export default function CreateUnitButton({ onSuccess, onClose }: CreateUnitButtonProps) {
  const { showAlert } = useAlert();
  const [values, setValues] = useState({
    name: '',
    address: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: string, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const result = await createProductiveUnit(values);

      if (result.success) {
        showAlert({
          message: 'Unidad productiva creada exitosamente',
          type: 'success',
          duration: 4000,
        });
        setValues({ name: '', address: '', description: '' });
        onClose?.();
        onSuccess();
      } else {
        showAlert({
          message: result.error || 'Error al crear la unidad productiva',
          type: 'error',
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('Error creating productive unit:', error);
      showAlert({
        message: 'Error al crear la unidad productiva',
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
    <CreateBaseForm 
      fields={fields}
      values={values}
      onChange={handleChange}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  );
}
