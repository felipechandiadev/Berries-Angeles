'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Dialog from '../Dialog/Dialog';
import { Button } from '../Button/Button';
import IconButton from '../IconButton/IconButton';
import { usePrint } from './usePrint';
import styles from './PrintDialog.module.css';
export const PrintDialog = ({ open, onClose, children, title = 'Imprimir', fileName = 'documento', disablePrint = false, printLoading = false, showPrintButton = true, printIconButton = false, size = 'md', customSize, maxWidth, fullWidth = false, scroll = 'body', zIndex = 50, contentStyle, extraActions, pageSize = 'A4', pageOrientation = 'portrait', }) => {
    const { contentRef, handlePrint } = usePrint(fileName, pageSize, pageOrientation);
    return (_jsx(Dialog, { open: open, onClose: onClose, title: title, size: size, customSize: customSize, maxWidth: maxWidth, fullWidth: fullWidth, scroll: scroll, zIndex: zIndex, contentStyle: contentStyle, children: _jsxs("div", { className: styles.printContainer, children: [_jsx("div", { ref: contentRef, className: styles.printContent, children: children }), _jsxs("div", { className: styles.actions, children: [extraActions && _jsx("div", { className: styles.extraActions, children: extraActions }), showPrintButton &&
                            (printIconButton ? (_jsx(IconButton, { icon: "Printer", variant: "action", size: "md", disabled: disablePrint, isLoading: printLoading, title: "Imprimir", ariaLabel: "Imprimir", onClick: () => {
                                    handlePrint();
                                }, "data-test-id": "print-dialog-print" })) : (_jsx(Button, { variant: "primary", disabled: disablePrint, loading: printLoading, onClick: () => {
                                    handlePrint();
                                }, children: printLoading ? 'Cargando análisis...' : '🖨️ Imprimir' })))] })] }) }));
};
export default PrintDialog;
//# sourceMappingURL=PrintDialog.js.map