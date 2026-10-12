"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from "react";
import { Button } from "../Button/Button";
import IconButton from "../IconButton";
import { addDaysIso, DEFAULT_CALENDAR_END_HOUR, DEFAULT_CALENDAR_START_HOUR, DEFAULT_LOCALE, DEFAULT_TIME_ZONE, formatMonthTitle, formatWeekRangeLabel, getTodayIso, getWeekStart, parseIsoDateForDisplay, resolveReferenceIso, } from "./calendar.utils";
import { MonthView } from "./MonthView";
import { WeekView } from "./WeekView";
export function Calendar({ view, referenceDate, events, locale = DEFAULT_LOCALE, timeZone = DEFAULT_TIME_ZONE, weekStartsOn = 1, minHour = DEFAULT_CALENDAR_START_HOUR, maxHour = DEFAULT_CALENDAR_END_HOUR, columnsFrom = "lg", headerRight, hideNavigation = false, onSelectDate, onSelectSlot, onNavigate, className = "", emptySlotLabel = "Agregar", }) {
    const todayIso = getTodayIso(timeZone);
    const referenceIso = resolveReferenceIso(referenceDate, timeZone);
    const weekStart = useMemo(() => getWeekStart(referenceIso, weekStartsOn), [referenceIso, weekStartsOn]);
    const monthDate = useMemo(() => parseIsoDateForDisplay(referenceIso), [referenceIso]);
    const title = view === "week"
        ? formatWeekRangeLabel(weekStart, { locale, timeZone })
        : formatMonthTitle(monthDate, { locale });
    const navigateTo = (iso) => {
        onNavigate === null || onNavigate === void 0 ? void 0 : onNavigate(iso);
    };
    const handlePrev = () => {
        if (view === "week") {
            navigateTo(addDaysIso(weekStart, -7));
            return;
        }
        const d = new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1);
        navigateTo(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`);
    };
    const handleNext = () => {
        if (view === "week") {
            navigateTo(addDaysIso(weekStart, 7));
            return;
        }
        const d = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
        navigateTo(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`);
    };
    const handleToday = () => {
        navigateTo(view === "week" ? getWeekStart(todayIso, weekStartsOn) : todayIso);
    };
    const nav = hideNavigation ? null : (_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(IconButton, { icon: "ChevronLeft", variant: "neutral", size: "sm", ariaLabel: view === "week" ? "Semana anterior" : "Mes anterior", onClick: handlePrev }), _jsx(Button, { type: "button", variant: "outlinedSecondary", size: "sm", onClick: handleToday, children: "Hoy" }), _jsx(IconButton, { icon: "ChevronRight", variant: "neutral", size: "sm", ariaLabel: view === "week" ? "Semana siguiente" : "Mes siguiente", onClick: handleNext })] }));
    return (_jsxs("div", { className: ["flex min-h-0 flex-col gap-3", className].filter(Boolean).join(" "), "data-test-id": "calendar", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [nav, _jsx("h2", { className: "text-sm font-semibold text-foreground", children: title })] }), headerRight ? _jsx("div", { className: "flex items-center gap-2", children: headerRight }) : null] }), view === "week" ? (_jsx(WeekView, { weekStart: weekStart, events: events, locale: locale, timeZone: timeZone, minHour: minHour, maxHour: maxHour, columnsFrom: columnsFrom, onSelectDate: onSelectDate, onSelectSlot: onSelectSlot, emptySlotLabel: emptySlotLabel })) : (_jsx(MonthView, { month: monthDate, events: events, locale: locale, onSelectDate: onSelectDate }))] }));
}
export default Calendar;
//# sourceMappingURL=Calendar.js.map