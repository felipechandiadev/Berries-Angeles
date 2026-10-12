'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Dialog from '@/app/baseComponents/Dialog/Dialog';
import UpdateBaseForm, { BaseUpdateFormFieldGroup } from '@/app/baseComponents/BaseForm/UpdateBaseForm';
import { useAlert } from '@/app/state/hooks/useAlert';
import { useSubmitLock } from '@/app/state/hooks/useSubmitLock';
import { updateVariety } from '@/app/actions/varieties';

interface Variety {
  id: number;
  name: string;
}

interface UpdateVarietyDialogProps {
  open: boolean;
  onClose: () => void;
  variety: Variety;
  'data-test-id'?: string;
}

const UpdateVarietyDialog: React.FC<UpdateVarietyDialogProps> = ({ open, onClose, variety }) => {
  const router = useRouter();
  const { success, error } = useAlert();
  const { data: session } = useSession();
  const currentUserId = (session?.user as any)?.id;
  const { isSubmitting, run } = useSubmitLock();
  const [errors, setErrors] = useState<string[]>([]);

  const formFields: BaseUpdateFormFieldGroup[] = [
    {
      id: 'variety-info',
      title: 'Información de la Variedad',
      columns: 1,
      fields: [
        {
          name: 'name',
          label: 'Nombre de la variedad',
          type: 'text',
          required: true,
        },
      ],
    },
  ];

  const handleSubmit = async (values: Record<string, any>) => {
    setErrors([]);
    const result = await run(async () => {
      try {
        const res = await updateVariety(
          { id: variety.id, name: String(values.name ?? '') },
          currentUserId,
        );
        if (!res.success) {
          error(res.error || 'Error al actualizar la variedad');
          if (res.error) setErrors([res.error]);
          return { ok: false };
        }
        success(res.message || 'Variedad actualizada exitosamente');
        return { ok: true };
      } catch (err) {
        console.error('Error updating variety:', err);
        error('Error inesperado al actualizar la variedad');
        setErrors(['Error inesperado al actualizar la variedad']);
        return { ok: false };
      }
    });

    if (result?.ok) {
      onClose();
      router.refresh();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={`Editar: ${variety.name}`} size="sm" showCloseButton>
      <UpdateBaseForm
        fields={formFields}
        initialState={{ name: variety.name }}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        errors={errors}
        submitLabel="Actualizar"
        cancelButton
        cancelButtonText="Cancelar"
        onCancel={onClose}
      />
    </Dialog>
  );
};

export default UpdateVarietyDialog;
