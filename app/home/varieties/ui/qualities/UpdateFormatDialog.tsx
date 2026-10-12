'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Dialog from '@/app/baseComponents/Dialog/Dialog';
import UpdateBaseForm, { BaseUpdateFormField } from '@/app/baseComponents/BaseForm/UpdateBaseForm';
import { useAlert } from '@/app/state/hooks/useAlert';
import { useSubmitLock } from '@/app/state/hooks/useSubmitLock';
import { updateFormat } from '@/app/actions/formats';

interface Format {
  id: number;
  name: string;
  description?: string;
  active: boolean;
}

interface UpdateFormatDialogProps {
  open: boolean;
  onClose: () => void;
  format: Format;
}

const UpdateFormatDialog: React.FC<UpdateFormatDialogProps> = ({ open, onClose, format }) => {
  const router = useRouter();
  const { success, error } = useAlert();
  const { data: session } = useSession();
  const currentUserId = (session?.user as any)?.id;
  const { isSubmitting, run } = useSubmitLock();
  const [errors, setErrors] = useState<string[]>([]);

  const initialState = {
    name: format.name,
    description: format.description || '',
    active: Boolean(format.active),
  };

  const formFields: BaseUpdateFormField[] = [
    {
      name: 'name',
      label: 'Nombre del calidad',
      type: 'text',
      required: true
    },
    {
      name: 'description',
      label: 'Descripción',
      type: 'textarea',
      required: false,
      multiline: true,
      rows: 3
    },
    {
      name: 'active',
      label: 'Estado activo',
      type: 'switch',
      required: false
    }
  ];

  const handleSubmit = async (values: Record<string, unknown>) => {
    setErrors([]);

    const result = await run(async () => {
      try {
        const res = await updateFormat({
          id: format.id,
          name: String(values.name ?? ''),
          description: values.description ? String(values.description) : undefined,
          active: Boolean(values.active),
        }, currentUserId);

        if (!res.success) {
          error(res.error || 'Error al actualizar el calidad');
          return { ok: false };
        }

        success(res.message || 'Calidad actualizado exitosamente');
        return { ok: true };
      } catch (err: any) {
        error('Error inesperado al actualizar el calidad');
        console.error('Update format error:', err);
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

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={`Editar Calidad: ${format.name}`}
      maxWidth="md"
      data-test-id="update-format-dialog"
    >
      <UpdateBaseForm
        fields={formFields}
        initialState={initialState}
        onSubmit={handleSubmit}
        onCancel={handleClose}
        isSubmitting={isSubmitting}
        errors={errors}
        submitLabel="Actualizar Calidad"
        cancelButtonText="Cancelar"
      />
    </Dialog>
  );
};

export default UpdateFormatDialog;
