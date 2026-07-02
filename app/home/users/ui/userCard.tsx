'use client';
import React, { useState } from 'react';
import Badge from '@/app/baseComponents/Badge/Badge';
import IconButton from '@/app/baseComponents/IconButton/IconButton';
import { Button } from '@/app/baseComponents/Button/Button';
import DeleteUserDialog from './DeleteUserDialog';
import UpdateUserDialog from './UpdateUserDialog';
import ManageUserPermissionsDialog from './ManageUserPermissionsDialog';
import { usePermissions } from '@/app/state/hooks/usePermissions';

export interface UserCardProps {
  user: {
    id: string;
    userName: string;
    mail: string;
    phone?: string;
    rol?: string;
    person?: {
      name?: string;
      dni?: string;
    };
  };
  'data-test-id'?: string;
}

const UserCard: React.FC<UserCardProps> = ({ user, 'data-test-id': dataTestId }) => {
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [openPermissionsDialog, setOpenPermissionsDialog] = useState(false);
  const fullName = user.person?.name || user.userName || user.mail;
  const isAdmin = user.userName === 'admin';
  const { has } = usePermissions();
  const canUpdate = has('USERS_UPDATE');
  const canDelete = has('USERS_DELETE');
  const canManagePermissions = has('USERS_UPDATE');

  const getRolBadgeVariant = (rol?: string): 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' | 'primary-outlined' | 'secondary-outlined' | 'success-outlined' | 'error-outlined' | 'warning-outlined' | 'info-outlined' => {
    switch (rol?.toUpperCase()) {
      case 'ADMIN':
        return 'error-outlined';
      case 'OPERATOR':
        return 'info-outlined';
      default:
        return 'secondary-outlined';
    }
  };

  const getRolLabel = (rol?: string): string => {
    switch (rol?.toUpperCase()) {
      case 'ADMIN':
        return 'Administrador';
      case 'OPERATOR':
        return 'Operador';
      default:
        return rol || 'Sin rol';
    }
  };

  return (
    <article className="border border-neutral-200 bg-white rounded-lg shadow-sm p-4 flex flex-col justify-between min-w-[260px]" data-test-id={dataTestId}>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-6 md:gap-4 items-stretch">
        {/* Columna del Avatar */}
        <div className="flex justify-center items-center h-full md:h-full md:justify-center md:items-center" data-test-id={`${dataTestId}-avatar`}>
          <div className="relative flex-shrink-0 mx-auto">
            <div className="h-24 w-24 rounded-full bg-neutral-100 border-4 border-secondary flex items-center justify-center overflow-hidden">
              <span className="material-symbols-outlined text-secondary" style={{ fontSize: '4rem' }}>person</span>
            </div>
          </div>
        </div>

        {/* Columna de Información */}
        <div className="flex flex-col gap-4 sm:gap-2 w-full overflow-hidden" data-test-id={`${dataTestId}-info`}>
          {/* Nombre */}
          <h3 className="text-lg font-semibold text-foreground truncate break-all" data-test-id={`${dataTestId}-name`}>{fullName}</h3>

          {/* Nombre de usuario */}
          <p className="text-xs font-light text-neutral-600 truncate break-all" data-test-id={`${dataTestId}-username`}>@{user.userName}</p>

          {/* Correo con icono */}
          {!isAdmin && (
            <div className="flex items-center gap-2" data-test-id={`${dataTestId}-email`}>
              <span className="material-symbols-outlined text-neutral-500" style={{ fontSize: '0.875rem' }}>email</span>
              <p className="text-xs font-light text-neutral-500 truncate break-all">{user.mail}</p>
            </div>
          )}

          {/* Teléfono con icono */}
          {user.phone && (
            <div className="flex items-center gap-2" data-test-id={`${dataTestId}-phone`}>
              <span className="material-symbols-outlined text-neutral-500" style={{ fontSize: '0.875rem' }}>phone</span>
              <p className="text-xs font-light text-neutral-500 truncate break-all">{user.phone}</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center mt-2 gap-3" data-test-id={`${dataTestId}-actions`}>
        {/* Badge en la esquina izquierda */}
        <div className="flex items-center gap-2" data-test-id={`${dataTestId}-role-badge`}>
          {user.rol && (
            <Badge variant={getRolBadgeVariant(user.rol)} data-test-id={`${dataTestId}-badge`}>
              {getRolLabel(user.rol)}
            </Badge>
          )}
          {canManagePermissions && !isAdmin && (
            <Button
              variant="outlined"
              className="px-3 py-1 rounded-full text-xs"
              onClick={() => setOpenPermissionsDialog(true)}
              data-test-id={`${dataTestId}-permissions-button`}
            >
              Gestionar permisos
            </Button>
          )}
        </div>
        {/* Botones en la esquina derecha */}
        <div className="flex items-center" data-test-id={`${dataTestId}-buttons`}>
          <IconButton 
            icon="edit"
            variant="basicSecondary"
            aria-label={`Editar usuario ${fullName}`}
            onClick={() => !isAdmin && canUpdate && setOpenUpdateDialog(true)}
            disabled={isAdmin || !canUpdate}
            data-test-id={`${dataTestId}-edit-button`}
          />
          <IconButton 
            icon="delete"
            variant='basicSecondary'
            aria-label={`Eliminar usuario ${fullName}`}
            onClick={() => !isAdmin && canDelete && setOpenDeleteDialog(true)}
            disabled={isAdmin || !canDelete}
            data-test-id={`${dataTestId}-delete-button`}
          />
        </div>
      </div>

      <DeleteUserDialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        user={{ ...user, rol: user.rol ?? '' }}
        data-test-id={`${dataTestId}-delete-dialog`}
      />

      <UpdateUserDialog
        open={openUpdateDialog}
        onClose={() => setOpenUpdateDialog(false)}
        user={{ ...user, rol: user.rol ?? '' }}
        data-test-id={`${dataTestId}-update-dialog`}
      />

      <ManageUserPermissionsDialog
        open={openPermissionsDialog}
        onClose={() => setOpenPermissionsDialog(false)}
        userId={user.id}
        userName={fullName}
        data-test-id={`${dataTestId}-permissions-dialog`}
      />

    </article>
  );
};

export default UserCard;
