import React from "react";
import type { NavRouter, NavSearchParams, SetNavSearchParams } from "./types";
export type NavContextValue = {
    router: NavRouter;
    pathname: string;
    searchParams: NavSearchParams;
    setSearchParams: SetNavSearchParams;
};
export declare const NavContext: React.Context<NavContextValue | null>;
export type NavProviderProps = {
    router: NavRouter;
    pathname: string;
    searchParams: NavSearchParams;
    children: React.ReactNode;
    /** When omitted, `setSearchParams` builds `pathname?query` and calls `router.replace`. */
    setSearchParams?: SetNavSearchParams;
};
export declare function NavProvider({ router, pathname, searchParams, children, setSearchParams: setSearchParamsProp, }: NavProviderProps): React.JSX.Element;
//# sourceMappingURL=context.d.ts.map