import React, { useEffect, useState } from 'react';
import Select from '@/app/baseComponents/Select/Select';
import { getVarietiesSimpleList } from '@/app/actions/varieties';

interface VarietySelectorProps {
  varietyId: number | null;
  onVarietyChange: (id: number | null) => void;
  dataTestIdPrefix?: string;
}

const VarietySelector: React.FC<VarietySelectorProps> = ({
  varietyId,
  onVarietyChange,
  dataTestIdPrefix,
}) => {
  const [varietyOptions, setVarietyOptions] = useState<{ id: number; label: string }[]>([]);

  useEffect(() => {
    const fetchVarieties = async () => {
      const varieties = await getVarietiesSimpleList();
      setVarietyOptions(varieties);
    };
    fetchVarieties();
  }, []);

  return (
    <div className="w-full">
      <Select
        label="Variedad"
        options={varietyOptions.map((v) => ({ id: v.id, label: v.label }))}
        placeholder="Selecciona una variedad"
        value={varietyId || null}
        onChange={(value) => {
          const selectedId = value ? parseInt(value.toString(), 10) : null;
          onVarietyChange(selectedId);
        }}
        allowClear
        data-test-id={dataTestIdPrefix ? `${dataTestIdPrefix}-variety-select` : 'variety-select'}
      />
    </div>
  );
};

export default VarietySelector;
