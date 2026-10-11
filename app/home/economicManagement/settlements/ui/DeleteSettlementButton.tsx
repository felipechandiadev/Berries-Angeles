'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Dialog from '@/app/baseComponents/Dialog/Dialog';
import IconButton from '@/app/baseComponents/IconButton/IconButton';
import DeleteBaseForm from '@/app/baseComponents/BaseForm/DeleteBaseForm';
import { useAlert } from '@/app/state/contexts/AlertContext';
import { deleteSettlement } from '@/app/actions/settlements';
import { useSubmitLock } from '@/app/state/hooks/useSubmitLock';

interface DeleteSettlementButtonProps {
  settlementId: string;
  producerName?: string | null;
  statusLabel?: string | null;
  onSuccess?: () => void;
}

export default function DeleteSettlementButton({
  settlementId,
  producerName,
  statusLabel,
  onSuccess,
}: DeleteSettlementButtonProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { showAlert } = useAlert();
  const currentUserId = (session?.user as { id?: string } | undefined)?.id;

  const [open, setOpen] = useState(false);
  const { isSubmitting, run } = useSubmitLock();
  const [errors, setErrors] = useState<string[]>([]);

  const handleClose = () => {
    if (isSubmitting) return;
    setOpen(false);
    setErrors([]);
  };

  const handleSubmit = async () => {
    if (status === 'loading') {
      showAlert({
        message: 'Cargando sesión de usuario. Por favor, intente nuevamente en un momento.',
        type: 'error',
        duration: 4000,
      });
      return;
    }

    if (!currentUserId) {
      showAlert({
        message: 'No fue posible identificar al usuario actual. Inicie sesión nuevamente.',
        type: 'error',
        duration: 4000,
      });
      return;
    }

    setErrors([]);

    const result = await run(async () => {
      const response = await deleteSettlement({
        settlementId,
        userId: currentUserId,
      });

      if (!response.success) {
        const errorMessage = response.error || 'No se pudo eliminar la liquidación.';
        showAlert({ message: errorMessage, type: 'error', duration: 4000 });
        setErrors([errorMessage]);
        return { ok: false };
      }

      showAlert({
        message: 'Liquidación eliminada. Recepciones y anticipos liberados.',
        type: 'success',
        duration: 4000,
      });
      return { ok: true };
    });

    if (result?.ok) {
      setOpen(false);
      onSuccess?.();
      router.refresh();
    }
  };

  const producerDisplay = producerName ? ` del productor "${producerName}"` : '';
  const statusDisplay = statusLabel ? ` (${statusLabel})` : '';

  return (
    <>
      <IconButton
        icon="delete"
        variant="basicSecondary"
        size="sm"
        ariaLabel="Eliminar liquidación"
        title="Eliminar liquidación"
        onClick={() => setOpen(true)}
      />

      <Dialog open={open} onClose={handleClose} title="Eliminar liquidación" size="xs">
        <DeleteBaseForm
          message={`¿Confirma que desea eliminar esta liquidación${statusDisplay}${producerDisplay}? Se liberarán las recepciones y anticipos asociados.`}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          errors={errors}
          cancelButton
          cancelButtonText="Cerrar"
          onCancel={handleClose}
          submitLabel="Eliminar liquidación"
        />
      </Dialog>
    </>
  );
}
