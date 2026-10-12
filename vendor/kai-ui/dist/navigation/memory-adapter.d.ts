import React from "react";
import type { NavRouter } from "./types";
export type MemoryNavAdapter = {
    router: NavRouter;
    subscribe: (onStoreChange: () => void) => () => void;
    getPathname: () => string;
    getSearch: () => string;
};
/** Browser history adapter for Vite apps and tests (no Next.js). */
export declare function createMemoryNavAdapter(initialPathname?: string): MemoryNavAdapter;
export type MemoryNavProviderProps = {
    children: React.ReactNode;
    adapter?: MemoryNavAdapter;
    /** Used for SSR snapshot when `window` is unavailable. */
    initialPathname?: string;
};
export declare function MemoryNavProvider({ children, adapter: adapterProp, initialPathname, }: MemoryNavProviderProps): React.JSX.Element;
//# sourceMappingURL=memory-adapter.d.ts.map