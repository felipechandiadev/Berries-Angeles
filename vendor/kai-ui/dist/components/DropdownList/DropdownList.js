"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "./dropdown.css";
// Option row style for dropdown
export const dropdownOptionClass = "fs-dropdown__option";
const DropdownList = ({ open, children, className = "", style, testId, dropUp = false, highlightedIndex = -1, onHoverChange, anchorRef, usePortal = false, }) => {
    const [hoveredIndex, setHoveredIndex] = useState(-1);
    const [position, setPosition] = useState(null);
    const [mounted, setMounted] = useState(false);
    const dropdownRef = useRef(null);
    // Handle client-side mounting for portal
    useEffect(() => {
        setMounted(true);
    }, []);
    // Calculate position when using portal mode
    useEffect(() => {
        if (!usePortal || !open || !(anchorRef === null || anchorRef === void 0 ? void 0 : anchorRef.current)) {
            setPosition(null);
            return;
        }
        const updatePosition = () => {
            var _a;
            if (!anchorRef.current)
                return;
            const rect = anchorRef.current.getBoundingClientRect();
            const dropdownHeight = ((_a = dropdownRef.current) === null || _a === void 0 ? void 0 : _a.offsetHeight) || 224; // max-h-56 = 224px
            const viewportHeight = window.innerHeight;
            // Check if dropdown would overflow bottom of viewport
            const spaceBelow = viewportHeight - rect.bottom;
            const spaceAbove = rect.top;
            const shouldDropUp = dropUp || (spaceBelow < dropdownHeight && spaceAbove > spaceBelow);
            setPosition({
                top: shouldDropUp ? rect.top - dropdownHeight - 4 : rect.bottom + 4,
                left: rect.left,
                width: rect.width,
            });
        };
        updatePosition();
        // Update position on scroll or resize
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);
        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [open, usePortal, anchorRef, dropUp]);
    if (!open)
        return null;
    const handleMouseEnter = (index) => {
        setHoveredIndex(index);
        onHoverChange === null || onHoverChange === void 0 ? void 0 : onHoverChange(index);
    };
    const handleMouseLeave = () => {
        setHoveredIndex(-1);
        onHoverChange === null || onHoverChange === void 0 ? void 0 : onHoverChange(-1);
    };
    // If children are provided, render them with hover management
    const childrenArray = React.Children.toArray(children);
    const childrenWithHover = children
        ? childrenArray.map((child, idx) => {
            var _a;
            if (React.isValidElement(child)) {
                const currentClassName = child.props.className || '';
                // UX: navegación por teclado debe verse igual que hover.
                const hoverClass = highlightedIndex === idx || hoveredIndex === idx ? "bg-neutral" : "";
                return React.cloneElement(child, {
                    key: (_a = child.key) !== null && _a !== void 0 ? _a : idx,
                    className: `${currentClassName} ${hoverClass}`.trim(),
                    onMouseEnter: () => handleMouseEnter(idx),
                    onMouseLeave: () => handleMouseLeave(),
                });
            }
            return child;
        })
        : children;
    // Base styles for non-portal mode
    const dropStyle = dropUp
        ? { bottom: '100%', top: 'auto', marginBottom: '0.25rem', marginTop: 0 }
        : { marginTop: '0.25rem' };
    // Portal styles (fixed positioning)
    const portalStyle = position ? {
        position: 'fixed',
        top: position.top,
        left: position.left,
        width: position.width,
        zIndex: 9999, // Maximum z-index to ensure it's above everything
    } : {};
    const dropdownElement = (_jsx("ul", { ref: dropdownRef, className: `fs-dropdown__list ${usePortal ? "fs-dropdown__list--portal" : ""} ${className}`.trim(), style: usePortal && position ? Object.assign(Object.assign({}, portalStyle), style) : (dropUp || Object.keys(style || {}).length > 0 ? Object.assign(Object.assign({}, dropStyle), style) : Object.assign({}, dropStyle)), "data-test-id": testId || "dropdown-list", children: childrenWithHover }));
    // Use portal for rendering outside the DOM hierarchy
    if (usePortal && mounted) {
        return createPortal(dropdownElement, document.body);
    }
    return dropdownElement;
};
export default DropdownList;
//# sourceMappingURL=DropdownList.js.map