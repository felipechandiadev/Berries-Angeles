'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Dialog from '@/app/baseComponents/Dialog/Dialog';
import UpdateBaseForm, { BaseUpdateFormField } from '@/app/baseComponents/BaseForm/UpdateBaseForm';
import { useAlert } from '@/app/state/hooks/useAlert';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: format.name,
    description: format.description || '',
    active: format.active,
  });

  // Update form data when format changes
  useEffect(() => {
    setFormData({
      name: format.name,
      description: format.description || '',
      active: format.active,
    });
  }, [format]);

  const formFields: BaseUpdateFormField[] = [
    {
      name: 'name',
      label: 'Nombre del formato',
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
    setIsSubmitting(true);
    setErrors([]);

    try {
      const result = await updateFormat({
        id: format.id,
        name: formData.name,
        description: formData.description || undefined,
        active: formData.active,
      }, currentUserId);

      if (result.success) {
        success(result.message || 'Formato actualizado exitosamente');
        onClose();
        // Refresh the page to show the updated format
        router.refresh();
      } else {
        error(result.error || 'Error al actualizar el formato');
      }
    } catch (err: any) {
      error('Error inesperado al actualizar el formato');
      console.error('Update format error:', err);
    } finally {
      setIsSubmitting(false);
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
      title={`Editar Formato: ${format.name}`}
      maxWidth="md"
      data-test-id="update-format-dialog"
    >
      <UpdateBaseForm
        fields={formFields}
        initialState={formData}
        onSubmit={handleSubmit}
        onCancel={handleClose}
        isSubmitting={isSubmitting}
        errors={errors}
        submitLabel="Actualizar Formato"
        cancelButtonText="Cancelar"
      />
    </Dialog>
  );
};

export default UpdateFormatDialog;