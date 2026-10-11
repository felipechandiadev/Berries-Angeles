'use client';
import { useState } from "react";
import { CollectionPageLayout } from "@felipechandiadev/ui";
import FormatCard from "./FormatCard";
import CreateFormatDialog from "./CreateFormatDialog";
import IconButton from '@/app/baseComponents/IconButton/IconButton';

export interface FormatType {
  id: number;
  name: string;
  description?: string;
  active: boolean;
}

export interface ListFormatsProps {
  formats: FormatType[];
}

const ListFormats: React.FC<ListFormatsProps> = ({ formats }) => {
  const [openCreateDialog, setOpenCreateDialog] = useState(false);

  return (
    <>
      <CollectionPageLayout
        title="Formatos"
        showSearch
        searchParamName="search"
        searchLabel="Buscar"
        searchPlaceholder="Buscar formato..."
        addAction={
          <IconButton
            icon="add"
            variant="outlined"
            aria-label="Agregar formato"
            onClick={() => setOpenCreateDialog(true)}
            data-test-id="formats-add-button"
          />
        }
        contentItems={formats.map((format) => (
          <FormatCard
            key={format.id}
            format={format}
            data-test-id={`format-card-${format.id}`}
          />
        ))}
        contentGridColumns={{ default: 1, sm: 2, lg: 3 }}
        contentGridGapClassName="gap-6"
        contentEmptyMessage="No hay formatos para mostrar."
        data-test-id="formats-list-container"
      />
      <CreateFormatDialog
        open={openCreateDialog}
        onClose={() => setOpenCreateDialog(false)}
        data-test-id="formats-create-dialog"
      />
    </>
  );
};

export default ListFormats;
