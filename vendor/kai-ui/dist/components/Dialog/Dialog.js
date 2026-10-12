"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../Button/Button';
import './dialog.css';
// Preset widths (in pixels) for each size at each breakpoint
const dialogSizePresets = {
    xs: {
        xs: 280,
        sm: 320,
        md: 420,
        lg: 420,
        xl: 420,
    },
    sm: {
        xs: 320,
        sm: 420,
        md: 520,
        lg: 640,
        xl: 640,
    },
    md: {
        xs: 360,
        sm: 520,
        md: 640,
        lg: 800,
        xl: 800,
    },
    lg: {
        xs: 400,
        sm: 640,
        md: 800,
        lg: 900,
        xl: 900,
    },
    xl: {
        xs: 450,
        sm: 800,
        md: 900,
        lg: 1000,
        xl: 1024,
    },
    xxl: {
        xs: 585,
        sm: 1040,
        md: 1170,
        lg: 1300,
        xl: 1331,
    },
};
const Dialog = ({ open, onClose, title, children, size = 'md', customSize, maxWidth, fullWidth = false, minWidth, scroll = 'body', height, maxHeight, minHeight, animationDuration = 200, overflowBehavior = 'auto', zIndex = 50, disableBackdropClick = false, persistent = false, className = '', contentStyle, alertArea, actions, hideActions = false, actionsJustify = 'between', showCloseButton = false, headerTransparent = false, closeButtonText = 'cerrar', onCloseButtonClick, 'data-test-id': dataTestId, }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);
    useEffect(() => {
        if (open) {
            setShouldRender(true);
            setTimeout(() => setIsVisible(true), 10);
        }
        else {
            setIsVisible(false);
            setTimeout(() => setShouldRender(false), animationDuration);
        }
    }, [open, animationDuration]);
    // Bloquear/restaurar scroll del body cuando el dialog se abre/cierra
    useEffect(() => {
        if (open) {
            // Guardar el overflow original del body
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            // Restaurar al desmontar o cerrar
            return () => {
                document.body.style.overflow = originalOverflow;
            };
        }
    }, [open]);
    // Handle ESC key
    useEffect(() => {
        if (!open || persistent)
            return;
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, onClose, persistent]);
    // Build width style based on size or customSize
    const buildWidthStyle = () => {
        const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl'];
        // For custom size, use 'md' as base or customSize if provided
        const baseSize = size === 'custom' ? 'md' : size;
        const baseWidths = dialogSizePresets[baseSize];
        const widths = customSize
            ? Object.assign(Object.assign({}, baseWidths), customSize) : baseWidths;
        // Get width for current breakpoint (this is a simplification - real implementation would use useMediaQuery)
        // For now, we'll use the lg width as default and let CSS handle responsive
        const defaultWidth = widths['lg'] || widths['md'] || widths['sm'] || widths['xs'] || 600;
        return {
            width: fullWidth ? '100%' : `${defaultWidth}px`,
        };
    };
    const rootScrollClasses = `flex justify-center min-h-screen ${scroll === 'body' ? 'items-start overflow-y-auto pt-24 pb-12' : 'items-center'}`;
    const widthStyle = buildWidthStyle();
    const marginClasses = fullWidth ? 'mx-4 sm:mx-4 md:mx-4' : 'mx-4 sm:mx-8 md:mx-12';
    const contentClass = [
        'fs-dialog__paper',
        'p-0 overflow-hidden',
        marginClasses,
        'relative',
        scroll === 'body' ? 'max-h-none' : 'flex flex-col max-h-[90vh]',
        'transition-all',
        isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
        className,
    ]
        .filter(Boolean)
        .join(' ');
    const contentWrapperStyle = Object.assign(Object.assign(Object.assign({}, widthStyle), { maxWidth: size === 'custom' && maxWidth
            ? typeof maxWidth === 'number'
                ? `${maxWidth}px`
                : maxWidth
            : undefined, minWidth: minWidth ? (typeof minWidth === 'number' ? `${minWidth}px` : minWidth) : undefined, height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined, maxHeight: maxHeight ? (typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight) : undefined, minHeight: minHeight ? (typeof minHeight === 'number' ? `${minHeight}px` : minHeight) : undefined, overflow: overflowBehavior, transitionDuration: `${animationDuration}ms` }), contentStyle);
    const backdropStyle = {
        zIndex,
        transitionDuration: `${animationDuration}ms`,
    };
    const handleCloseButtonClick = () => {
        if (onCloseButtonClick) {
            onCloseButtonClick();
        }
        onClose();
    };
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget && !disableBackdropClick && !persistent) {
            onClose();
        }
    };
    if (!shouldRender || !mounted)
        return null;
    const hasAlertArea = Boolean(alertArea);
    return createPortal(_jsx("div", { role: "dialog", "aria-modal": "true", "aria-label": title || 'Dialog', className: `fixed inset-0 transition-all bg-black/70 ${isVisible ? 'opacity-100' : 'opacity-0'} ${rootScrollClasses}`, style: backdropStyle, onClick: handleBackdropClick, "data-test-id": "dialog-root", children: _jsxs("div", { className: contentClass, style: contentWrapperStyle, onClick: (e) => e.stopPropagation(), "data-test-id": dataTestId || 'dialog-content', children: [title && title !== '' && (_jsxs("div", { className: `fs-dialog__header flex items-center gap-2 border-b border-border/70 px-4 pt-4 pb-3${headerTransparent ? ' fs-dialog__header--transparent' : ''}`, children: [_jsx("h2", { className: "title m-0 flex-1 text-left text-lg font-semibold text-foreground", "data-test-id": "dialog-title", children: title }), showCloseButton && (_jsx("div", { className: "flex justify-end w-auto", children: _jsx(Button, { variant: "outlined", size: "sm", onClick: handleCloseButtonClick, className: "ml-2", children: closeButtonText }) }))] })), _jsx("div", { className: `w-full ${title && title !== ''
                        ? 'px-4 pb-4 pt-3'
                        : 'p-4'} ${scroll === 'paper' ? 'fs-dialog__body--paper min-h-0 flex-1 overflow-y-auto overflow-x-hidden' : ''}`, "data-test-id": "dialog-body", children: children }), hasAlertArea && (_jsx("div", { className: "fs-dialog__alert-area px-4 py-3", "data-dialog-section": "alert-area", "data-test-id": "dialog-alert-area", role: "region", "aria-label": "Avisos", children: alertArea })), !hideActions && actions && (_jsx("div", { className: `fs-dialog__actions flex w-full flex-wrap items-center gap-2 border-t border-border/70 px-4 pb-4 pt-3 ${hasAlertArea ? 'mt-2' : ''} ${actionsJustify === 'between'
                        ? 'justify-between'
                        : actionsJustify === 'start'
                            ? 'justify-start'
                            : actionsJustify === 'end'
                                ? 'justify-end'
                                : 'justify-center'}`, "data-dialog-section": "actions", "data-test-id": "dialog-actions", role: "group", "aria-label": "Acciones", children: actions }))] }) }), document.body);
};
export default Dialog;
//# sourceMappingURL=Dialog.js.map