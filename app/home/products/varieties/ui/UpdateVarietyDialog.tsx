'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Dialog from '@/app/baseComponents/Dialog/Dialog';
import UpdateBaseForm, { BaseUpdateFormFieldGroup } from '@/app/baseComponents/BaseForm/UpdateBaseForm';
import { useAlert } from '@/app/state/hooks/useAlert';
import { updateVariety } from '@/app/actions/varieties';
import { Currency } from '../../../../../data/entities/Variety';

interface Variety {
  id: number;
  name: string;
  priceCLP: number;
  priceUSD: number;
  currency: Currency;
}

interface UpdateVarietyDialogProps {
  open: boolean;
  onClose: () => void;
  variety: Variety;
}

const UpdateVarietyDialog: React.FC<UpdateVarietyDialogProps> = ({ open, onClose, variety }) => {
  const router = useRouter();
  const { success, error } = useAlert();
  const { data: session } = useSession();
  const currentUserId = (session?.user as any)?.id;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: variety.name,
    priceCLP: variety.priceCLP,
    priceUSD: variety.priceUSD,
    currency: variety.currency,
  });

  const formFields: BaseUpdateFormFieldGroup[] = [
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
    setIsSubmitting(true);
    setErrors([]);

    try {
      const result = await updateVariety({
        id: variety.id,
        name: formData.name,
        priceCLP: Number(formData.priceCLP),
        priceUSD: Number(formData.priceUSD),
        currency: formData.currency,
      }, currentUserId);

      if (result.success) {
        success(result.message || 'Variedad actualizada exitosamente');
        onClose();
      } else {
        error(result.error || 'Error al actualizar la variedad');
        if (result.error) {
          setErrors([result.error]);
        }
      }
    } catch (err: any) {
      console.error('Error updating variety:', err);
      error('Error inesperado al actualizar la variedad');
      setErrors(['Error inesperado al actualizar la variedad']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setErrors([]);
      // Reset form data to original variety data
      setFormData({
        name: variety.name,
        priceCLP: variety.priceCLP,
        priceUSD: variety.priceUSD,
        currency: variety.currency,
      });
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Editar Variedad"
      maxWidth="md"
      data-test-id="update-variety-dialog"
    >
      <UpdateBaseForm
        fields={formFields}
        initialState={formData}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitLabel="Actualizar Variedad"
        cancelButtonText="Cancelar"
        onCancel={handleClose}
        errors={errors}
        data-test-id="update-variety-form"
      />
    </Dialog>
  );
};

export default UpdateVarietyDialog;