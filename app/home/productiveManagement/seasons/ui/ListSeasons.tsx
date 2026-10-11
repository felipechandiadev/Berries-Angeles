'use client';

import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CollectionPageLayout } from '@felipechandiadev/ui';
import { Season } from '@/data/entities/Season';
import SeasonCard from './SeasonCard';
import IconButton from '@/app/baseComponents/IconButton/IconButton';
import CreateSeasonDialog from './CreateSeasonDialog';
import UpdateSeasonDialog from './UpdateSeasonDialog';
import DeleteSeasonDialog from './DeleteSeasonDialog';

interface ListSeasonsProps {
  seasons: Season[];
}

export function ListSeasons({ seasons }: ListSeasonsProps) {
  const searchParams = useSearchParams();
  const search = (searchParams.get('search') || '').toLowerCase();
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);
  const [deletingSeason, setDeletingSeason] = useState<Season | null>(null);

  const filteredSeasons = useMemo(
    () =>
      seasons.filter(
        (season) =>
          !search ||
          season.name.toLowerCase().includes(search) ||
          (season.description && season.description.toLowerCase().includes(search)),
      ),
    [seasons, search],
  );

  return (
    <>
      <CollectionPageLayout
        title="Temporadas"
        showSearch
        searchParamName="search"
        searchLabel="Buscar"
        searchPlaceholder="Buscar temporada..."
        addAction={
          <IconButton
            icon="add"
            variant="outlined"
            aria-label="Agregar temporada"
            onClick={() => setOpenCreateDialog(true)}
            data-test-id="seasons-add-button"
          />
        }
        contentItems={filteredSeasons.map((season) => (
          <SeasonCard
            key={season.id}
            season={season}
            onEdit={() => setEditingSeason(season)}
            onDelete={() => setDeletingSeason(season)}
            data-test-id={`season-card-${season.id}`}
          />
        ))}
        contentGridColumns={{ default: 1, sm: 2, lg: 3 }}
        contentGridGapClassName="gap-6"
        contentEmptyMessage="No hay temporadas para mostrar."
        data-test-id="seasons-list-container"
      />

      <CreateSeasonDialog
        open={openCreateDialog}
        onClose={() => setOpenCreateDialog(false)}
        data-test-id="seasons-create-dialog"
      />

      {editingSeason && (
        <UpdateSeasonDialog
          open={!!editingSeason}
          onClose={() => setEditingSeason(null)}
          season={editingSeason}
          data-test-id="seasons-update-dialog"
        />
      )}

      {deletingSeason && (
        <DeleteSeasonDialog
          open={!!deletingSeason}
          onClose={() => setDeletingSeason(null)}
          season={deletingSeason}
          data-test-id="seasons-delete-dialog"
        />
      )}
    </>
  );
}

export default ListSeasons;
