'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Dialog from '@/app/baseComponents/Dialog/Dialog';
import UpdateBaseForm, { BaseUpdateFormFieldGroup } from '@/app/baseComponents/BaseForm/UpdateBaseForm';
import { useAlert } from '@/app/state/hooks/useAlert';
import { useSubmitLock } from '@/app/state/hooks/useSubmitLock';
import { updateUserWithPerson } from '@/app/actions/users';

interface User {
  id: string;
  userName: string;
  mail: string;
  rol: string;
  person?: {
    name?: string;
    dni?: string;
    phone?: string;
  };
}

interface UpdateUserDialogProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  onSuccess?: () => void;
}

const UpdateUserDialog: React.FC<UpdateUserDialogProps> = ({ open, onClose, user, onSuccess }) => {
  const router = useRouter();
  const { success, error } = useAlert();
  const { data: session } = useSession();
  const currentUserId = (session?.user as any)?.id;
  const { isSubmitting, run } = useSubmitLock();

  // Definir estructura del formulario
  const formFields: BaseUpdateFormFieldGroup[] = [
    {
      id: 'user-info',
      title: 'Información del Usuario',
      columns: 1,
      fields: [
        {
          name: 'userName',
          label: 'Nombre de usuario',
          type: 'text',
          required: true
        },
        {
          name: 'mail',
          label: 'Correo',
          type: 'email',
          required: true
        },
        {
          name: 'rol',
          label: 'Rol',
          type: 'select',
          required: true,
          options: [
            { id: 'OPERATOR', label: 'Operador' },
            { id: 'ADMIN', label: 'Administrador' }
          ]
        }
      ]
    },
    {
      id: 'person-info',
      title: 'Información de la Persona (Opcional)',
      columns: 1,
      fields: [
        {
          name: 'personName',
          label: 'Nombre completo',
          type: 'text'
        },
        {
          name: 'personDni',
          label: 'DNI',
          type: 'dni'
        },
        {
          name: 'phone',
          label: 'Teléfono',
          type: 'text'
        }
      ]
    }
  ];

  // Datos iniciales del usuario
  const initialState = user ? {
    userName: user.userName || '',
    mail: user.mail || '',
    rol: user.rol || 'OPERATOR',
    personName: user.person?.name || '',
    personDni: user.person?.dni || '',
    phone: user.person?.phone || '',
  } : {
    userName: '',
    mail: '',
    rol: 'OPERATOR',
    personName: '',
    personDni: '',
    phone: '',
  };

  const handleSubmit = async (formValues: Record<string, any>) => {
    if (!user?.id) {
      error('Usuario no identificado');
      return;
    }

    const result = await run(async () => {
      try {
        const res = await updateUserWithPerson({
          id: String(user.id),
          userName: formValues.userName,
          mail: formValues.mail,
          phone: formValues.phone,
          rol: formValues.rol as 'ADMIN' | 'OPERATOR',
          personName: formValues.personName,
          personDni: formValues.personDni,
        }, currentUserId);

        if (!res.success) {
          const errorMessage = res.error || 'Error al actualizar el usuario';
          error(errorMessage);
          return { ok: false };
        }

        success('Usuario actualizado exitosamente');
        return { ok: true };
      } catch (err: any) {
        const errorMessage = err?.message || 'Error desconocido';
        error(errorMessage);
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
    <Dialog open={open} onClose={onClose} title="Editar Usuario">
      {user ? (
        <UpdateBaseForm
          fields={formFields}
          initialState={initialState}
          onSubmit={handleSubmit}
          submitLabel="Actualizar Usuario"
          isSubmitting={isSubmitting}
        />
      ) : (
        <div className="text-center py-8 text-gray-500">
          No hay datos de usuario para mostrar
        </div>
      )}
    </Dialog>
  );
};

export default UpdateUserDialog;
