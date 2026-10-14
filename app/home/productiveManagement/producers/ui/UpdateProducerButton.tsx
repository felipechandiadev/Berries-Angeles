'use client';

import { useState } from 'react';
import IconButton from '@/app/baseComponents/IconButton/IconButton';
import Dialog from '@/app/baseComponents/Dialog/Dialog';
import UpdateBaseForm from '@/app/baseComponents/BaseForm/UpdateBaseForm';
import { useAlert } from '@/app/state/contexts/AlertContext';
import { updateProducer } from '@/app/actions/producers';
import { useSubmitLock } from '@/app/state/hooks/useSubmitLock';

interface Producer {
  id: string;
  name: string;
  dni: string;
  mail: string;
  phone: string;
  createdAt: Date;
  updatedAt: Date;
}

interface UpdateProducerButtonProps {
  producer: Producer;
  onSuccess: () => void;
}

export default function UpdateProducerButton({ producer, onSuccess }: UpdateProducerButtonProps) {
  const { showAlert } = useAlert();
  const [open, setOpen] = useState(false);
  const { isSubmitting, run } = useSubmitLock();

  const handleSubmit = async (values: Record<string, any>) => {
    if (!values.name?.trim()) {
      showAlert({
        message: 'Name is required',
        type: 'error',
        duration: 4000,
      });
      return;
    }

    if (!values.dni?.trim()) {
      showAlert({
        message: 'RUT is required',
        type: 'error',
        duration: 4000,
      });
      return;
    }

    const result = await run(async () => {
      try {
        const updateResult = await updateProducer({
          id: producer.id,
          name: values.name,
          dni: values.dni,
          mail: values.mail,
          phone: values.phone,
        });

        if (updateResult.success) {
          showAlert({
            message: 'Producer updated successfully',
            type: 'success',
            duration: 4000,
          });
          return { ok: true };
        }

        showAlert({
          message: updateResult.error || 'Error updating producer',
          type: 'error',
          duration: 4000,
        });
        return { ok: false };
      } catch (error) {
        console.error('Error updating producer:', error);
        showAlert({
          message: 'Error updating producer',
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
    { name: 'name', label: 'Name', type: 'text' as const, required: true },
    { name: 'dni', label: 'RUT', type: 'dni' as const, required: true },
    { name: 'mail', label: 'Email', type: 'email' as const, required: false },
    { name: 'phone', label: 'Phone', type: 'text' as const, required: false },
  ];

  return (
    <>
      <IconButton
        icon="edit"
        variant="basicSecondary"
        size="sm"
        onClick={() => setOpen(true)}
        title="Edit"
      />
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Edit Producer"
        size="md"
      >
        <UpdateBaseForm
          fields={fields}
          initialState={producer as Record<string, any>}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          onCancel={() => setOpen(false)}
        />
      </Dialog>
    </>
  );
}
