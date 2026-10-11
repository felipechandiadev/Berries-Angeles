'use client';
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CollectionPageLayout } from "@felipechandiadev/ui";
import TrayCard from "./TrayCard";
import CreateTrayDialog from "./CreateTrayDialog";
import IconButton from '@/app/baseComponents/IconButton/IconButton';

export interface TrayType {
  id: string;
  name: string;
  weight: number;
  stock: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface ListTraysProps {
  trays: TrayType[];
}

const ListTrays: React.FC<ListTraysProps> = ({ trays }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = (searchParams.get("search") || "").toLowerCase();
  const [openCreateDialog, setOpenCreateDialog] = useState(false);

  const displayedTrays = useMemo(
    () => trays.filter((tray) => !search || tray.name.toLowerCase().includes(search)),
    [trays, search],
  );

  return (
    <>
      <CollectionPageLayout
        showSearch
        searchParamName="search"
        searchLabel="Buscar"
        searchPlaceholder="Buscar bandeja..."
        addAction={
          <IconButton
            icon="add"
            variant="outlined"
            aria-label="Agregar bandeja"
            onClick={() => setOpenCreateDialog(true)}
            data-test-id="trays-add-button"
          />
        }
        contentItems={displayedTrays.map((tray) => (
          <TrayCard
            key={tray.id}
            tray={tray}
            data-test-id={`tray-card-${tray.id}`}
          />
        ))}
        contentGridColumns={{ default: 1, sm: 2, lg: 3 }}
        contentGridGapClassName="gap-6"
        contentEmptyMessage="No hay bandejas para mostrar."
        data-test-id="trays-list-container"
      />

      <CreateTrayDialog
        open={openCreateDialog}
        onClose={() => setOpenCreateDialog(false)}
        onSuccess={() => {
          setOpenCreateDialog(false);
          router.refresh();
        }}
        data-test-id="trays-create-dialog"
      />
    </>
  );
};

export default ListTrays;
