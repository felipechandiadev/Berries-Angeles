import React from 'react';
import Select from '@/app/baseComponents/Select/Select';

interface FormatSelectorProps {
  formatOptions: { id: number; label: string }[];
  formatId: number | null;
  onFormatChange: (id: number | null) => void;
  dataTestIdPrefix?: string;
}

const FormatSelector: React.FC<FormatSelectorProps> = ({ formatOptions, formatId, onFormatChange, dataTestIdPrefix }) => {
  return (
    <Select
      label="Formato"
      options={formatOptions.map((f) => ({ id: f.id, label: f.label }))}
      placeholder="Selecciona un formato"
      value={formatId || null}
      onChange={(value) => {
        const selectedId = value ? parseInt(value.toString(), 10) : null;
        onFormatChange(selectedId);
      }}
      data-test-id={dataTestIdPrefix ? `${dataTestIdPrefix}-format-select` : 'format-select'}
    />
  );
};

export default FormatSelector;