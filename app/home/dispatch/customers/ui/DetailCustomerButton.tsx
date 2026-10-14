'use client';

import { useMemo, useState } from 'react';
import Dialog from '@/app/baseComponents/Dialog/Dialog';
import DotProgress from '@/app/baseComponents/DotProgress/DotProgress';
import { Button } from '@/app/baseComponents/Button/Button';
import IconButton from '@/app/baseComponents/IconButton/IconButton';
import CustomerDetailLayout from './detail/CustomerDetailLayout';
import { useCustomerDetail } from './detail/useCustomerDetail';

interface CustomerRow {
  id: string;
  name: string;
  dni: string;
  mail: string;
  phone: string;
  personId: string;
}

interface DetailCustomerButtonProps {
  customer: CustomerRow;
  onSuccess?: () => void;
}

export default function DetailCustomerButton({
  customer,
  onSuccess,
}: DetailCustomerButtonProps) {
  const [open, setOpen] = useState(false);
  const { data, loading, error, refetch } = useCustomerDetail({
    customerId: customer.id,
    open,
  });

  const buttonTitle = useMemo(() => {
    return `Ver detalle · ${customer.name}`;
  }, [customer.name]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleRefresh = async () => {
    await refetch();
    onSuccess?.();
  };

  const handleDeleted = () => {
    setOpen(false);
    onSuccess?.();
  };

  return (
    <div className="inline-flex items-center">
      <IconButton
        icon="more_horiz"
        variant="basicSecondary"
        size="xs"
        title={buttonTitle}
        ariaLabel={buttonTitle}
        onClick={handleOpen}
      />
      <Dialog
        open={open}
        onClose={handleClose}
        title=""
        size="custom"
        maxWidth="1280px"
        fullWidth
        scroll="paper"
        showCloseButton
        onCloseButtonClick={handleClose}
        contentStyle={{ height: '85vh', display: 'flex', flexDirection: 'column' }}
        hideActions
      >
        {loading && !data && (
          <div className="flex flex-1 items-center justify-center">
            <DotProgress />
          </div>
        )}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <p className="max-w-md text-sm text-red-600">{error}</p>
            <div className="flex gap-2">
              <Button variant="outlined" onClick={() => refetch()}>
                Reintentar
              </Button>
              <Button variant="secondary" onClick={handleClose}>
                Cerrar
              </Button>
            </div>
          </div>
        )}
        {data && (
          <CustomerDetailLayout
            data={data}
            onRefresh={handleRefresh}
            onDeleted={handleDeleted}
          />
        )}
      </Dialog>
    </div>
  );
}
