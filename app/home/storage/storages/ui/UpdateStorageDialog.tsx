'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Dialog from '@/app/baseComponents/Dialog/Dialog';
import UpdateBaseForm, { BaseUpdateFormField } from '@/app/baseComponents/BaseForm/UpdateBaseForm';
import { useAlert } from '@/app/state/hooks/useAlert';
import { Storage, StorageType } from '@/data/entities/Storage';
import { updateStorage } from '@/app/actions/storages';
import { useSubmitLock } from '@/app/state/hooks/useSubmitLock';

interface UpdateStorageDialogProps {
  open: boolean;
  onClose: () => void;
  storage: Storage;
  'data-test-id'?: string;
}

const UpdateStorageDialog: React.FC<UpdateStorageDialogProps> = ({ open, onClose, storage, 'data-test-id': dataTestId }) => {
  const router = useRouter();
  const { success, error } = useAlert();
  const { data: session } = useSession();
  const currentUserId = (session?.user as any)?.id;
  const { isSubmitting, run } = useSubmitLock();

  const storageTypeOptions = [
    { id: StorageType.COLD_ROOM, label: 'Cámara Fría' },
    { id: StorageType.IQF_TUNNEL, label: 'Túnel IQF' },
    { id: StorageType.DRY_WAREHOUSE, label: 'Almacén Seco' },
    { id: StorageType.FREEZER, label: 'Congelador' },
  ];

  const formFields: BaseUpdateFormField[] = [
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

  const initialState = {
    id: storage.id,
    name: storage.name,
    type: storage.type,
    capacityPallets: storage.capacityPallets || 0,
    location: storage.location || '',
    active: storage.active,
  };

  const handleSubmit = async (values: any) => {
    const result = await run(async () => {
      try {
        const res = await updateStorage({
          id: storage.id,
          name: values.name,
          type: values.type,
          capacityPallets: values.capacityPallets || undefined,
          location: values.location || undefined,
          active: values.active,
        }, currentUserId);

        if (!res.success) {
          error(res.error || 'Error al actualizar el almacenamiento');
          return { ok: false };
        }

        success(res.message || 'Almacenamiento actualizado exitosamente');
        return { ok: true };
      } catch (err: any) {
        error('Error inesperado al actualizar el almacenamiento');
        console.error('Update storage error:', err);
        return { ok: false };
      }
    });

    if (result?.ok) {
      onClose();
      router.refresh();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Editar Almacenamiento"
      maxWidth="md"
      data-test-id={dataTestId}
    >
      <UpdateBaseForm
        fields={formFields}
        initialState={initialState}
        onSubmit={handleSubmit}
        submitLabel="Actualizar Almacenamiento"
        isSubmitting={isSubmitting}
      />
    </Dialog>
  );
};

export default UpdateStorageDialog;