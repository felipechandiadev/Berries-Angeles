"use client";
import { useContext } from "react";
import { NavContext } from "./context";
const MISSING_PROVIDER = "@kai/ui navigation hooks require NavProvider (NextNavProvider or MemoryNavProvider).";
function useNavContext() {
    const ctx = useContext(NavContext);
    if (!ctx) {
        throw new Error(MISSING_PROVIDER);
    }
    return ctx;
}
export function useRouter() {
    return useNavContext().router;
}
export function usePathname() {
    return useNavContext().pathname;
}
export function useSearchParams() {
    return useNavContext().searchParams;
}
export function useSetSearchParams() {
    return useNavContext().setSearchParams;
}
//# sourceMappingURL=hooks.js.map