'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Dialog from '@/app/baseComponents/Dialog/Dialog';
import DeleteBaseForm from '@/app/baseComponents/BaseForm/DeleteBaseForm';
import { useAlert } from '@/app/state/hooks/useAlert';
import { Storage } from '@/data/entities/Storage';
import { deleteStorage } from '@/app/actions/storages';
import { useSubmitLock } from '@/app/state/hooks/useSubmitLock';

interface DeleteStorageDialogProps {
  open: boolean;
  onClose: () => void;
  storage: Storage;
  'data-test-id'?: string;
}

const DeleteStorageDialog: React.FC<DeleteStorageDialogProps> = ({ open, onClose, storage, 'data-test-id': dataTestId }) => {
  const router = useRouter();
  const { data: session } = useSession();
  const currentUserId = (session?.user as any)?.id;
  const { isSubmitting, run } = useSubmitLock();
  const [errors, setErrors] = useState<string[]>([]);
  const { success, error } = useAlert();

  const handleSubmit = async () => {
    if (!storage?.id) {
      setErrors(['Almacenamiento no identificado']);
      return;
    }

    setErrors([]);

    const result = await run(async () => {
      try {
        const res = await deleteStorage(storage.id, currentUserId);

        if (!res?.success) {
          error(res.error || 'Error al eliminar el almacenamiento');
          return { ok: false };
        }

        success(res.message || 'Almacenamiento eliminado exitosamente');
        return { ok: true };
      } catch (err: any) {
        error('Error inesperado al eliminar el almacenamiento');
        console.error('Delete storage error:', err);
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

  const deleteMessage = `¿Estás seguro de que deseas eliminar el almacenamiento "${storage.name}"?`;
  const deleteDetails = 'Esta acción marcará el almacenamiento como eliminado, pero podrás restaurarlo más tarde si es necesario.';

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Eliminar Almacenamiento"
      maxWidth="sm"
      data-test-id={dataTestId}
    >
      <DeleteBaseForm
        message={deleteMessage}
        onSubmit={handleSubmit}
        onCancel={handleClose}
        isSubmitting={isSubmitting}
        errors={errors}
        submitLabel="Eliminar Almacenamiento"
        cancelButtonText="Cancelar"
      />
    </Dialog>
  );
};

export default DeleteStorageDialog;