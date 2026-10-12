'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Dialog from '@/app/baseComponents/Dialog/Dialog';
import CreateBaseForm, { BaseFormField } from '@/app/baseComponents/BaseForm/CreateBaseForm';
import { useAlert } from '@/app/state/hooks/useAlert';
import { useSubmitLock } from '@/app/state/hooks/useSubmitLock';
import { createFormat } from '@/app/actions/formats';

interface CreateFormatDialogProps {
  open: boolean;
  onClose: () => void;
}

const CreateFormatDialog: React.FC<CreateFormatDialogProps> = ({ open, onClose }) => {
  const router = useRouter();
  const { success, error } = useAlert();
  const { data: session } = useSession();
  const currentUserId = (session?.user as any)?.id;
  const { isSubmitting, run } = useSubmitLock();
  const [errors, setErrors] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    active: true,
  });

  const formFields: BaseFormField[] = [
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

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    setErrors([]);

    const result = await run(async () => {
      try {
        const res = await createFormat({
          name: formData.name,
          description: formData.description || undefined,
          active: formData.active,
        }, currentUserId);

        if (!res.success) {
          error(res.error || 'Error al crear el calidad');
          return { ok: false };
        }

        success(res.message || 'Calidad creado exitosamente');
        return { ok: true };
      } catch (err: any) {
        error('Error inesperado al crear el calidad');
        console.error('Create format error:', err);
        return { ok: false };
      }
    });

    if (result?.ok) {
      onClose();
      setFormData({
        name: '',
        description: '',
        active: true,
      });
      router.refresh();
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setFormData({
        name: '',
        description: '',
        active: true,
      });
      setErrors([]);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Crear Nuevo Calidad"
      maxWidth="md"
      data-test-id="create-format-dialog"
    >
      <CreateBaseForm
        fields={formFields}
        values={formData}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onCancel={handleClose}
        isSubmitting={isSubmitting}
        errors={errors}
        submitLabel="Crear Calidad"
        cancelButtonText="Cancelar"
      />
    </Dialog>
  );
};

export default CreateFormatDialog;