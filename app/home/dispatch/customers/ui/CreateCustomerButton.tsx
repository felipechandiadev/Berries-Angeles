'use client';

import { useState } from 'react';
import CreateBaseForm from '@/app/baseComponents/BaseForm/CreateBaseForm';
import { useAlert } from '@/app/state/contexts/AlertContext';
import { createCustomerWithPerson } from '@/app/actions/customers';
import { useSubmitLock } from '@/app/state/hooks/useSubmitLock';

interface CreateCustomerButtonProps {
  onSuccess: () => void;
  onClose?: () => void;
}

export default function CreateCustomerButton({ onSuccess, onClose }: CreateCustomerButtonProps) {
  const { showAlert } = useAlert();
  const [values, setValues] = useState({
    name: '',
    dni: '',
    mail: '',
    phone: '',
  });
  const { isSubmitting, run } = useSubmitLock();

  const handleChange = (field: string, value: any) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const validate = (formValues: Record<string, any>): string[] => {
    const errors: string[] = [];
    if (!formValues.name?.trim()) errors.push('El nombre es requerido');
    if (!formValues.dni?.trim()) errors.push('El RUT es requerido');
    return errors;
  };

  const handleSubmit = async () => {
    const result = await run(async () => {
      try {
        const createResult = await createCustomerWithPerson({
          name: values.name,
          dni: values.dni,
          mail: values.mail || undefined,
          phone: values.phone || undefined,
        });

        if (createResult.success) {
          showAlert({
            message: 'Cliente creado exitosamente',
            type: 'success',
            duration: 4000,
          });
          return { ok: true };
        }

        showAlert({
          message: createResult.error || 'Error al crear el cliente',
          type: 'error',
          duration: 4000,
        });
        return { ok: false };
      } catch (error) {
        console.error('Error creating customer:', error);
        showAlert({
          message: 'Error al crear el cliente',
          type: 'error',
          duration: 4000,
        });
        return { ok: false };
      }
    });

    if (result?.ok) {
      setValues({ name: '', dni: '', mail: '', phone: '' });
      onClose?.();
      onSuccess();
    }
  };

  const fields = [
    { name: 'name', label: 'Nombre', type: 'text' as const, required: true },
    { name: 'dni', label: 'RUT', type: 'dni' as const, required: true },
    { name: 'mail', label: 'Correo', type: 'email' as const, required: false },
    { name: 'phone', label: 'Teléfono', type: 'text' as const, required: false },
  ];

  return (
    <CreateBaseForm
      fields={fields}
      values={values}
      onChange={handleChange}
      onSubmit={handleSubmit}
      validate={validate}
      isSubmitting={isSubmitting}
    />
  );
}
