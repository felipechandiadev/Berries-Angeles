import React, { useEffect, useState } from 'react';
import Select from '@/app/baseComponents/Select/Select';
import { getTraysSimpleList } from '@/app/actions/trays';

interface TraySelectorProps {
  trayId: string | null;
  onTrayChange: (id: string | null, weight: number, label: string | null) => void; // Callback to update trayId, unitTrayWeight, and tray label
  dataTestIdPrefix?: string;
}

const TraySelector: React.FC<TraySelectorProps> = ({ trayId, onTrayChange, dataTestIdPrefix }) => {
  const [allTrays, setAllTrays] = useState<{ id: string; label: string; weight: number }[]>([]); // Full tray list
  const [trayOptions, setTrayOptions] = useState<{ id: string; label: string }[]>([]); // Processed options for Select

  useEffect(() => {
    const fetchTrays = async () => {
      const trays = await getTraysSimpleList();
      console.log('[TraySelector] Fetched trays:', trays); // Log fetched trays

      // Ensure each tray has a valid ID
      const traysWithIds = trays.map((tray) => ({
        id: tray.id,
        label: tray.label,
        weight: tray.weight,
      }));

      setAllTrays(traysWithIds); // Store full tray list

      // Process options for Select
      const validOptions = traysWithIds.map((tray) => ({
        id: tray.id,
        label: tray.label,
      }));

      console.log('[TraySelector] Processed tray options:', validOptions); // Log processed options
      setTrayOptions(validOptions);
    };

    fetchTrays();
  }, []);

  return (
    <Select
      label="Tipo de bandeja"
      options={trayOptions} // Use processed options
      placeholder="Selecciona un tipo de bandeja"
      value={trayId}
      onChange={(value) => {
        const selectedId = value ? value.toString() : null;
        console.log('[TraySelector] Selected tray ID:', selectedId); // Log selected tray ID
        const selectedTray = allTrays.find((tray) => tray.id === selectedId); // Find in full tray list
        console.log('[TraySelector] Selected tray details:', selectedTray); // Log selected tray details
        const trayWeight = selectedTray ? Number(selectedTray.weight) : 0;
        onTrayChange(selectedId, Number.isFinite(trayWeight) ? trayWeight : 0, selectedTray?.label ?? null); // Update tray info
      }}
      data-test-id={dataTestIdPrefix ? `${dataTestIdPrefix}-tray-select` : 'tray-select'}
    />
  );
};

export default TraySelector;