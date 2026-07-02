'use client';
import React, { useState } from 'react';
import Badge from '@/app/baseComponents/Badge/Badge';
import IconButton from '@/app/baseComponents/IconButton/IconButton';
import DeleteFormatDialog from './DeleteFormatDialog';
import UpdateFormatDialog from './UpdateFormatDialog';

export interface FormatCardProps {
  format: {
    id: number;
    name: string;
    description?: string;
    active: boolean;
  };
  'data-test-id'?: string;
}

const FormatCard: React.FC<FormatCardProps> = ({ format, 'data-test-id': dataTestId }) => {
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);

  return (
    <article className="border border-neutral-200 bg-white rounded-lg shadow-sm p-4 flex flex-col justify-between min-w-[260px]" data-test-id={dataTestId}>
      {/* Información principal */}
      <div className="flex flex-col gap-2 w-full overflow-hidden mb-2">
        <h3 className="text-lg font-semibold text-foreground truncate break-all" data-test-id={`${dataTestId}-name`}>
          {format.name}
        </h3>
        <div className="flex flex-col gap-1">
          <div className="text-sm text-gray-700 text-left truncate">
            {format.description || 'Sin descripción'}
          </div>
        </div>
      </div>

      {/* Acciones y badge en la parte inferior */}
      <div className="flex justify-between items-center mt-4" data-test-id={`${dataTestId}-actions-row`}>
        {/* Badge estado a la izquierda */}
        <div data-test-id={`${dataTestId}-status-badge`}>
          <Badge
            variant={format.active ? 'success' : 'error'}
            className="mb-0"
          >
            {format.active ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>
        {/* IconButtons a la derecha */}
        <div className="flex gap-2" data-test-id={`${dataTestId}-buttons`}>
          <IconButton
            icon="edit"
            variant="basicSecondary"
            aria-label={`Editar formato ${format.name}`}
            onClick={() => setOpenUpdateDialog(true)}
            data-test-id={`${dataTestId}-edit-button`}
          />
          <IconButton
            icon="delete"
            variant="basicSecondary"
            aria-label={`Eliminar formato ${format.name}`}
            onClick={() => setOpenDeleteDialog(true)}
            data-test-id={`${dataTestId}-delete-button`}
          />
        </div>
      </div>

      <UpdateFormatDialog
        open={openUpdateDialog}
        onClose={() => setOpenUpdateDialog(false)}
        format={format}
        data-test-id={`${dataTestId}-update-dialog`}
      />

      <DeleteFormatDialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        format={format}
        data-test-id={`${dataTestId}-delete-dialog`}
      />
    </article>
  );
};

export default FormatCard;