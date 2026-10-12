'use client';

import { useState } from 'react';
import IconButton from '@/app/baseComponents/IconButton/IconButton';
import Dialog from '@/app/baseComponents/Dialog/Dialog';
import UpdateBaseForm from '@/app/baseComponents/BaseForm/UpdateBaseForm';
import { useAlert } from '@/app/state/contexts/AlertContext';
import { updateCustomerWithPerson } from '@/app/actions/customers';
import { useSubmitLock } from '@/app/state/hooks/useSubmitLock';

interface CustomerRow {
  id: string;
  name: string;
  dni: string;
  mail: string;
  phone: string;
}

interface UpdateCustomerButtonProps {
  customer: CustomerRow;
  onSuccess: () => void;
}

export default function UpdateCustomerButton({ customer, onSuccess }: UpdateCustomerButtonProps) {
  const { showAlert } = useAlert();
  const [open, setOpen] = useState(false);
  const { isSubmitting, run } = useSubmitLock();

  const handleSubmit = async (values: Record<string, any>) => {
    if (!values.name?.trim()) {
      showAlert({ message: 'El nombre es requerido', type: 'error', duration: 4000 });
      return;
    }
    if (!values.dni?.trim()) {
      showAlert({ message: 'El RUT es requerido', type: 'error', duration: 4000 });
      return;
    }

    const result = await run(async () => {
      try {
        const updateResult = await updateCustomerWithPerson({
          id: customer.id,
          name: values.name,
          dni: values.dni,
          mail: values.mail,
          phone: values.phone,
        });

        if (updateResult.success) {
          showAlert({
            message: 'Cliente actualizado exitosamente',
            type: 'success',
            duration: 4000,
          });
          return { ok: true };
        }

        showAlert({
          message: updateResult.error || 'Error al actualizar el cliente',
          type: 'error',
          duration: 4000,
        });
        return { ok: false };
      } catch (error) {
        console.error('Error updating customer:', error);
        showAlert({
          message: 'Error al actualizar el cliente',
          type: 'error',
          duration: 4000,
        });
        return { ok: false };
      }
    });

    if (result?.ok) {
      setOpen(false);
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
    <>
      <IconButton
        icon="edit"
        variant="basicSecondary"
        size="xs"
        title="Editar cliente"
        ariaLabel="Editar cliente"
        onClick={() => setOpen(true)}
      />
      <Dialog open={open} onClose={() => setOpen(false)} title="Editar cliente" size="md">
        <UpdateBaseForm
          fields={fields}
          initialState={{
            name: customer.name ?? '',
            dni: customer.dni ?? '',
            mail: customer.mail ?? '',
            phone: customer.phone ?? '',
          }}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          onCancel={() => setOpen(false)}
        />
      </Dialog>
    </>
  );
}
