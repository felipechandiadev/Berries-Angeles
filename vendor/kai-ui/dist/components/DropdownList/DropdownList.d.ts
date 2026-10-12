import React from "react";
import "./dropdown.css";
export declare const dropdownOptionClass = "fs-dropdown__option";
interface DropdownListProps {
    open: boolean;
    children?: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    testId?: string;
    dropUp?: boolean;
    highlightedIndex?: number;
    onHoverChange?: (index: number) => void;
    renderItems?: boolean;
    anchorRef?: React.RefObject<HTMLElement | null>;
    usePortal?: boolean;
}
declare const DropdownList: React.FC<DropdownListProps>;
export default DropdownList;
//# sourceMappingURL=DropdownList.d.ts.map