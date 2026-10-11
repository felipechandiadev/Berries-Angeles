'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Dialog from '@/app/baseComponents/Dialog/Dialog';
import CreateBaseForm, { BaseFormFieldGroup } from '@/app/baseComponents/BaseForm/CreateBaseForm';
import { useAlert } from '@/app/state/hooks/useAlert';
import { useSubmitLock } from '@/app/state/hooks/useSubmitLock';
import { createVariety } from '@/app/actions/varieties';
import { Currency } from '../../../../../data/entities/Variety';

interface CreateVarietyDialogProps {
  open: boolean;
  onClose: () => void;
}

const CreateVarietyDialog: React.FC<CreateVarietyDialogProps> = ({ open, onClose }) => {
  const router = useRouter();
  const { success, error } = useAlert();
  const { data: session } = useSession();
  const currentUserId = (session?.user as any)?.id;
  const { isSubmitting, run } = useSubmitLock();
  const [errors, setErrors] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    priceCLP: '0',
    priceUSD: '0',
    currency: Currency.CLP,
  });

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
          required: true
        },
        {
          name: 'priceCLP',
          label: 'Precio CLP',
          type: 'currency',
          required: true,
          min: 0
        },
        {
          name: 'priceUSD',
          label: 'Precio USD',
          type: 'currency',
          required: true,
          min: 0
        },
        {
          name: 'currency',
          label: 'Moneda principal',
          type: 'select',
          required: true,
          options: [
            { id: Currency.CLP, label: 'CLP - Peso Chileno' },
            { id: Currency.USD, label: 'USD - Dólar Americano' }
          ]
        }
      ]
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
        const res = await createVariety({
          name: formData.name,
          priceCLP: Number(formData.priceCLP),
          priceUSD: Number(formData.priceUSD),
          currency: formData.currency,
        }, currentUserId);

        if (!res.success) {
          error(res.error || 'Error al crear la variedad');
          if (res.error) {
            setErrors([res.error]);
          }
          return { ok: false };
        }

        success(res.message || 'Variedad creada exitosamente');
        return { ok: true };
      } catch (err: any) {
        console.error('Error creating variety:', err);
        error('Error inesperado al crear la variedad');
        setErrors(['Error inesperado al crear la variedad']);
        return { ok: false };
      }
    });

    if (result?.ok) {
      onClose();
      setFormData({
        name: '',
        priceCLP: '0',
        priceUSD: '0',
        currency: Currency.CLP,
      });
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setErrors([]);
      setFormData({
        name: '',
        priceCLP: '0',
        priceUSD: '0',
        currency: Currency.CLP,
      });
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Crear Nueva Variedad"
      maxWidth="md"
      data-test-id="create-variety-dialog"
    >
      <CreateBaseForm
        fields={formFields}
        values={formData}
        onChange={handleChange}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitLabel="Crear Variedad"
        cancelButtonText="Cancelar"
        onCancel={handleClose}
        errors={errors}
        data-test-id="create-variety-form"
      />
    </Dialog>
  );
};

export default CreateVarietyDialog;