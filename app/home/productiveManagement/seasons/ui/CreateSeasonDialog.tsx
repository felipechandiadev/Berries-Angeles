'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Dialog from '@/app/baseComponents/Dialog/Dialog';
import CreateBaseForm, { BaseFormField } from '@/app/baseComponents/BaseForm/CreateBaseForm';
import { useAlert } from '@/app/state/hooks/useAlert';
import { createSeason } from '@/app/actions/seasons';
import { useSubmitLock } from '@/app/state/hooks/useSubmitLock';

interface CreateSeasonDialogProps {
  open: boolean;
  onClose: () => void;
  'data-test-id'?: string;
}

const CreateSeasonDialog: React.FC<CreateSeasonDialogProps> = ({ open, onClose, 'data-test-id': dataTestId }) => {
  const router = useRouter();
  const { success, error } = useAlert();
  const { data: session } = useSession();
  const currentUserId = (session?.user as any)?.id;
  const { isSubmitting, run } = useSubmitLock();
  const [errors, setErrors] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    description: '',
    active: true,
  });

  const formFields: BaseFormField[] = [
    {
      name: 'name',
      label: 'Nombre de la temporada',
      type: 'text',
      required: true
    },
    {
      name: 'startDate',
      label: 'Fecha de inicio',
      type: 'date',
      required: true
    },
    {
      name: 'endDate',
      label: 'Fecha de término',
      type: 'date',
      required: true
    },
    {
      name: 'description',
      label: 'Descripción',
      type: 'textarea',
      required: false
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
        const createResult = await createSeason({
          name: formData.name,
          startDate: new Date(formData.startDate + 'T00:00:00'),
          endDate: new Date(formData.endDate + 'T23:59:59'),
          description: formData.description || undefined,
          active: formData.active,
        }, currentUserId);

        if (createResult.success) {
          success(createResult.message || 'Temporada creada exitosamente');
          return { ok: true };
        }

        error(createResult.error || 'Error al crear la temporada');
        return { ok: false };
      } catch (err: any) {
        error('Error inesperado al crear la temporada');
        console.error('Create season error:', err);
        return { ok: false };
      }
    });

    if (result?.ok) {
      onClose();
      setFormData({
        name: '',
        startDate: '',
        endDate: '',
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
        startDate: '',
        endDate: '',
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
      title="Crear Nueva Temporada"
      maxWidth="md"
      data-test-id={dataTestId}
    >
      <CreateBaseForm
        fields={formFields}
        values={formData}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onCancel={handleClose}
        isSubmitting={isSubmitting}
        errors={errors}
        submitLabel="Crear Temporada"
        cancelButtonText="Cancelar"
      />
    </Dialog>
  );
};

export default CreateSeasonDialog;