'use client';

import React from 'react';
import Dialog from '@/app/baseComponents/Dialog/Dialog';
import { Button } from '@/app/baseComponents/Button/Button';
import { usePermissions } from '@/app/state/hooks/usePermissions';
import { PERMISSION_DEFINITIONS, PermissionDefinition } from '@/lib/permissions';

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

  const groupedPermissions = React.useMemo(() => {
    const groups: Record<string, PermissionDefinition[]> = {};

    PERMISSION_DEFINITIONS.forEach((def) => {
      const category = def.ability.split('_')[0].toLowerCase(); // Extract category from ability name
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(def);
    });

    return groups;
  }, []);

  return (
    <Dialog open={open} onClose={onClose} title={`Permisos de ${userName}`}>
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="text-sm text-gray-500">Cargando permisos...</div>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {Object.entries(groupedPermissions).map(([category, defs]) => (
              <div key={category} className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 capitalize">
                  {category.replace(/([A-Z])/g, ' $1').trim()}
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {defs.map((def) => {
                    const hasPermission = permissions.includes(def.ability);
                    return (
                      <div
                        key={def.ability}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          hasPermission
                            ? 'bg-green-50 border-green-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {def.label}
                          </div>
                          <div className="text-sm text-gray-600">
                            {def.description}
                          </div>
                        </div>
                        <div className="ml-3">
                          {hasPermission ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✓ Asignado
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              ✗ No asignado
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
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