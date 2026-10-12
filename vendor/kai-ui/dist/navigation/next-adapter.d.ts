import React from "react";
/** Bridges Next.js App Router into the navigation context. */
export declare function NextNavProvider({ children, search, }: {
    children: React.ReactNode;
    /**
     * Query string without `?`, passed from a Server Component.
     * Skips `useSearchParams`, which suspends and would render DataGrid outside this provider.
     */
    search?: string;
}): React.JSX.Element;
//# sourceMappingURL=next-adapter.d.ts.map