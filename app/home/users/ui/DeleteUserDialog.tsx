'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Dialog from '@/app/baseComponents/Dialog/Dialog';
import DeleteBaseForm from '@/app/baseComponents/BaseForm/DeleteBaseForm';
import { useAlert } from '@/app/state/hooks/useAlert';
import { useSubmitLock } from '@/app/state/hooks/useSubmitLock';
import { deleteUser } from '@/app/actions/users';

interface User {
  id: string;
  userName: string;
  mail: string;
  phone?: string;
  rol: string;
  person?: {
    name?: string;
    dni?: string;
  };
}

interface DeleteUserDialogProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  onSuccess?: () => void;
}

const DeleteUserDialog: React.FC<DeleteUserDialogProps> = ({ open, onClose, user, onSuccess }) => {
  const router = useRouter();
  const { data: session } = useSession();
  const currentUserId = (session?.user as any)?.id;
  const { isSubmitting, run } = useSubmitLock();
  const [errors, setErrors] = useState<string[]>([]);
  const { success, error } = useAlert();

  const handleSubmit = async () => {
    if (!user?.id || String(user.id).trim() === '') {
      setErrors(['Usuario no identificado']);
      return;
    }

    setErrors([]);

    const result = await run(async () => {
      try {
        const res = await deleteUser(String(user.id), currentUserId);

        if (!res?.success) {
          const errorMessage = res?.error || 'Error al eliminar el usuario';
          error(errorMessage);
          setErrors([errorMessage]);
          return { ok: false };
        }

        success(`Usuario "${user.userName}" eliminado correctamente`);
        return { ok: true };
      } catch (err: any) {
        const errorMessage = err?.message || 'Error desconocido al eliminar el usuario';
        error(errorMessage);
        setErrors([errorMessage]);
        return { ok: false };
      }
    });

    if (result?.ok) {
      onClose();
      onSuccess?.();
      router.refresh();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="" size="xs">
      {user ? (
        <DeleteBaseForm
          message={`¿Está seguro que desea eliminar al usuario "${user?.userName}"? Esta acción no se puede deshacer.`}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          errors={errors}
          cancelButton={true}
          cancelButtonText="Cancelar"
          onCancel={onClose}
          submitLabel="Eliminar Usuario"
          title='Eliminar Usuario'
        />
      ) : (
        <div className="text-center py-8 text-gray-500">
          No hay datos de usuario para mostrar
        </div>
      )}
    </Dialog>
  );
};

export default DeleteUserDialog;
