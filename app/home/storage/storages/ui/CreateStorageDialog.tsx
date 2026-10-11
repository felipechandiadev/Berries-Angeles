'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Dialog from '@/app/baseComponents/Dialog/Dialog';
import CreateBaseForm, { BaseFormField } from '@/app/baseComponents/BaseForm/CreateBaseForm';
import { useAlert } from '@/app/state/hooks/useAlert';
import { StorageType } from '@/data/entities/Storage';
import { createStorage } from '@/app/actions/storages';
import { useSubmitLock } from '@/app/state/hooks/useSubmitLock';

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
  const { isSubmitting, run } = useSubmitLock();
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
    setErrors([]);

    const result = await run(async () => {
      try {
        const res = await createStorage({
          name: formData.name,
          type: formData.type,
          capacityPallets: formData.capacityPallets || undefined,
          location: formData.location || undefined,
          active: formData.active,
        }, currentUserId);

        if (!res.success) {
          error(res.error || 'Error al crear el almacenamiento');
          return { ok: false };
        }

        success(res.message || 'Almacenamiento creado exitosamente');
        return { ok: true };
      } catch (err: any) {
        error('Error inesperado al crear el almacenamiento');
        console.error('Create storage error:', err);
        return { ok: false };
      }
    });

    if (result?.ok) {
      onClose();
      setFormData({
        name: '',
        type: StorageType.COLD_ROOM,
        capacityPallets: 0,
        location: '',
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