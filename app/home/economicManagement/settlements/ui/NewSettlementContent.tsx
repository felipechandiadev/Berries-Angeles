'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Option } from '@/app/baseComponents/AutoComplete/AutoComplete';
import type { PendingAdvancesResult, PendingReceptionsResult } from '@/app/actions/settlements';
import PendingReceptionsSection from './PendingReceptionsSection';
import PendingAdvancesSection from './PendingAdvancesSection';
import SettlementSummary from './SettlementSummary';

interface NewSettlementContentProps {
  producerOptions: Option[];
  selectedProducerId?: string;
  receptions: PendingReceptionsResult;
  advances: PendingAdvancesResult;
}

const toIdSet = (ids: string[]): Set<string> => new Set(ids);

export default function NewSettlementContent({
  producerOptions,
  selectedProducerId,
  receptions,
  advances,
}: NewSettlementContentProps) {
  const [selectedReceptionIds, setSelectedReceptionIds] = useState<Set<string>>(
    () => toIdSet(receptions.rows.map((row) => row.transactionId)),
  );
  const [selectedAdvanceIds, setSelectedAdvanceIds] = useState<Set<string>>(
    () => toIdSet(advances.rows.map((row) => row.transactionId)),
  );

  useEffect(() => {
    setSelectedReceptionIds(toIdSet(receptions.rows.map((row) => row.transactionId)));
  }, [receptions.rows]);

  useEffect(() => {
    setSelectedAdvanceIds(toIdSet(advances.rows.map((row) => row.transactionId)));
  }, [advances.rows]);

  const handleReceptionToggle = (id: string, checked: boolean) => {
    setSelectedReceptionIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const handleAdvanceToggle = (id: string, checked: boolean) => {
    setSelectedAdvanceIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const {
    receptionsCount,
    receptionsTotal,
    advancesCount,
    advancesTotal,
    balance,
  } = useMemo(() => {
    const selectedReceptions = receptions.rows.filter((row) => selectedReceptionIds.has(row.transactionId));
    const selectedAdvances = advances.rows.filter((row) => selectedAdvanceIds.has(row.transactionId));

    const receptionsTotalAmount = selectedReceptions.reduce((total, row) => total + row.totalCLPToPay, 0);
    const advancesTotalAmount = selectedAdvances.reduce((total, row) => total + row.availableAmount, 0);

    return {
      receptionsCount: selectedReceptions.length,
      receptionsTotal: receptionsTotalAmount,
      advancesCount: selectedAdvances.length,
      advancesTotal: advancesTotalAmount,
      balance: receptionsTotalAmount - advancesTotalAmount,
    };
  }, [advances.rows, selectedAdvanceIds, selectedReceptionIds, receptions.rows]);

  return (
    <div className="space-y-8">
      <PendingReceptionsSection
        producerOptions={producerOptions}
        selectedProducerId={selectedProducerId}
        data={receptions}
        selectedIds={selectedReceptionIds}
        onToggle={handleReceptionToggle}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <PendingAdvancesSection
          selectedProducerId={selectedProducerId}
          data={advances}
          selectedIds={selectedAdvanceIds}
          onToggle={handleAdvanceToggle}
        />
        <SettlementSummary
          receptionsCount={receptionsCount}
          receptionsTotal={receptionsTotal}
          advancesCount={advancesCount}
          advancesTotal={advancesTotal}
          balance={balance}
        />
      </div>
    </div>
  );
}
