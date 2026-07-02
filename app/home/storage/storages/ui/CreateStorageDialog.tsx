'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Dialog from '@/app/baseComponents/Dialog/Dialog';
import CreateBaseForm, { BaseFormField } from '@/app/baseComponents/BaseForm/CreateBaseForm';
import { useAlert } from '@/app/state/hooks/useAlert';
import { StorageType } from '@/data/entities/Storage';
import { createStorage } from '@/app/actions/storages';

interface CreateStorageDialogProps {
  open: boolean;
  onClose: () => void;
  'data-test-id'?: string;
}

const CreateStorageDialog: React.FC<CreateStorageDialogProps> = ({ open, onClose, 'data-test-id': dataTestId }) => {
  const router = useRouter();
  const { success, error } = useAlert();
  const { data: session } = useSession();
  const currentUserId = (session?.user as any)?.id;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    type: StorageType.COLD_ROOM,
    capacityPallets: 0,
    location: '',
    active: true,
  });

  const storageTypeOptions = [
    { id: StorageType.COLD_ROOM, label: 'Cámara Fría' },
    { id: StorageType.IQF_TUNNEL, label: 'Túnel IQF' },
    { id: StorageType.DRY_WAREHOUSE, label: 'Almacén Seco' },
    { id: StorageType.FREEZER, label: 'Congelador' },
  ];

  const formFields: BaseFormField[] = [
    {
      name: 'name',
      label: 'Nombre del almacenamiento',
      type: 'text',
      required: true
    },
    {
      name: 'type',
      label: 'Tipo de almacenamiento',
      type: 'select',
      required: true,
      options: storageTypeOptions
    },
    {
      name: 'capacityPallets',
      label: 'Capacidad (pallets)',
      type: 'number',
      required: false,
      min: 0
    },
    {
      name: 'location',
      label: 'Ubicación',
      type: 'text',
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
    setIsSubmitting(true);
    setErrors([]);

    try {
      const result = await createStorage({
        name: formData.name,
        type: formData.type,
        capacityPallets: formData.capacityPallets || undefined,
        location: formData.location || undefined,
        active: formData.active,
      }, currentUserId);

      if (result.success) {
        success(result.message || 'Almacenamiento creado exitosamente');
        onClose();
        setFormData({
          name: '',
          type: StorageType.COLD_ROOM,
          capacityPallets: 0,
          location: '',
          active: true,
        });
        // Refresh the page to show the new storage
        router.refresh();
      } else {
        error(result.error || 'Error al crear el almacenamiento');
      }
    } catch (err: any) {
      error('Error inesperado al crear el almacenamiento');
      console.error('Create storage error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setFormData({
        name: '',
        type: StorageType.COLD_ROOM,
        capacityPallets: 0,
        location: '',
        active: true,
      });
      setErrors([]);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Crear Nuevo Almacenamiento"
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
        submitLabel="Crear Almacenamiento"
        cancelButtonText="Cancelar"
      />
    </Dialog>
  );
};

export default CreateStorageDialog;