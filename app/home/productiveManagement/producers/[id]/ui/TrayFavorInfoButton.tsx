'use client';

import { useState } from 'react';
import Dialog from '@/app/baseComponents/Dialog/Dialog';
import IconButton from '@/app/baseComponents/IconButton/IconButton';
import { Button } from '@/app/baseComponents/Button/Button';

export function TrayFavorInfoButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <IconButton
        icon="Info"
        variant="basicSecondary"
        size="xs"
        title="Qué significa a favor"
        ariaLabel="Qué significa bandejas a favor"
        onClick={() => setOpen(true)}
        data-test-id="tray-favor-info-button"
      />
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Bandejas a favor"
        size="sm"
      >
        <div className="space-y-3 text-sm text-foreground">
          <p>
            <strong>A favor</strong> significa que el productor devolvió o entregó más bandejas de
            las que se le prestaron o entregaron. El saldo queda a su crédito.
          </p>
          <p className="text-muted-foreground">
            <strong>Debe</strong> es lo contrario: tiene bandejas de la operación en su poder y aún
            no las ha devuelto.
          </p>
          <div className="flex justify-end pt-2">
            <Button variant="primary" onClick={() => setOpen(false)}>
              Entendido
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
