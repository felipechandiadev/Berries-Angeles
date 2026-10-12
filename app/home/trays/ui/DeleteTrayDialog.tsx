'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Dialog from '@/app/baseComponents/Dialog/Dialog';
import DeleteBaseForm from '@/app/baseComponents/BaseForm/DeleteBaseForm';
import { useAlert } from '@/app/state/hooks/useAlert';
import { useSubmitLock } from '@/app/state/hooks/useSubmitLock';
import { deleteTray } from '@/app/actions/trays';

interface Tray {
  id: string;
  name: string;
  weight: number;
  stock: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

interface DeleteTrayDialogProps {
  open: boolean;
  onClose: () => void;
  tray: Tray;
  onSuccess?: () => void;
  'data-test-id'?: string;
}

const DeleteTrayDialog: React.FC<DeleteTrayDialogProps> = ({ open, onClose, tray, onSuccess, 'data-test-id': dataTestId }) => {
  const router = useRouter();
  const { data: session } = useSession();
  const currentUserId = (session?.user as any)?.id;
  const { isSubmitting, run } = useSubmitLock();
  const [errors, setErrors] = useState<string[]>([]);
  const { success, error } = useAlert();

  const handleSubmit = async () => {
    if (!tray?.id) {
      setErrors(['Bandeja no identificada']);
      return;
    }

    setErrors([]);

    const result = await run(async () => {
      try {
        const res = await deleteTray(tray.id, currentUserId);

        if (!res?.success) {
          error(res.error || 'Error al eliminar la bandeja');
          setErrors([res.error || 'Error desconocido']);
          return { ok: false };
        }

        success(res.message || 'Bandeja eliminada exitosamente');
        return { ok: true };
      } catch (err: any) {
        console.error('Error deleting tray:', err);
        error('Error inesperado al eliminar la bandeja');
        setErrors(['Error inesperado al eliminar la bandeja']);
        return { ok: false };
      }
    });

    if (result?.ok) {
      onClose();
      onSuccess?.();
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setErrors([]);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Eliminar Bandeja"
      maxWidth="sm"
      data-test-id={dataTestId || "delete-tray-dialog"}
    >
      <DeleteBaseForm
        title="¿Eliminar bandeja?"
        message={`¿Estás seguro de que quieres eliminar la bandeja "${tray.name}"? Esta acción no se puede deshacer.`}
        onSubmit={handleSubmit}
        onCancel={handleClose}
        submitLabel="Eliminar"
        cancelButtonText="Cancelar"
        isSubmitting={isSubmitting}
        errors={errors}
        data-test-id="delete-tray-form"
      />
    </Dialog>
  );
};

export default DeleteTrayDialog;