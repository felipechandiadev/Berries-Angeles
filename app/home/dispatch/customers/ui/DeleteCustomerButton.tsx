'use client';

import { useState } from 'react';
import IconButton from '@/app/baseComponents/IconButton/IconButton';
import Dialog from '@/app/baseComponents/Dialog/Dialog';
import DeleteBaseForm from '@/app/baseComponents/BaseForm/DeleteBaseForm';
import { useAlert } from '@/app/state/contexts/AlertContext';
import { deleteCustomer } from '@/app/actions/customers';
import { useSubmitLock } from '@/app/state/hooks/useSubmitLock';

interface CustomerRow {
  id: string;
  name: string;
}

interface DeleteCustomerButtonProps {
  customer: CustomerRow;
  onSuccess: () => void;
}

export default function DeleteCustomerButton({ customer, onSuccess }: DeleteCustomerButtonProps) {
  const { showAlert } = useAlert();
  const [open, setOpen] = useState(false);
  const { isSubmitting, run } = useSubmitLock();
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = async () => {
    setErrors([]);
    const result = await run(async () => {
      try {
        const deleteResult = await deleteCustomer(customer.id);
        if (deleteResult.success) {
          showAlert({
            message: 'Cliente eliminado exitosamente',
            type: 'success',
            duration: 4000,
          });
          return { ok: true };
        }
        const errorMessage = deleteResult.error || 'Error al eliminar el cliente';
        showAlert({ message: errorMessage, type: 'error', duration: 4000 });
        setErrors([errorMessage]);
        return { ok: false };
      } catch (error) {
        console.error('Error deleting customer:', error);
        const errorMessage = 'Error al eliminar el cliente';
        showAlert({ message: errorMessage, type: 'error', duration: 4000 });
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
        size="xs"
        title="Eliminar cliente"
        ariaLabel="Eliminar cliente"
        onClick={() => setOpen(true)}
      />
      <Dialog open={open} onClose={() => setOpen(false)} title="Eliminar cliente" size="sm">
        <DeleteBaseForm
          message={`¿Seguro que deseas eliminar el cliente "${customer.name}"? Esta acción no se puede deshacer.`}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          errors={errors}
          cancelButton
          cancelButtonText="Cancelar"
          onCancel={() => setOpen(false)}
          submitLabel="Eliminar"
          title="Eliminar cliente"
        />
      </Dialog>
    </>
  );
}
