'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Dialog from '@/app/baseComponents/Dialog/Dialog';
import DeleteBaseForm from '@/app/baseComponents/BaseForm/DeleteBaseForm';
import { useAlert } from '@/app/state/hooks/useAlert';
import { useSubmitLock } from '@/app/state/hooks/useSubmitLock';
import { deleteVariety } from '@/app/actions/varieties';
import { Currency } from '../../../../../data/entities/Variety';

interface Variety {
  id: number;
  name: string;
  priceCLP: number;
  priceUSD: number;
  currency: Currency;
}

interface DeleteVarietyDialogProps {
  open: boolean;
  onClose: () => void;
  variety: Variety;
}

const DeleteVarietyDialog: React.FC<DeleteVarietyDialogProps> = ({ open, onClose, variety }) => {
  const router = useRouter();
  const { data: session } = useSession();
  const currentUserId = (session?.user as any)?.id;
  const { isSubmitting, run } = useSubmitLock();
  const [errors, setErrors] = useState<string[]>([]);
  const { success, error } = useAlert();

  const handleSubmit = async () => {
    if (!variety?.id) {
      setErrors(['Variedad no identificada']);
      return;
    }

    setErrors([]);

    const result = await run(async () => {
      try {
        const res = await deleteVariety(variety.id, currentUserId);

        if (!res?.success) {
          error(res.error || 'Error al eliminar la variedad');
          if (res.error) {
            setErrors([res.error]);
          }
          return { ok: false };
        }

        success(res.message || 'Variedad eliminada exitosamente');
        return { ok: true };
      } catch (err: any) {
        console.error('Error deleting variety:', err);
        error('Error inesperado al eliminar la variedad');
        setErrors(['Error inesperado al eliminar la variedad']);
        return { ok: false };
      }
    });

    if (result?.ok) {
      onClose();
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setErrors([]);
      onClose();
    }
  };

  const getDeleteMessage = () => {
    return `¿Estás seguro de que deseas eliminar la variedad "${variety.name}"? Esta acción no se puede deshacer.`;
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Eliminar Variedad"
      maxWidth="xs"
      data-test-id="delete-variety-dialog"
    >
      <DeleteBaseForm
        message={getDeleteMessage()}
        onSubmit={handleSubmit}
        onCancel={handleClose}
        isSubmitting={isSubmitting}
        errors={errors}
        submitLabel="Eliminar Variedad"
        cancelButtonText="Cancelar"
        data-test-id="delete-variety-form"
      />
    </Dialog>
  );
};

export default DeleteVarietyDialog;