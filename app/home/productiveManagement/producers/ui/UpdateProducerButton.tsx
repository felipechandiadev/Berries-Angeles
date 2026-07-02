'use client';

import { useState, useEffect } from 'react';
import IconButton from '@/app/baseComponents/IconButton/IconButton';
import Dialog from '@/app/baseComponents/Dialog/Dialog';
import UpdateBaseForm from '@/app/baseComponents/BaseForm/UpdateBaseForm';
import { useAlert } from '@/app/state/contexts/AlertContext';
import { updateProducer } from '@/app/actions/producers';
import { getProductiveUnitsSimpleList } from '@/app/actions/productiveUnits';

interface Producer {
  id: string;
  name: string;
  dni: string;
  mail: string;
  phone: string;
  productiveUnitId: string;
  productiveUnit?: any;
  createdAt: Date;
  updatedAt: Date;
}

interface UpdateProducerButtonProps {
  producer: Producer;
  onSuccess: () => void;
}

export default function UpdateProducerButton({ producer, onSuccess }: UpdateProducerButtonProps) {
  const { showAlert } = useAlert();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productiveUnitOptions, setProductiveUnitOptions] = useState<{ id: string; label: string }[]>([]);

  useEffect(() => {
    const loadProductiveUnits = async () => {
      try {
        const result = await getProductiveUnitsSimpleList();
        if (result) {
          setProductiveUnitOptions(result.map(unit => ({ id: unit.id, label: unit.name })));
        }
      } catch (error) {
        console.error('Error loading productive units:', error);
      }
    };
    if (open) {
      loadProductiveUnits();
    }
  }, [open]);

  const handleSubmit = async (values: Record<string, any>) => {
    // Validate required fields
    if (!values.name?.trim()) {
      showAlert({
        message: 'Name is required',
        type: 'error',
        duration: 4000,
      });
      return;
    }

    if (!values.dni?.trim()) {
      showAlert({
        message: 'DNI is required',
        type: 'error',
        duration: 4000,
      });
      return;
    }

    if (values.productiveUnitId !== undefined && !values.productiveUnitId?.trim()) {
      showAlert({
        message: 'Productive unit is required',
        type: 'error',
        duration: 4000,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updateProducer({
        id: producer.id,
        name: values.name,
        dni: values.dni,
        mail: values.mail,
        phone: values.phone,
        productiveUnitId: values.productiveUnitId,
      });

      if (result.success) {
        showAlert({
          message: 'Producer updated successfully',
          type: 'success',
          duration: 4000,
        });
        setOpen(false);
        onSuccess();
      } else {
        showAlert({
          message: result.error || 'Error updating producer',
          type: 'error',
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('Error updating producer:', error);
      showAlert({
        message: 'Error updating producer',
        type: 'error',
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fields = [
    { name: 'name', label: 'Name', type: 'text' as const, required: true },
    { name: 'dni', label: 'DNI', type: 'dni' as const, required: true },
    { name: 'mail', label: 'Email', type: 'email' as const, required: false },
    { name: 'phone', label: 'Phone', type: 'text' as const, required: false },
    {
      name: 'productiveUnitId',
      label: 'Productive Unit',
      type: 'autocomplete' as const,
      required: true,
      options: productiveUnitOptions,
    },
  ];

  return (
    <>
      <IconButton
        icon="edit"
        variant="basicSecondary"
        size="sm"
        onClick={() => setOpen(true)}
        title="Edit"
      />
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Edit Producer"
        size="md"
      >
        <UpdateBaseForm
          fields={fields}
          initialState={producer as Record<string, any>}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          onCancel={() => setOpen(false)}
        />
      </Dialog>
    </>
  );
}
