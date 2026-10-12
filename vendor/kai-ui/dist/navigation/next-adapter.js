"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { Suspense, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { NavProvider } from "./context";
function useNextRouter() {
    const nextRouter = useRouter();
    return useMemo(() => ({
        push(href, options) {
            nextRouter.push(href, options);
        },
        replace(href, options) {
            nextRouter.replace(href, options);
        },
        back() {
            nextRouter.back();
        },
    }), [nextRouter]);
}
function NextNavProviderInner({ children }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useNextRouter();
    const navSearchParams = useMemo(() => new URLSearchParams(searchParams.toString()), [searchParams]);
    return (_jsx(NavProvider, { router: router, pathname: pathname, searchParams: navSearchParams, children: children }));
}
function NextNavFromSearch({ children, search, }) {
    const pathname = usePathname();
    const router = useNextRouter();
    const navSearchParams = useMemo(() => new URLSearchParams(search), [search]);
    return (_jsx(NavProvider, { router: router, pathname: pathname, searchParams: navSearchParams, children: children }));
}
/** Bridges Next.js App Router into the navigation context. */
export function NextNavProvider({ children, search, }) {
    if (search !== undefined) {
        return _jsx(NextNavFromSearch, { search: search, children: children });
    }
    return (_jsx(Suspense, { fallback: children, children: _jsx(NextNavProviderInner, { children: children }) }));
}
//# sourceMappingURL=next-adapter.js.map