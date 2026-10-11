'use client';

import { useState } from 'react';
import IconButton from '@/app/baseComponents/IconButton/IconButton';
import Dialog from '@/app/baseComponents/Dialog/Dialog';
import DeleteBaseForm from '@/app/baseComponents/BaseForm/DeleteBaseForm';
import { useAlert } from '@/app/state/contexts/AlertContext';
import { deleteProducer } from '@/app/actions/producers';
import { useSubmitLock } from '@/app/state/hooks/useSubmitLock';

interface Producer {
  id: string;
  name: string;
  dni: string;
  mail: string;
  phone: string;
  productiveUnitId: string;
  productiveUnit?: any;
  createdAt: Date;
  updatedAt: Date;
}

interface DeleteProducerButtonProps {
  producer: Producer;
  onSuccess: () => void;
}

export default function DeleteProducerButton({ producer, onSuccess }: DeleteProducerButtonProps) {
  const { showAlert } = useAlert();
  const [open, setOpen] = useState(false);
  const { isSubmitting, run } = useSubmitLock();
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = async () => {
    setErrors([]);

    const result = await run(async () => {
      try {
        const deleteResult = await deleteProducer(producer.id);

        if (deleteResult.success) {
          showAlert({
            message: 'Producer deleted successfully',
            type: 'success',
            duration: 4000,
          });
          return { ok: true };
        }

        const errorMessage = deleteResult.error || 'Error deleting producer';
        showAlert({
          message: errorMessage,
          type: 'error',
          duration: 4000,
        });
        setErrors([errorMessage]);
        return { ok: false };
      } catch (error) {
        console.error('Error deleting producer:', error);
        const errorMessage = 'Error deleting producer';
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
        title="Delete"
      />
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title=""
        size="xs"
      >
        <DeleteBaseForm
          message={`Are you sure you want to delete the producer "${producer.name}"? This action cannot be undone.`}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          errors={errors}
          cancelButton={true}
          cancelButtonText="Cancel"
          onCancel={() => setOpen(false)}
          submitLabel="Delete"
          title="Delete Producer"
        />
      </Dialog>
    </>
  );
}
