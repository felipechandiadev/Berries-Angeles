'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Dialog from '@/app/baseComponents/Dialog/Dialog';
import DeleteBaseForm from '@/app/baseComponents/BaseForm/DeleteBaseForm';
import { useAlert } from '@/app/state/hooks/useAlert';
import { useSubmitLock } from '@/app/state/hooks/useSubmitLock';
import { deleteVariety } from '@/app/actions/varieties';

interface Variety {
  id: number;
  name: string;
}

interface DeleteVarietyDialogProps {
  open: boolean;
  onClose: () => void;
  variety: Variety;
  'data-test-id'?: string;
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

    const result = await run(async () => {
      try {
        const res = await deleteVariety(variety.id, currentUserId);
        if (!res.success) {
          error(res.error || 'Error al eliminar');
          if (res.error) setErrors([res.error]);
          return { ok: false };
        }
        success(res.message || 'Variedad eliminada');
        return { ok: true };
      } catch (err) {
        console.error(err);
        error('Error inesperado al eliminar');
        setErrors(['Error inesperado al eliminar']);
        return { ok: false };
      }
    });

    if (result?.ok) {
      onClose();
      router.refresh();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Eliminar Variedad" size="xs" showCloseButton>
      <DeleteBaseForm
        message={`¿Eliminar la variedad "${variety.name}"?`}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        errors={errors}
        cancelButton
        onCancel={onClose}
      />
    </Dialog>
  );
};

export default DeleteVarietyDialog;
