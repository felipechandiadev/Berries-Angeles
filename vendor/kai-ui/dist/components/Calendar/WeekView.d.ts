import type { CalendarColumnsFrom, CalendarEvent } from "./Calendar.types";
export type WeekViewProps = {
    weekStart: string;
    events: CalendarEvent[];
    locale?: string;
    timeZone?: string;
    minHour?: number;
    maxHour?: number;
    columnsFrom?: CalendarColumnsFrom;
    onSelectDate?: (isoDate: string) => void;
    onSelectSlot?: (isoDate: string, hour?: number) => void;
    emptySlotLabel?: string;
    className?: string;
};
export declare function WeekView({ weekStart, events, locale, timeZone, minHour, maxHour, columnsFrom, onSelectDate, onSelectSlot, emptySlotLabel, className, }: WeekViewProps): import("react").JSX.Element;
export default WeekView;
//# sourceMappingURL=WeekView.d.ts.map