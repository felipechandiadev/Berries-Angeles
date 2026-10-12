'use client';
import { useState } from "react";
import { CollectionPageLayout } from "@felipechandiadev/ui";
import BankAccountCard from "./BankAccountCard";
import CreateBankAccountDialog from "./CreateBankAccountDialog";
import PaymentBankConfigSection from "./PaymentBankConfigSection";
import IconButton from '@/app/baseComponents/IconButton/IconButton';

export interface BankAccountType {
  id: string;
  accountType: string;
  bank: string;
  accountNumber: string;
  alias?: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string | null;
}

export interface ListBankAccountsProps {
  bankAccounts: BankAccountType[];
  requireBankAccountsInPayments: boolean;
}

const ListBankAccounts: React.FC<ListBankAccountsProps> = ({
  bankAccounts,
  requireBankAccountsInPayments,
}) => {
  const [openCreateDialog, setOpenCreateDialog] = useState(false);

  return (
    <>
      <PaymentBankConfigSection
        requireBankAccountsInPayments={requireBankAccountsInPayments}
      />
      <CollectionPageLayout
        title="Cuentas bancarias"
        showSearch
        searchParamName="search"
        searchLabel="Buscar"
        searchPlaceholder="Buscar cuenta bancaria..."
        addAction={
          <IconButton
            icon="add"
            variant="outlined"
            aria-label="Agregar cuenta bancaria"
            onClick={() => setOpenCreateDialog(true)}
            data-test-id="bank-accounts-add-button"
          />
        }
        contentItems={bankAccounts.map((bankAccount) => (
          <BankAccountCard
            key={bankAccount.id}
            bankAccount={bankAccount}
            data-test-id={`bank-account-card-${bankAccount.id}`}
          />
        ))}
        contentGridColumns={{ default: 1, sm: 2, lg: 3 }}
        contentGridGapClassName="gap-6"
        contentEmptyMessage="No hay cuentas bancarias para mostrar."
        data-test-id="bank-accounts-list-container"
      />
      <CreateBankAccountDialog
        open={openCreateDialog}
        onClose={() => setOpenCreateDialog(false)}
        data-test-id="bank-accounts-create-dialog"
      />
    </>
  );
};

export default ListBankAccounts;
