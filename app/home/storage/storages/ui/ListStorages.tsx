'use client';

import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CollectionPageLayout } from '@felipechandiadev/ui';
import { Storage } from '@/data/entities/Storage';
import StorageCard from './StorageCard';
import IconButton from '@/app/baseComponents/IconButton/IconButton';
import CreateStorageDialog from './CreateStorageDialog';
import UpdateStorageDialog from './UpdateStorageDialog';
import DeleteStorageDialog from './DeleteStorageDialog';

interface ListStoragesProps {
  storages: Storage[];
}

export function ListStorages({ storages }: ListStoragesProps) {
  const searchParams = useSearchParams();
  const search = (searchParams.get('search') || '').toLowerCase();
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [editingStorage, setEditingStorage] = useState<Storage | null>(null);
  const [deletingStorage, setDeletingStorage] = useState<Storage | null>(null);

  const filteredStorages = useMemo(
    () =>
      storages.filter(
        (storage) =>
          !search ||
          storage.name.toLowerCase().includes(search) ||
          storage.type.toLowerCase().includes(search) ||
          (storage.location && storage.location.toLowerCase().includes(search)),
      ),
    [storages, search],
  );

  return (
    <>
      <CollectionPageLayout
        title="Almacenes"
        showSearch
        searchParamName="search"
        searchLabel="Buscar"
        searchPlaceholder="Buscar almacenamiento..."
        addAction={
          <IconButton
            icon="add"
            variant="outlined"
            aria-label="Agregar almacenamiento"
            onClick={() => setOpenCreateDialog(true)}
            data-test-id="storages-add-button"
          />
        }
        contentItems={filteredStorages.map((storage) => (
          <StorageCard
            key={storage.id}
            storage={storage}
            onEdit={() => setEditingStorage(storage)}
            onDelete={() => setDeletingStorage(storage)}
            data-test-id={`storage-card-${storage.id}`}
          />
        ))}
        contentGridColumns={{ default: 1, sm: 2, lg: 3 }}
        contentGridGapClassName="gap-6"
        contentEmptyMessage="No hay almacenamientos para mostrar."
        data-test-id="storages-list-container"
      />

      <CreateStorageDialog
        open={openCreateDialog}
        onClose={() => setOpenCreateDialog(false)}
        data-test-id="storages-create-dialog"
      />

      {editingStorage && (
        <UpdateStorageDialog
          open={!!editingStorage}
          onClose={() => setEditingStorage(null)}
          storage={editingStorage}
          data-test-id="storages-update-dialog"
        />
      )}

      {deletingStorage && (
        <DeleteStorageDialog
          open={!!deletingStorage}
          onClose={() => setDeletingStorage(null)}
          storage={deletingStorage}
          data-test-id="storages-delete-dialog"
        />
      )}
    </>
  );
}

export default ListStorages;
