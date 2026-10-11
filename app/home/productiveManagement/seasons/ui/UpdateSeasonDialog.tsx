'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Dialog from '@/app/baseComponents/Dialog/Dialog';
import UpdateBaseForm, { BaseUpdateFormField } from '@/app/baseComponents/BaseForm/UpdateBaseForm';
import { useAlert } from '@/app/state/hooks/useAlert';
import { Season } from '@/data/entities/Season';
import { updateSeason } from '@/app/actions/seasons';
import { useSubmitLock } from '@/app/state/hooks/useSubmitLock';

interface UpdateSeasonDialogProps {
  open: boolean;
  onClose: () => void;
  season: Season;
  'data-test-id'?: string;
}

const UpdateSeasonDialog: React.FC<UpdateSeasonDialogProps> = ({ open, onClose, season, 'data-test-id': dataTestId }) => {
  const router = useRouter();
  const { success, error } = useAlert();
  const { data: session } = useSession();
  const currentUserId = (session?.user as any)?.id;
  const { isSubmitting, run } = useSubmitLock();

  const formFields: BaseUpdateFormField[] = [
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

  const initialState = {
    id: season.id,
    name: season.name,
    startDate: new Date(season.startDate).toISOString().split('T')[0], // Format for date input
    endDate: new Date(season.endDate).toISOString().split('T')[0], // Format for date input
    description: season.description || '',
    active: season.active,
  };

  const handleSubmit = async (values: any) => {
    const result = await run(async () => {
      try {
        const updateResult = await updateSeason({
          id: season.id,
          name: values.name,
          startDate: values.startDate ? new Date(values.startDate + 'T00:00:00') : undefined,
          endDate: values.endDate ? new Date(values.endDate + 'T23:59:59') : undefined,
          description: values.description || undefined,
          active: values.active,
        }, currentUserId);

        if (updateResult.success) {
          success(updateResult.message || 'Temporada actualizada exitosamente');
          return { ok: true };
        }

        error(updateResult.error || 'Error al actualizar la temporada');
        return { ok: false };
      } catch (err: any) {
        error('Error inesperado al actualizar la temporada');
        console.error('Update season error:', err);
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
      title="Editar Temporada"
      maxWidth="md"
      data-test-id={dataTestId}
    >
      <UpdateBaseForm
        fields={formFields}
        initialState={initialState}
        onSubmit={handleSubmit}
        submitLabel="Actualizar Temporada"
        isSubmitting={isSubmitting}
      />
    </Dialog>
  );
};

export default UpdateSeasonDialog;