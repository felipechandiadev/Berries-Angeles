"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { Link, usePathname } from "../../navigation";
import "./tabs.css";
const Tabs = ({ items, activeTab }) => {
    const pathname = usePathname();
    const getIsActive = (tabUrl) => {
        if (activeTab) {
            return tabUrl === activeTab;
        }
        return pathname.includes(tabUrl.split("/").filter(Boolean).pop() || "");
    };
    return (_jsx("nav", { className: "flex flex-wrap", "data-test-id": "tabs-root", children: items.map((tab) => {
            const isActive = getIsActive(tab.url);
            return (_jsx(Link, { href: tab.url, className: `fs-tabs__link whitespace-nowrap ${isActive ? "fs-tabs__link--active" : "fs-tabs__link--inactive"}`, "aria-current": isActive ? "page" : undefined, children: tab.label }, tab.url));
        }) }));
};
export default Tabs;
//# sourceMappingURL=Tabs.js.map