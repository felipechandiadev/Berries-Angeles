'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Dialog from '@/app/baseComponents/Dialog/Dialog';
import CreateBaseForm, { BaseFormFieldGroup } from '@/app/baseComponents/BaseForm/CreateBaseForm';
import { useAlert } from '@/app/state/hooks/useAlert';
import { useSubmitLock } from '@/app/state/hooks/useSubmitLock';
import { createVariety } from '@/app/actions/varieties';

interface CreateVarietyDialogProps {
  open: boolean;
  onClose: () => void;
  'data-test-id'?: string;
}

const CreateVarietyDialog: React.FC<CreateVarietyDialogProps> = ({ open, onClose }) => {
  const router = useRouter();
  const { success, error } = useAlert();
  const { data: session } = useSession();
  const currentUserId = (session?.user as any)?.id;
  const { isSubmitting, run } = useSubmitLock();
  const [errors, setErrors] = useState<string[]>([]);
  const [formData, setFormData] = useState({ name: '' });

  const formFields: BaseFormFieldGroup[] = [
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

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setErrors([]);
    const result = await run(async () => {
      try {
        const res = await createVariety({ name: formData.name }, currentUserId);
        if (!res.success) {
          error(res.error || 'Error al crear la variedad');
          if (res.error) setErrors([res.error]);
          return { ok: false };
        }
        success(res.message || 'Variedad creada exitosamente');
        return { ok: true };
      } catch (err) {
        console.error('Error creating variety:', err);
        error('Error inesperado al crear la variedad');
        setErrors(['Error inesperado al crear la variedad']);
        return { ok: false };
      }
    });

    if (result?.ok) {
      onClose();
      setFormData({ name: '' });
      router.refresh();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Crear Variedad" size="sm" showCloseButton>
      <CreateBaseForm
        fields={formFields}
        values={formData}
        onChange={handleChange}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitLabel="Crear"
        cancelButton
        cancelButtonText="Cancelar"
        onCancel={onClose}
        errors={errors}
      />
    </Dialog>
  );
};

export default CreateVarietyDialog;
