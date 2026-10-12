'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Dialog from '@/app/baseComponents/Dialog/Dialog';
import DeleteBaseForm from '@/app/baseComponents/BaseForm/DeleteBaseForm';
import { useAlert } from '@/app/state/hooks/useAlert';
import { useSubmitLock } from '@/app/state/hooks/useSubmitLock';
import { deleteFormat } from '@/app/actions/formats';

interface Format {
  id: number;
  name: string;
  description?: string;
  active: boolean;
}

interface DeleteFormatDialogProps {
  open: boolean;
  onClose: () => void;
  format: Format;
}

const DeleteFormatDialog: React.FC<DeleteFormatDialogProps> = ({ open, onClose, format }) => {
  const router = useRouter();
  const { data: session } = useSession();
  const currentUserId = (session?.user as any)?.id;
  const { isSubmitting, run } = useSubmitLock();
  const [errors, setErrors] = useState<string[]>([]);
  const { success, error } = useAlert();

  const handleSubmit = async () => {
    if (!format?.id) {
      setErrors(['Calidad no identificado']);
      return;
    }

    setErrors([]);

    const result = await run(async () => {
      try {
        const res = await deleteFormat(format.id, currentUserId);

        if (!res?.success) {
          error(res.error || 'Error al eliminar el calidad');
          return { ok: false };
        }

        success(res.message || 'Calidad eliminado exitosamente');
        return { ok: true };
      } catch (err: any) {
        error('Error inesperado al eliminar el calidad');
        console.error('Delete format error:', err);
        return { ok: false };
      }
    });

    if (result?.ok) {
      onClose();
      router.refresh();
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setErrors([]);
    }
  };

  const deleteMessage = `¿Estás seguro de que deseas eliminar el calidad "${format.name}"?`;
  const deleteDetails = 'Esta acción marcará el calidad como eliminado, pero podrás restaurarlo más tarde si es necesario.';

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Eliminar Calidad"
      maxWidth="sm"
      data-test-id="delete-format-dialog"
    >
      <DeleteBaseForm
        message={deleteMessage}
        onSubmit={handleSubmit}
        onCancel={handleClose}
        isSubmitting={isSubmitting}
        errors={errors}
        submitLabel="Eliminar Calidad"
        cancelButtonText="Cancelar"
      />
    </Dialog>
  );
};

export default DeleteFormatDialog;