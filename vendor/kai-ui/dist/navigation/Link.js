"use client";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { jsx as _jsx } from "react/jsx-runtime";
import { useRouter } from "./hooks";
export function Link(_a) {
    var { href, onClick, children } = _a, rest = __rest(_a, ["href", "onClick", "children"]);
    const router = useRouter();
    return (_jsx("a", Object.assign({ href: href, onClick: (event) => {
            onClick === null || onClick === void 0 ? void 0 : onClick(event);
            if (event.defaultPrevented)
                return;
            event.preventDefault();
            router.push(href);
        } }, rest, { children: children })));
}
export default Link;
//# sourceMappingURL=Link.js.map