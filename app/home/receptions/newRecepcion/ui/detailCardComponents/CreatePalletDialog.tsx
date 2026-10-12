"use client";

import { useState } from 'react';
import CreateBaseForm, { type BaseFormField } from '@/app/baseComponents/BaseForm/CreateBaseForm';
import Dialog from '@/app/baseComponents/Dialog/Dialog';
import { useAlert } from '@/app/state/contexts/AlertContext';
import { useSubmitLock } from '@/app/state/hooks/useSubmitLock';
import { createPallet, type CreatePalletInput } from '@/app/actions/pallets';
import { PalletStatus } from '@/data/entities/Pallet';
import { getPalletStatusLabel } from '@/app/home/dispatch/pallets/ui/PalletStatusBadge';

interface CreatePalletDialogProps {
  open: boolean;
  onClose: () => void;
  trayId: string;
  onSuccess: () => void;
}

export default function CreatePalletDialog({ open, onClose, trayId, onSuccess }: CreatePalletDialogProps) {
  const { showAlert } = useAlert();
  const { isSubmitting, run } = useSubmitLock();
  const [errors, setErrors] = useState<string[]>([]);

  const [values, setValues] = useState({
    capacity: '240',
    weight: '0',
  });

  const handleChange = (field: string, value: any) => {
    setValues((prev) => ({
      ...prev,
      [field]: String(value ?? ''),
    }));
  };

  const handleSubmit = async () => {
    const validationErrors: string[] = [];

    if (!values.capacity || Number(values.capacity) <= 0) {
      validationErrors.push('La capacidad debe ser mayor a 0');
    }

    if (values.weight === '' || Number(values.weight) < 0) {
      validationErrors.push('El peso inicial debe ser mayor o igual a 0');
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);

    const payload: CreatePalletInput = {
      trayId,
      capacity: Number(values.capacity),
      weight: Number(values.weight),
      dispatchWeight: 0,
      status: PalletStatus.AVAILABLE,
      traysQuantity: 0,
    };

    const result = await run(async () => {
      try {
        const createResult = await createPallet(payload);

        if (createResult.success) {
          showAlert({ message: `Pallet creado exitosamente (${getPalletStatusLabel(PalletStatus.AVAILABLE)})`, type: 'success', duration: 4000 });
          setValues({
            capacity: '240',
            weight: '0',
          });
          return { ok: true };
        }

        const errorMessage = createResult.error || 'Error al crear el pallet';
        showAlert({ message: errorMessage, type: 'error', duration: 5000 });
        setErrors([errorMessage]);
        return { ok: false };
      } catch (error) {
        console.error('[CreatePalletDialog] Error creando pallet:', error);
        const errorMessage = 'Error inesperado al crear el pallet';
        showAlert({ message: errorMessage, type: 'error', duration: 5000 });
        setErrors([errorMessage]);
        return { ok: false };
      }
    });

    if (result?.ok) {
      onClose();
      onSuccess();
    }
  };

  const fields: BaseFormField[] = [
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
    },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Crear Pallet"
      size="sm"
      showCloseButton
    >
      <CreateBaseForm
        fields={fields}
        values={values}
        onChange={handleChange}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitLabel="Crear Pallet"
        cancelButton
        cancelButtonText="Cancelar"
        onCancel={onClose}
        errors={errors}
      />
    </Dialog>
  );
}
