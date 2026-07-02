"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import IconButton from '@/app/baseComponents/IconButton/IconButton';
import Dialog from '@/app/baseComponents/Dialog/Dialog';
import UpdateBaseForm, { type BaseUpdateFormField } from '@/app/baseComponents/BaseForm/UpdateBaseForm';
import { useAlert } from '@/app/state/contexts/AlertContext';
import { getStorages } from '@/app/actions/storages';
import { getTraysSimpleList } from '@/app/actions/trays';
import { updatePallet, type UpdatePalletInput } from '@/app/actions/pallets';
import { PalletStatus } from '@/data/entities/Pallet';
import { getPalletStatusLabel, getPalletStatusOptions } from './PalletStatusBadge';
import type { PalletRow } from './types';

interface SelectOption {
  id: string;
  label: string;
}

interface UpdatePalletButtonProps {
  pallet: PalletRow;
  onSuccess: () => void;
}

export default function UpdatePalletButton({ pallet, onSuccess }: UpdatePalletButtonProps) {
  const { showAlert } = useAlert();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [storageOptions, setStorageOptions] = useState<SelectOption[]>([]);
  const [trayOptions, setTrayOptions] = useState<SelectOption[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [hasLoadedReferences, setHasLoadedReferences] = useState(false);

  const statusOptions = useMemo(() => getPalletStatusOptions(), []);

  const loadReferenceData = useCallback(async () => {
    try {
      const [storagesResult, traysResult] = await Promise.all([
        getStorages({ active: true }),
        getTraysSimpleList(),
      ]);

      if (storagesResult.success && Array.isArray(storagesResult.data)) {
        setStorageOptions(
          storagesResult.data.map((storage: any) => ({
            id: storage.id,
            label: storage.name,
          }))
        );
      }

      setTrayOptions(
        Array.isArray(traysResult)
          ? traysResult.map((tray) => ({ id: tray.id, label: tray.label }))
          : []
      );

      setHasLoadedReferences(true);
    } catch (error) {
      console.error('[UpdatePalletButton] Error cargando referencias:', error);
      showAlert({ message: 'No se pudieron cargar los datos de referencia', type: 'error', duration: 5000 });
    }
  }, [showAlert]);

  useEffect(() => {
    if (open && !hasLoadedReferences) {
      void loadReferenceData();
    }
  }, [open, hasLoadedReferences, loadReferenceData]);

  const initialState = useMemo(
    () => ({
      storageId: pallet.storageId,
      trayId: pallet.trayId,
      capacity: pallet.capacity,
      weight: pallet.weight,
      dispatchWeight: pallet.dispatchWeight,
      status: pallet.status,
    }),
    [pallet]
  );

  const fields: BaseUpdateFormField[] = useMemo(
    () => [
      {
        name: 'storageId',
        label: 'Almacenamiento',
        type: 'select',
        required: true,
        options: storageOptions,
      },
      {
        name: 'trayId',
        label: 'Bandeja',
        type: 'select',
        required: true,
        options: trayOptions,
      },
      {
        name: 'capacity',
        label: 'Capacidad (bandejas)',
        type: 'number',
        required: true,
        min: 1,
      },
      {
        name: 'weight',
        label: 'Peso inicial (kg)',
        type: 'number',
        required: true,
        min: 0,
        step: 0.001,
      },
      {
        name: 'dispatchWeight',
        label: 'Peso despacho (kg)',
        type: 'number',
        required: true,
        min: 0,
        step: 0.001,
      },
      {
        name: 'status',
        label: 'Estado',
        type: 'select',
        required: true,
        options: statusOptions,
      },
    ],
    [storageOptions, trayOptions, statusOptions]
  );

  const validate = (values: Record<string, any>): string[] => {
    const validationErrors: string[] = [];

    const storageId = String(values.storageId ?? '').trim();
    const trayId = String(values.trayId ?? '').trim();
    const capacity = Number(values.capacity);
    const weight = Number(values.weight);
    const dispatchWeight = Number(values.dispatchWeight);
    const status = values.status as PalletStatus | undefined;

    if (!storageId) {
      validationErrors.push('Debes seleccionar un almacenamiento.');
    }

    if (!trayId) {
      validationErrors.push('Debes seleccionar una bandeja.');
    }

    if (Number.isNaN(capacity) || capacity < 1) {
      validationErrors.push('La capacidad debe ser un número mayor o igual a 1.');
    }

    if (Number.isNaN(weight) || weight < 0) {
      validationErrors.push('El peso inicial debe ser un número positivo.');
    }

    if (Number.isNaN(dispatchWeight) || dispatchWeight < 0) {
      validationErrors.push('El peso de despacho debe ser un número positivo.');
    }

    if (!Number.isNaN(dispatchWeight) && !Number.isNaN(weight) && dispatchWeight > weight) {
      validationErrors.push('El peso de despacho no puede ser mayor que el peso inicial.');
    }

    if (!status || !Object.values(PalletStatus).includes(status)) {
      validationErrors.push('Debes seleccionar un estado válido.');
    }

    return validationErrors;
  };

  const handleSubmit = async (values: Record<string, any>) => {
    setErrors([]);

    const validationErrors = validate(values);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    const storageId = String(values.storageId ?? '').trim();
    const trayId = String(values.trayId ?? '').trim();
    const capacity = Number(values.capacity);
    const weight = Number(values.weight);
    const dispatchWeight = Number(values.dispatchWeight);
    const status = values.status as PalletStatus;

    const payload: UpdatePalletInput = { id: pallet.id };

    if (storageId && storageId !== pallet.storageId) {
      payload.storageId = storageId;
    }

    if (trayId && trayId !== pallet.trayId) {
      payload.trayId = trayId;
    }

    if (!Number.isNaN(capacity) && capacity !== pallet.capacity) {
      payload.capacity = capacity;
    }

    if (!Number.isNaN(weight) && weight !== pallet.weight) {
      payload.weight = weight;
    }

    if (!Number.isNaN(dispatchWeight) && dispatchWeight !== pallet.dispatchWeight) {
      payload.dispatchWeight = dispatchWeight;
    }

    if (status && status !== pallet.status) {
      payload.status = status;
    }

    if (Object.keys(payload).length === 1) {
      const message = 'No realizaste cambios en el pallet.';
      setErrors([message]);
      showAlert({ message, type: 'warning', duration: 4000 });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await updatePallet(payload);

      if (result.success) {
        showAlert({
          message: `Pallet actualizado exitosamente (${getPalletStatusLabel(status)})`,
          type: 'success',
          duration: 4000,
        });
        setOpen(false);
        onSuccess();
      } else {
        const errorMessage = result.error || 'Error al actualizar el pallet';
        showAlert({ message: errorMessage, type: 'error', duration: 5000 });
        setErrors([errorMessage]);
      }
    } catch (error) {
      console.error('[UpdatePalletButton] Error actualizando pallet:', error);
      const errorMessage = 'Error inesperado al actualizar el pallet';
      showAlert({ message: errorMessage, type: 'error', duration: 5000 });
      setErrors([errorMessage]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <IconButton
        icon="edit"
        variant="basicSecondary"
        size="sm"
        onClick={() => setOpen(true)}
        title="Editar"
      />
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Editar Pallet"
        size="xl"
      >
        <UpdateBaseForm
          fields={fields}
          initialState={initialState}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          errors={errors}
          submitLabel="Actualizar"
          cancelButton
          cancelButtonText="Cancelar"
          onCancel={() => setOpen(false)}
        />
      </Dialog>
    </>
  );
}
