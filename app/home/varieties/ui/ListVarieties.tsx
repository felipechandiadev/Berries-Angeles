'use client';
import { useState } from "react";
import { CollectionPageLayout } from "@felipechandiadev/ui";
import VarietyCard from "./VarietyCard";
import CreateVarietyDialog from "./CreateVarietyDialog";
import IconButton from '@/app/baseComponents/IconButton/IconButton';
import type { VarietyQualityPrice } from '@/data/entities/Variety';

export interface VarietyType {
  id: number;
  name: string;
  qualityPrices?: VarietyQualityPrice[];
}

export interface ListVarietiesProps {
  varieties: VarietyType[];
}

const ListVarieties: React.FC<ListVarietiesProps> = ({ varieties }) => {
  const [openCreateDialog, setOpenCreateDialog] = useState(false);

  return (
    <>
      <CollectionPageLayout
        title="Variedades"
        showSearch
        searchParamName="search"
        searchLabel="Buscar"
        searchPlaceholder="Buscar variedad..."
        addAction={
          <IconButton
            icon="add"
            variant="outlined"
            aria-label="Agregar variedad"
            onClick={() => setOpenCreateDialog(true)}
            data-test-id="varieties-add-button"
          />
        }
        contentItems={varieties.map((variety) => (
          <VarietyCard
            key={variety.id}
            variety={variety}
            data-test-id={`variety-card-${variety.id}`}
          />
        ))}
        contentGridColumns={{ default: 1, sm: 2, lg: 3 }}
        contentGridGapClassName="gap-6"
        contentEmptyMessage="No hay variedades para mostrar."
        data-test-id="varieties-list-container"
      />
      <CreateVarietyDialog
        open={openCreateDialog}
        onClose={() => setOpenCreateDialog(false)}
        data-test-id="varieties-create-dialog"
      />
    </>
  );
};

export default ListVarieties;
