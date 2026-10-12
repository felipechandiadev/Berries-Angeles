"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useCallback, useMemo } from "react";
export const NavContext = createContext(null);
function resolveSearchParamsInput(input) {
    if (input instanceof URLSearchParams) {
        return new URLSearchParams(input.toString());
    }
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(input)) {
        if (value === undefined)
            continue;
        if (Array.isArray(value)) {
            for (const item of value) {
                params.append(key, item);
            }
        }
        else {
            params.set(key, value);
        }
    }
    return params;
}
export function NavProvider({ router, pathname, searchParams, children, setSearchParams: setSearchParamsProp, }) {
    const setSearchParams = useCallback((next, options) => {
        if (setSearchParamsProp) {
            setSearchParamsProp(next, options);
            return;
        }
        const resolved = typeof next === "function"
            ? resolveSearchParamsInput(next(searchParams))
            : resolveSearchParamsInput(next);
        const qs = resolved.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, options);
    }, [pathname, router, searchParams, setSearchParamsProp]);
    const value = useMemo(() => ({
        router,
        pathname,
        searchParams,
        setSearchParams,
    }), [router, pathname, searchParams, setSearchParams]);
    return (_jsx(NavContext.Provider, { value: value, children: children }));
}
//# sourceMappingURL=context.js.map