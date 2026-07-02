'use client';

import { useState, useEffect } from 'react';
import CreateBaseForm from '@/app/baseComponents/BaseForm/CreateBaseForm';
import { useAlert } from '@/app/state/contexts/AlertContext';
import { createProducer } from '@/app/actions/producers';
import { getProductiveUnitsSimpleList } from '@/app/actions/productiveUnits';
import type { AccountTypeName, BankName, PersonBankAccount } from '@/data/entities/Person';

interface CreateProducerButtonProps {
  onSuccess: () => void;
  onClose?: () => void;
}

const ACCOUNT_TYPE_OPTIONS = [
  { id: 'Cuenta Corriente', label: 'Cuenta Corriente' },
  { id: 'Cuenta de Ahorro', label: 'Cuenta de Ahorro' },
  { id: 'Cuenta Vista', label: 'Cuenta Vista' },
  { id: 'Cuenta RUT', label: 'Cuenta RUT' },
  { id: 'Cuenta Chequera Electrónica', label: 'Cuenta Chequera Electrónica' },
  { id: 'Otro', label: 'Otro' },
];

const BANK_OPTIONS = [
  { id: 'Banco de Chile', label: 'Banco de Chile' },
  { id: 'Banco del Estado de Chile', label: 'Banco del Estado de Chile' },
  { id: 'Banco Santander Chile', label: 'Banco Santander Chile' },
  { id: 'Banco de Crédito e Inversiones', label: 'Banco de Crédito e Inversiones' },
  { id: 'Banco Falabella', label: 'Banco Falabella' },
  { id: 'Banco Security', label: 'Banco Security' },
  { id: 'Banco CrediChile', label: 'Banco CrediChile' },
  { id: 'Banco Itaú Corpbanca', label: 'Banco Itaú Corpbanca' },
  { id: 'Scotiabank Chile', label: 'Scotiabank Chile' },
  { id: 'Banco Consorcio', label: 'Banco Consorcio' },
  { id: 'Banco Ripley', label: 'Banco Ripley' },
  { id: 'Banco Internacional', label: 'Banco Internacional' },
  { id: 'Banco BICE', label: 'Banco BICE' },
  { id: 'Banco Paris', label: 'Banco Paris' },
  { id: 'Banco Mercado Pago', label: 'Banco Mercado Pago' },
  { id: 'Otro', label: 'Otro' },
];

export default function CreateProducerButton({ onSuccess, onClose }: CreateProducerButtonProps) {
  const { showAlert } = useAlert();
  const [values, setValues] = useState({
    name: '',
    dni: '',
    mail: '',
    phone: '',
    productiveUnitId: '',
    bankAccountType: '',
    bankName: '',
    bankAccountNumber: '',
    bankAccountAlias: '',
    bankAccountIsPrimary: false,
  });
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
    loadProductiveUnits();
  }, []);

  const handleChange = (field: string, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
  };

  const validate = (values: Record<string, any>): string[] => {
    const errors: string[] = [];

    if (!values.name?.trim()) {
      errors.push('Name is required');
    }

    if (!values.dni?.trim()) {
      errors.push('DNI is required');
    }

    if (!values.productiveUnitId?.trim()) {
      errors.push('Productive unit is required');
    }

    const hasBankAccountInput = values.bankAccountType || values.bankName || values.bankAccountNumber;
    if (hasBankAccountInput) {
      if (!values.bankAccountType) {
        errors.push('Account type is required when adding a bank account');
      }
      if (!values.bankName) {
        errors.push('Bank is required when adding a bank account');
      }
      if (!values.bankAccountNumber?.trim()) {
        errors.push('Account number is required when adding a bank account');
      }
    }

    return errors;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const hasBankAccount = Boolean(
        values.bankAccountType && values.bankName && values.bankAccountNumber?.trim()
      );

      let bankAccounts: PersonBankAccount[] | undefined;
      if (hasBankAccount) {
        const account: PersonBankAccount = {
          accountType: values.bankAccountType as AccountTypeName,
          bank: values.bankName as BankName,
          accountNumber: values.bankAccountNumber.trim(),
        };

        const alias = values.bankAccountAlias?.trim();
        if (alias) {
          account.alias = alias;
        }

        account.isPrimary = Boolean(values.bankAccountIsPrimary);

        bankAccounts = [account];
      }

      const payload: Parameters<typeof createProducer>[0] = {
        name: values.name,
        dni: values.dni,
        mail: values.mail || undefined,
        phone: values.phone || undefined,
        productiveUnitId: values.productiveUnitId,
        bankAccounts,
      };

      const result = await createProducer(payload);

      if (result.success) {
        showAlert({
          message: 'Producer created successfully',
          type: 'success',
          duration: 4000,
        });
        setValues({
          name: '',
          dni: '',
          mail: '',
          phone: '',
          productiveUnitId: '',
          bankAccountType: '',
          bankName: '',
          bankAccountNumber: '',
          bankAccountAlias: '',
          bankAccountIsPrimary: false,
        });
        onClose?.();
        onSuccess();
      } else {
        showAlert({
          message: result.error || 'Error creating producer',
          type: 'error',
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('Error creating producer:', error);
      showAlert({
        message: 'Error creating producer',
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
    {
      name: 'bankAccountType',
      label: 'Account Type',
      type: 'select' as const,
      required: false,
      options: ACCOUNT_TYPE_OPTIONS,
    },
    {
      name: 'bankName',
      label: 'Bank',
      type: 'select' as const,
      required: false,
      options: BANK_OPTIONS,
    },
    { name: 'bankAccountNumber', label: 'Account Number', type: 'text' as const, required: false },
    { name: 'bankAccountAlias', label: 'Alias (optional)', type: 'text' as const, required: false },
    {
      name: 'bankAccountIsPrimary',
      label: 'Primary Account',
      type: 'switch' as const,
      required: false,
    },
  ];

  return (
    <CreateBaseForm
      fields={fields}
      values={values}
      onChange={handleChange}
      onSubmit={handleSubmit}
      validate={validate}
      isSubmitting={isSubmitting}
    />
  );
}

