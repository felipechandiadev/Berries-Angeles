"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { useMemo, useSyncExternalStore } from "react";
import { NavProvider } from "./context";
function getDefaultPathname() {
    if (typeof window === "undefined")
        return "/";
    return window.location.pathname;
}
function getDefaultSearch() {
    if (typeof window === "undefined")
        return "";
    return window.location.search.startsWith("?")
        ? window.location.search.slice(1)
        : window.location.search;
}
function notifyNavigation() {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new PopStateEvent("popstate"));
    }
}
/** Browser history adapter for Vite apps and tests (no Next.js). */
export function createMemoryNavAdapter(initialPathname = getDefaultPathname()) {
    let pathnameSnapshot = typeof window !== "undefined" ? window.location.pathname : initialPathname;
    const router = {
        push(href) {
            if (typeof window === "undefined")
                return;
            window.history.pushState({}, "", href);
            pathnameSnapshot = window.location.pathname;
            notifyNavigation();
        },
        replace(href) {
            if (typeof window === "undefined")
                return;
            window.history.replaceState({}, "", href);
            pathnameSnapshot = window.location.pathname;
            notifyNavigation();
        },
        back() {
            if (typeof window === "undefined")
                return;
            window.history.back();
        },
    };
    return {
        router,
        subscribe(onStoreChange) {
            if (typeof window === "undefined") {
                return () => { };
            }
            const handler = () => {
                pathnameSnapshot = window.location.pathname;
                onStoreChange();
            };
            window.addEventListener("popstate", handler);
            return () => window.removeEventListener("popstate", handler);
        },
        getPathname() {
            if (typeof window !== "undefined") {
                return window.location.pathname;
            }
            return pathnameSnapshot;
        },
        getSearch() {
            if (typeof window !== "undefined") {
                const raw = window.location.search;
                return raw.startsWith("?") ? raw.slice(1) : raw;
            }
            return "";
        },
    };
}
export function MemoryNavProvider({ children, adapter: adapterProp, initialPathname = "/", }) {
    const adapter = useMemo(() => adapterProp !== null && adapterProp !== void 0 ? adapterProp : createMemoryNavAdapter(initialPathname), [adapterProp, initialPathname]);
    const pathname = useSyncExternalStore(adapter.subscribe, adapter.getPathname, () => initialPathname);
    const searchString = useSyncExternalStore(adapter.subscribe, adapter.getSearch, getDefaultSearch);
    const searchParams = useMemo(() => new URLSearchParams(searchString), [searchString]);
    return (_jsx(NavProvider, { router: adapter.router, pathname: pathname, searchParams: searchParams, children: children }));
}
//# sourceMappingURL=memory-adapter.js.map