import React from "react";
export type StatisticsValueTone = "primary" | "success" | "info" | "warning";
export interface StatisticsCardProps {
    label: string;
    value: React.ReactNode;
    hint?: React.ReactNode;
    tone?: StatisticsValueTone;
    compact?: boolean;
    className?: string;
    onClick?: () => void;
    "data-test-id"?: string;
}
export declare function StatisticsCard({ label, value, hint, tone, compact, className, onClick, "data-test-id": dataTestId, }: StatisticsCardProps): React.JSX.Element;
//# sourceMappingURL=StatisticsCard.d.ts.map