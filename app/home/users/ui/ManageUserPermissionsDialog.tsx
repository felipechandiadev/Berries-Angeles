'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSubmitLock } from '@/app/state/hooks/useSubmitLock';
import Dialog from '@/app/baseComponents/Dialog/Dialog';
import { Button } from '@/app/baseComponents/Button/Button';
import DotProgress from '@/app/baseComponents/DotProgress/DotProgress';
import {
  PERMISSION_DEFINITIONS,
  PermissionDefinition,
  AbilityValue,
  groupPermissionsByCategory,
} from '@/lib/permissions';
import { getUserPermissions, updateUserPermissions } from '@/app/actions/permissions';
import { useSession } from 'next-auth/react';

interface ManageUserPermissionsDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  onUpdated?: (abilities: AbilityValue[]) => void;
  'data-test-id'?: string;
}

type DragSource = 'available' | 'assigned';

type DragState = {
  ability: AbilityValue;
  source: DragSource;
} | null;

const ManageUserPermissionsDialog: React.FC<ManageUserPermissionsDialogProps> = ({
  open,
  onClose,
  userId,
  userName,
  onUpdated,
  'data-test-id': dataTestId,
}) => {
  const [assignedAbilities, setAssignedAbilities] = useState<AbilityValue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isSubmitting: isSaving, run } = useSubmitLock();
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState<DragState>(null);
  const [search, setSearch] = useState('');
  const { data: session, update: updateSession } = useSession();

  useEffect(() => {
    if (!open || !userId) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setSearch('');

    getUserPermissions(userId)
      .then((abilities) => {
        if (Array.isArray(abilities)) {
          setAssignedAbilities(
            abilities.filter(
              (ability): ability is AbilityValue => typeof ability === 'string',
            ),
          );
        } else {
          setAssignedAbilities([]);
        }
      })
      .catch((loadError) => {
        console.error('[ManageUserPermissionsDialog] Error loading permissions:', loadError);
        setAssignedAbilities([]);
        setError('No se pudieron cargar los permisos del usuario.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [open, userId]);

  useEffect(() => {
    if (!open) {
      setDragging(null);
    }
  }, [open]);

  const assignedSet = useMemo(() => new Set(assignedAbilities), [assignedAbilities]);

  const filterDef = (definition: PermissionDefinition) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      definition.label.toLowerCase().includes(q) ||
      definition.description.toLowerCase().includes(q) ||
      definition.ability.toLowerCase().includes(q)
    );
  };

  const availableGroups = useMemo(() => {
    const defs = PERMISSION_DEFINITIONS.filter(
      (definition) => !assignedSet.has(definition.ability) && filterDef(definition),
    );
    return groupPermissionsByCategory(defs);
  }, [assignedSet, search]);

  const assignedGroups = useMemo(() => {
    const defs = PERMISSION_DEFINITIONS.filter(
      (definition) => assignedSet.has(definition.ability) && filterDef(definition),
    );
    return groupPermissionsByCategory(defs);
  }, [assignedSet, search]);

  const availableCount = useMemo(
    () => availableGroups.reduce((s, g) => s + g.permissions.length, 0),
    [availableGroups],
  );

  const handleMoveAbility = (ability: AbilityValue, target: DragSource) => {
    setAssignedAbilities((current) => {
      const hasAbility = current.includes(ability);

      if (target === 'assigned') {
        if (hasAbility) {
          return current;
        }
        return [...current, ability];
      }

      if (!hasAbility) {
        return current;
      }

      return current.filter((currentAbility) => currentAbility !== ability);
    });
  };

  const handleDrop = (target: DragSource) => (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (!dragging) {
      return;
    }

    if (dragging.source === target) {
      setDragging(null);
      return;
    }

    handleMoveAbility(dragging.ability, target);
    setDragging(null);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleSave = async () => {
    setError(null);

    const result = await run(async () => {
      const response = await updateUserPermissions({
        userId,
        abilities: assignedAbilities,
      });

      if (!response?.success) {
        setError(response?.message || 'Error al guardar los permisos.');
        return { ok: false };
      }

      if (updateSession) {
        await updateSession({
          user: {
            ...(session?.user || {}),
            permissions: assignedAbilities,
          },
        } as any);
      }

      if (onUpdated) {
        onUpdated(assignedAbilities);
      }

      return { ok: true };
    });

    if (result?.ok) {
      onClose();
    }
  };

  const handleReset = () => {
    setAssignedAbilities([]);
  };

  const handleAssignAllVisible = () => {
    const toAdd = availableGroups.flatMap((g) => g.permissions.map((p) => p.ability));
    setAssignedAbilities((current) => Array.from(new Set([...current, ...toAdd])));
  };

  const renderPermissionCard = (definition: PermissionDefinition, source: DragSource) => (
    <div
      key={definition.ability}
      className="border border-neutral-200 rounded-md p-2.5 bg-white shadow-sm cursor-grab active:cursor-grabbing"
      draggable
      onDragStart={() => setDragging({ ability: definition.ability, source })}
      onDragEnd={() => setDragging(null)}
      data-test-id={`permission-card-${definition.ability}`}
    >
      <p className="font-semibold text-sm text-foreground">{definition.label}</p>
      <p className="text-[11px] text-neutral-500 mt-0.5 leading-snug">
        {definition.description}
      </p>
    </div>
  );

  const renderGroupedColumn = (
    groups: ReturnType<typeof groupPermissionsByCategory>,
    source: DragSource,
    emptyMessage: string,
  ) => {
    if (groups.length === 0) {
      return (
        <p className="text-xs text-neutral-400 text-center mt-4">{emptyMessage}</p>
      );
    }

    return groups.map((group) => (
      <div key={`${source}-${group.category}`} className="flex flex-col gap-2">
        <div className="sticky top-0 z-[1] -mx-1 px-1 py-1 bg-neutral-50/95 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-2">
            <h5 className="text-sm font-semibold text-primary">{group.categoryLabel}</h5>
            <span className="text-[10px] text-neutral-500">{group.permissions.length}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {group.permissions.map((definition) =>
            renderPermissionCard(definition, source),
          )}
        </div>
      </div>
    ));
  };

  const dialogActions = (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
      <div className="flex items-center gap-2 text-xs text-neutral-500">
        <span className="material-symbols-outlined text-base text-neutral-500">info</span>
        Arrastra un permiso entre las columnas para asignarlo o quitarlo.
      </div>
      <div className="flex justify-end gap-2 flex-wrap">
        <Button variant="text" className="text-sm" onClick={onClose} disabled={isSaving}>
          Cancelar
        </Button>
        <Button
          variant="outlined"
          className="text-sm"
          onClick={handleReset}
          disabled={isSaving || assignedAbilities.length === 0}
        >
          Limpiar
        </Button>
        <Button
          variant="outlined"
          className="text-sm"
          onClick={handleAssignAllVisible}
          disabled={isSaving || availableCount === 0}
        >
          Asignar visibles
        </Button>
        <Button
          variant="primary"
          className="text-sm"
          onClick={handleSave}
          loading={isSaving}
        >
          Guardar cambios
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Permisos de ${userName}`}
      size="xl"
      actions={dialogActions}
      data-test-id={dataTestId || 'manage-permissions-dialog'}
    >
      {isLoading ? (
        <div className="flex justify-center items-center h-48">
          <DotProgress />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {error && (
            <div className="text-sm text-red-600 border border-red-200 rounded-md bg-red-50 px-3 py-2">
              {error}
            </div>
          )}

          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, descripción o código…"
            className="w-full rounded-md border border-border px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary"
            data-test-id="permissions-search"
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div
              onDrop={handleDrop('available')}
              onDragOver={handleDragOver}
              className="border border-neutral-200 rounded-lg p-4 bg-neutral-50 min-h-[320px] max-h-[60vh] flex flex-col gap-3"
            >
              <div className="flex items-center justify-between shrink-0">
                <h4 className="text-sm font-semibold text-foreground">Permisos disponibles</h4>
                <span className="text-xs text-neutral-500">{availableCount}</span>
              </div>
              <p className="text-xs text-neutral-500 leading-snug shrink-0">
                Clasificados por categoría. Arrastra al panel derecho para asignar.
              </p>
              <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">
                {renderGroupedColumn(
                  availableGroups,
                  'available',
                  search
                    ? 'Sin resultados en disponibles.'
                    : 'Todos los permisos ya están asignados.',
                )}
              </div>
            </div>

            <div
              onDrop={handleDrop('assigned')}
              onDragOver={handleDragOver}
              className="border border-neutral-200 rounded-lg p-4 bg-neutral-50 min-h-[320px] max-h-[60vh] flex flex-col gap-3"
            >
              <div className="flex items-center justify-between shrink-0">
                <h4 className="text-sm font-semibold text-foreground">Permisos asignados</h4>
                <span className="text-xs text-neutral-500">{assignedAbilities.length}</span>
              </div>
              <p className="text-xs text-neutral-500 leading-snug shrink-0">
                Arrastra al panel izquierdo para quitar del usuario.
              </p>
              <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">
                {renderGroupedColumn(
                  assignedGroups,
                  'assigned',
                  search
                    ? 'Sin resultados en asignados.'
                    : 'El usuario aún no tiene permisos asignados.',
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Dialog>
  );
};

export default ManageUserPermissionsDialog;
