/** Helpers TZ-safe para calendarios genéricos (date-only + grilla horaria). */
export const DEFAULT_TIME_ZONE = "America/Santiago";
export const DEFAULT_LOCALE = "es-CL";
export const DEFAULT_CALENDAR_START_HOUR = 8;
export const DEFAULT_CALENDAR_END_HOUR = 20;
export function pad2(n) {
    return String(n).padStart(2, "0");
}
/** Parsea `YYYY-MM-DD` como UTC medianoche (para aritmética de días). */
export function parseIsoDate(dateStr) {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(Date.UTC(y !== null && y !== void 0 ? y : 1970, (m !== null && m !== void 0 ? m : 1) - 1, d !== null && d !== void 0 ? d : 1));
}
/** Mediodía UTC evita que Intl con America/Santiago muestre el día anterior. */
export function parseIsoDateForDisplay(dateStr) {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(Date.UTC(y !== null && y !== void 0 ? y : 1970, (m !== null && m !== void 0 ? m : 1) - 1, d !== null && d !== void 0 ? d : 1, 12, 0, 0));
}
export function formatIsoDate(date) {
    return date.toISOString().slice(0, 10);
}
/** Construye `YYYY-MM-DD` desde partes locales del Date (sin UTC). */
export function toLocalIsoDate(d) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
export function addDaysIso(dateStr, days) {
    const d = parseIsoDate(dateStr);
    d.setUTCDate(d.getUTCDate() + days);
    return formatIsoDate(d);
}
export function getTodayIso(timeZone = DEFAULT_TIME_ZONE) {
    var _a, _b, _c, _d, _e, _f;
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(new Date());
    const y = (_b = (_a = parts.find((p) => p.type === "year")) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : "1970";
    const m = (_d = (_c = parts.find((p) => p.type === "month")) === null || _c === void 0 ? void 0 : _c.value) !== null && _d !== void 0 ? _d : "01";
    const d = (_f = (_e = parts.find((p) => p.type === "day")) === null || _e === void 0 ? void 0 : _e.value) !== null && _f !== void 0 ? _f : "01";
    return `${y}-${m}-${d}`;
}
/** Lunes como inicio de semana por defecto (`weekStartsOn = 1`). */
export function getWeekStart(dateStr, weekStartsOn = 1) {
    const d = parseIsoDate(dateStr);
    const weekday = d.getUTCDay(); // 0=Sun..6=Sat
    let offset;
    if (weekStartsOn === 1) {
        offset = weekday === 0 ? -6 : 1 - weekday;
    }
    else {
        offset = -weekday;
    }
    d.setUTCDate(d.getUTCDate() + offset);
    return formatIsoDate(d);
}
export function getWeekDays(weekStart) {
    return Array.from({ length: 7 }, (_, i) => addDaysIso(weekStart, i));
}
export function formatWeekRangeLabel(weekStart, options) {
    var _a, _b;
    const locale = (_a = options === null || options === void 0 ? void 0 : options.locale) !== null && _a !== void 0 ? _a : DEFAULT_LOCALE;
    const timeZone = (_b = options === null || options === void 0 ? void 0 : options.timeZone) !== null && _b !== void 0 ? _b : DEFAULT_TIME_ZONE;
    const end = addDaysIso(weekStart, 6);
    const startDate = parseIsoDateForDisplay(weekStart);
    const endDate = parseIsoDateForDisplay(end);
    const fmt = new Intl.DateTimeFormat(locale, {
        timeZone,
        day: "numeric",
        month: "short",
    });
    const year = new Intl.DateTimeFormat(locale, {
        timeZone,
        year: "numeric",
    }).format(startDate);
    return `Semana del ${fmt.format(startDate)} al ${fmt.format(endDate)} ${year}`;
}
export function formatDayHeader(dateStr, options) {
    var _a, _b;
    const locale = (_a = options === null || options === void 0 ? void 0 : options.locale) !== null && _a !== void 0 ? _a : DEFAULT_LOCALE;
    const timeZone = (_b = options === null || options === void 0 ? void 0 : options.timeZone) !== null && _b !== void 0 ? _b : DEFAULT_TIME_ZONE;
    const d = parseIsoDateForDisplay(dateStr);
    const weekday = new Intl.DateTimeFormat(locale, {
        timeZone,
        weekday: "short",
    }).format(d);
    const dayNum = new Intl.DateTimeFormat(locale, {
        timeZone,
        day: "numeric",
    }).format(d);
    return `${weekday} ${dayNum}`;
}
export function formatMonthTitle(month, options) {
    var _a;
    const locale = (_a = options === null || options === void 0 ? void 0 : options.locale) !== null && _a !== void 0 ? _a : DEFAULT_LOCALE;
    return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" })
        .format(month)
        .replace(/^\w/, (c) => c.toUpperCase());
}
export function timeToMinutes(time) {
    const [h, m] = time.split(":").map(Number);
    return (h !== null && h !== void 0 ? h : 0) * 60 + (m !== null && m !== void 0 ? m : 0);
}
export function timeToOffsetPercent(time, minHour = DEFAULT_CALENDAR_START_HOUR, maxHour = DEFAULT_CALENDAR_END_HOUR) {
    const mins = timeToMinutes(time);
    const start = minHour * 60;
    const end = maxHour * 60;
    const span = end - start;
    if (span <= 0)
        return 0;
    const clamped = Math.max(start, Math.min(end, mins));
    return ((clamped - start) / span) * 100;
}
export function getNowMinutes(timeZone = DEFAULT_TIME_ZONE) {
    var _a, _b, _c, _d;
    const nowParts = new Intl.DateTimeFormat("en-GB", {
        timeZone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).formatToParts(new Date());
    const hour = Number((_b = (_a = nowParts.find((p) => p.type === "hour")) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : 0);
    const minute = Number((_d = (_c = nowParts.find((p) => p.type === "minute")) === null || _c === void 0 ? void 0 : _c.value) !== null && _d !== void 0 ? _d : 0);
    return hour * 60 + minute;
}
export function nowLineOffsetPercent(options) {
    var _a, _b, _c;
    const timeZone = (_a = options === null || options === void 0 ? void 0 : options.timeZone) !== null && _a !== void 0 ? _a : DEFAULT_TIME_ZONE;
    const minHour = (_b = options === null || options === void 0 ? void 0 : options.minHour) !== null && _b !== void 0 ? _b : DEFAULT_CALENDAR_START_HOUR;
    const maxHour = (_c = options === null || options === void 0 ? void 0 : options.maxHour) !== null && _c !== void 0 ? _c : DEFAULT_CALENDAR_END_HOUR;
    const mins = getNowMinutes(timeZone);
    if (mins < minHour * 60 || mins > maxHour * 60)
        return null;
    const hour = Math.floor(mins / 60);
    const minute = mins % 60;
    return timeToOffsetPercent(`${pad2(hour)}:${pad2(minute)}`, minHour, maxHour);
}
export function hourLabels(minHour, maxHour) {
    if (maxHour < minHour)
        return [];
    return Array.from({ length: maxHour - minHour + 1 }, (_, i) => minHour + i);
}
export function resolveReferenceIso(referenceDate, timeZone = DEFAULT_TIME_ZONE) {
    if (!referenceDate)
        return getTodayIso(timeZone);
    if (typeof referenceDate === "string") {
        const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(referenceDate.trim());
        if (m)
            return `${m[1]}-${m[2]}-${m[3]}`;
        const d = new Date(referenceDate);
        return Number.isNaN(d.getTime()) ? getTodayIso(timeZone) : formatIsoDate(d);
    }
    return toLocalIsoDate(referenceDate);
}
export function groupEventsByDate(events) {
    var _a;
    const map = new Map();
    for (const event of events) {
        const key = event.date.slice(0, 10);
        const list = (_a = map.get(key)) !== null && _a !== void 0 ? _a : [];
        list.push(event);
        map.set(key, list);
    }
    return map;
}
//# sourceMappingURL=calendar.utils.js.map