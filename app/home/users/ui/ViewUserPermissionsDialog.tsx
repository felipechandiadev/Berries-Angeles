'use client';

import React, { useMemo } from 'react';
import Dialog from '@/app/baseComponents/Dialog/Dialog';
import { Button } from '@/app/baseComponents/Button/Button';
import { usePermissions } from '@/app/state/hooks/usePermissions';
import {
  PERMISSION_DEFINITIONS,
  groupPermissionsByCategory,
} from '@/lib/permissions';

interface ViewUserPermissionsDialogProps {
  open: boolean;
  onClose: () => void;
  userName: string;
}

const ViewUserPermissionsDialog: React.FC<ViewUserPermissionsDialogProps> = ({
  open,
  onClose,
  userName,
}) => {
  const { permissions, isLoading } = usePermissions();

  const assignedSet = useMemo(() => new Set(permissions), [permissions]);

  const groups = useMemo(
    () => groupPermissionsByCategory(PERMISSION_DEFINITIONS),
    [],
  );

  return (
    <Dialog open={open} onClose={onClose} title={`Permisos de ${userName}`} size="lg">
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="text-sm text-gray-500">Cargando permisos...</div>
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto space-y-5 pr-1">
            {groups.map((group) => {
              const assignedInCategory = group.permissions.filter((d) =>
                assignedSet.has(d.ability),
              ).length;
              return (
                <div key={group.category}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-foreground">
                      {group.categoryLabel}
                    </h3>
                    <span className="text-xs text-secondary">
                      {assignedInCategory}/{group.permissions.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {group.permissions.map((def) => {
                      const hasPermission = assignedSet.has(def.ability);
                      return (
                        <div
                          key={def.ability}
                          className={`flex flex-col gap-1 p-3 rounded-lg border ${
                            hasPermission
                              ? 'bg-green-50 border-green-200'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-medium text-gray-900 text-sm leading-snug">
                              {def.label}
                            </div>
                            {hasPermission ? (
                              <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-800">
                                Asignado
                              </span>
                            ) : (
                              <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-800">
                                No
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-600 leading-snug">
                            {def.description}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-gray-200">
          <Button onClick={onClose} variant="secondary">
            Cerrar
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

export default ViewUserPermissionsDialog;
