import type { CalendarEvent } from "./Calendar.types";
export type MonthViewProps = {
    month?: Date;
    events: CalendarEvent[];
    locale?: string;
    headerRight?: React.ReactNode;
    onSelectDate?: (isoDate: string) => void;
    className?: string;
};
export declare function MonthView({ month, events, locale, headerRight, onSelectDate, className, }: MonthViewProps): import("react").JSX.Element;
export default MonthView;
//# sourceMappingURL=MonthView.d.ts.map