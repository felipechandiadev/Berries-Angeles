"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from "react";
import { Badge } from "../Badge";
import { DEFAULT_CALENDAR_END_HOUR, DEFAULT_CALENDAR_START_HOUR, DEFAULT_LOCALE, DEFAULT_TIME_ZONE, formatDayHeader, getTodayIso, getWeekDays, groupEventsByDate, hourLabels, nowLineOffsetPercent, timeToOffsetPercent, } from "./calendar.utils";
const GRID_HEIGHT_REM = 36;
function columnsVisibilityClasses(columnsFrom) {
    switch (columnsFrom) {
        case "always":
            return { grid: "block", mobile: null };
        case "sm":
            return { grid: "hidden sm:block", mobile: "sm:hidden" };
        case "md":
            return { grid: "hidden md:block", mobile: "md:hidden" };
        case "lg":
        default:
            return { grid: "hidden lg:block", mobile: "lg:hidden" };
    }
}
export function WeekView({ weekStart, events, locale = DEFAULT_LOCALE, timeZone = DEFAULT_TIME_ZONE, minHour = DEFAULT_CALENDAR_START_HOUR, maxHour = DEFAULT_CALENDAR_END_HOUR, columnsFrom = "lg", onSelectDate, onSelectSlot, emptySlotLabel = "Agregar", className = "", }) {
    const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);
    const byDate = useMemo(() => groupEventsByDate(events), [events]);
    const todayIso = getTodayIso(timeZone);
    const labels = useMemo(() => hourLabels(minHour, maxHour), [minHour, maxHour]);
    const span = Math.max(1, maxHour - minHour);
    const visibility = columnsVisibilityClasses(columnsFrom);
    return (_jsxs("div", { className: className, "data-test-id": "calendar-week-view", children: [_jsx("div", { className: `${visibility.grid} overflow-x-auto rounded-xl border border-border bg-card`, role: "grid", "aria-label": "Calendario semanal", children: _jsxs("div", { className: "flex min-w-[56rem]", children: [_jsxs("div", { className: "sticky left-0 z-20 w-12 shrink-0 border-r border-border/60 bg-background", children: [_jsx("div", { className: "h-13 border-b border-border/60" }), _jsx("div", { className: "relative", style: { minHeight: `${GRID_HEIGHT_REM}rem` }, children: labels.map((hour) => (_jsxs("div", { className: "absolute right-1 -translate-y-1/2 text-[10px] tabular-nums text-muted-foreground", style: {
                                            top: `${((hour - minHour) / span) * 100}%`,
                                        }, children: [String(hour).padStart(2, "0"), ":00"] }, hour))) })] }), weekDays.map((date) => {
                            var _a;
                            return (_jsx(WeekDayColumn, { date: date, events: (_a = byDate.get(date)) !== null && _a !== void 0 ? _a : [], isToday: date === todayIso, locale: locale, timeZone: timeZone, minHour: minHour, maxHour: maxHour, emptySlotLabel: emptySlotLabel, onSelectDate: onSelectDate, onSelectSlot: onSelectSlot }, date));
                        })] }) }), visibility.mobile ? (_jsx("div", { className: `space-y-3 ${visibility.mobile}`, children: weekDays.map((date) => {
                    var _a;
                    return (_jsx(WeekDayMobileSection, { date: date, events: (_a = byDate.get(date)) !== null && _a !== void 0 ? _a : [], isToday: date === todayIso, locale: locale, timeZone: timeZone, emptySlotLabel: emptySlotLabel, onSelectDate: onSelectDate, onSelectSlot: onSelectSlot }, date));
                }) })) : null] }));
}
function WeekDayColumn({ date, events, isToday, locale, timeZone, minHour, maxHour, emptySlotLabel, onSelectDate, onSelectSlot, }) {
    const nowOffset = isToday
        ? nowLineOffsetPercent({ timeZone, minHour, maxHour })
        : null;
    const span = Math.max(1, maxHour - minHour);
    return (_jsxs("div", { className: `relative flex min-w-[8.5rem] flex-1 flex-col border-l border-border/60 ${isToday ? "bg-primary/[0.03]" : ""}`, children: [_jsxs("button", { type: "button", onClick: () => onSelectDate === null || onSelectDate === void 0 ? void 0 : onSelectDate(date), className: `sticky top-0 z-20 border-b border-border/60 bg-background/95 px-2 py-2 text-center backdrop-blur-sm ${isToday ? "ring-1 ring-inset ring-primary/20" : ""}`, children: [_jsx("p", { className: "text-xs font-medium text-foreground", children: formatDayHeader(date, { locale, timeZone }) }), isToday ? (_jsx(Badge, { variant: "primary-outlined", className: "mt-0.5 text-[10px]", children: "Hoy" })) : null] }), _jsxs("div", { className: "relative flex-1", style: { minHeight: `${GRID_HEIGHT_REM}rem` }, role: "row", children: [Array.from({ length: span }, (_, i) => (_jsx("button", { type: "button", "aria-label": `${date} ${String(minHour + i).padStart(2, "0")}:00`, className: "absolute left-0 right-0 border-t border-border/30 hover:bg-muted/20", style: {
                            top: `${(i / span) * 100}%`,
                            height: `${(1 / span) * 100}%`,
                        }, onClick: () => onSelectSlot === null || onSelectSlot === void 0 ? void 0 : onSelectSlot(date, minHour + i) }, i))), nowOffset != null ? (_jsx("div", { className: "pointer-events-none absolute left-0 right-0 z-30 border-t-2 border-red-500/80", style: { top: `${nowOffset}%` }, "aria-hidden": true })) : null, events.map((event) => {
                        var _a;
                        return (_jsx("div", { className: "absolute left-1 right-1 z-10", style: {
                                top: `${timeToOffsetPercent((_a = event.startTime) !== null && _a !== void 0 ? _a : "09:00", minHour, maxHour)}%`,
                            }, children: event.content }, event.id));
                    }), events.length === 0 ? (_jsx("button", { type: "button", onClick: () => onSelectSlot === null || onSelectSlot === void 0 ? void 0 : onSelectSlot(date), className: "absolute inset-x-2 bottom-2 z-10 rounded-lg border border-dashed border-border/80 px-2 py-3 text-center text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/30 hover:text-foreground", children: emptySlotLabel })) : null] })] }));
}
function WeekDayMobileSection({ date, events, isToday, locale, timeZone, emptySlotLabel, onSelectSlot, }) {
    return (_jsxs("details", { className: "rounded-lg border border-border bg-card", open: isToday, children: [_jsxs("summary", { className: "flex cursor-pointer list-none items-center justify-between px-4 py-3", children: [_jsxs("span", { className: "text-sm font-medium", children: [formatDayHeader(date, { locale, timeZone }), isToday ? (_jsx(Badge, { variant: "primary-outlined", className: "ml-2 text-[10px]", children: "Hoy" })) : null] }), _jsxs("span", { className: "text-xs text-muted-foreground", children: [events.length, " evento", events.length === 1 ? "" : "s"] })] }), _jsx("div", { className: "space-y-2 border-t border-border px-3 py-3", children: events.length === 0 ? (_jsx("button", { type: "button", onClick: () => onSelectSlot === null || onSelectSlot === void 0 ? void 0 : onSelectSlot(date), className: "w-full rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground", children: emptySlotLabel })) : (events.map((event) => (_jsx("div", { className: "relative min-h-20", children: event.content }, event.id)))) })] }));
}
export default WeekView;
//# sourceMappingURL=WeekView.js.map