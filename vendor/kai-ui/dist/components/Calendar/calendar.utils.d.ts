/** Helpers TZ-safe para calendarios genéricos (date-only + grilla horaria). */
export declare const DEFAULT_TIME_ZONE = "America/Santiago";
export declare const DEFAULT_LOCALE = "es-CL";
export declare const DEFAULT_CALENDAR_START_HOUR = 8;
export declare const DEFAULT_CALENDAR_END_HOUR = 20;
export declare function pad2(n: number): string;
/** Parsea `YYYY-MM-DD` como UTC medianoche (para aritmética de días). */
export declare function parseIsoDate(dateStr: string): Date;
/** Mediodía UTC evita que Intl con America/Santiago muestre el día anterior. */
export declare function parseIsoDateForDisplay(dateStr: string): Date;
export declare function formatIsoDate(date: Date): string;
/** Construye `YYYY-MM-DD` desde partes locales del Date (sin UTC). */
export declare function toLocalIsoDate(d: Date): string;
export declare function addDaysIso(dateStr: string, days: number): string;
export declare function getTodayIso(timeZone?: string): string;
/** Lunes como inicio de semana por defecto (`weekStartsOn = 1`). */
export declare function getWeekStart(dateStr: string, weekStartsOn?: 0 | 1): string;
export declare function getWeekDays(weekStart: string): string[];
export declare function formatWeekRangeLabel(weekStart: string, options?: {
    locale?: string;
    timeZone?: string;
}): string;
export declare function formatDayHeader(dateStr: string, options?: {
    locale?: string;
    timeZone?: string;
}): string;
export declare function formatMonthTitle(month: Date, options?: {
    locale?: string;
}): string;
export declare function timeToMinutes(time: string): number;
export declare function timeToOffsetPercent(time: string, minHour?: number, maxHour?: number): number;
export declare function getNowMinutes(timeZone?: string): number;
export declare function nowLineOffsetPercent(options?: {
    timeZone?: string;
    minHour?: number;
    maxHour?: number;
}): number | null;
export declare function hourLabels(minHour: number, maxHour: number): number[];
export declare function resolveReferenceIso(referenceDate: Date | string | undefined, timeZone?: string): string;
export declare function groupEventsByDate<T extends {
    date: string;
}>(events: T[]): Map<string, T[]>;
//# sourceMappingURL=calendar.utils.d.ts.map