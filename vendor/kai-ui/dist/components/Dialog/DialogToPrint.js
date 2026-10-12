"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Dialog from './Dialog';
import { Button } from '../Button/Button';
const DialogToPrint = ({ open, onClose, title, children, size = 'lg', printLabel = 'Imprimir', closeLabel = 'Cerrar', contentClassName = '', onBeforePrint, onAfterPrint, zIndex = 50, portalContainer, preferBrowserPrint = false, scroll = 'paper', printStyles, }) => {
    const printableRef = useRef(null);
    const [defaultPortalElement, setDefaultPortalElement] = useState(null);
    const isBrowser = typeof window !== 'undefined';
    useEffect(() => {
        if (!isBrowser || portalContainer) {
            setDefaultPortalElement(null);
            return;
        }
        const element = document.createElement('div');
        element.className = 'dialog-to-print-portal';
        document.body.appendChild(element);
        setDefaultPortalElement(element);
        return () => {
            document.body.removeChild(element);
        };
    }, [isBrowser, portalContainer]);
    const portalTarget = portalContainer !== null && portalContainer !== void 0 ? portalContainer : defaultPortalElement;
    const buildPrintableHtml = useCallback(() => {
        const content = printableRef.current;
        if (!content) {
            return null;
        }
        const headNodes = document.querySelectorAll('link[rel="stylesheet"], style');
        const styles = Array.from(headNodes)
            .map((node) => node.outerHTML)
            .join('\n');
        const baseHref = typeof window !== 'undefined' ? `${window.location.origin}/` : '/';
        const inlinePrintStyles = `
@media print {
  body {
    margin: 0;
    padding: 0;
  }
}
${printStyles !== null && printStyles !== void 0 ? printStyles : ''}`;
        return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charSet="utf-8" />
<title>${title !== null && title !== void 0 ? title : 'Documento'}</title>
<base href="${baseHref}" />
${styles}
<style>
${inlinePrintStyles}
</style>
</head>
<body>
<div id="print-root">${content.innerHTML}</div>
</body>
</html>`;
    }, [title]);
    const printWithIframe = useCallback((html, skipBeforeHook = false) => {
        if (!skipBeforeHook) {
            onBeforePrint === null || onBeforePrint === void 0 ? void 0 : onBeforePrint();
        }
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        iframe.setAttribute('aria-hidden', 'true');
        document.body.appendChild(iframe);
        const cleanup = () => {
            var _a;
            (_a = iframe.parentNode) === null || _a === void 0 ? void 0 : _a.removeChild(iframe);
            onAfterPrint === null || onAfterPrint === void 0 ? void 0 : onAfterPrint();
        };
        const iframeWindow = iframe.contentWindow;
        if (!iframeWindow) {
            cleanup();
            return;
        }
        iframe.onload = () => {
            iframeWindow.onafterprint = () => {
                cleanup();
                iframeWindow.onafterprint = null;
            };
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    try {
                        iframeWindow.focus();
                        iframeWindow.print();
                    }
                    catch (error) {
                        cleanup();
                    }
                });
            });
        };
        iframe.srcdoc = html;
    }, [onAfterPrint, onBeforePrint]);
    const handlePrint = useCallback(async () => {
        const printableHtml = buildPrintableHtml();
        if (!printableHtml) {
            return;
        }
        const electronAPI = typeof window !== 'undefined' ? window.electronAPI : undefined;
        if (preferBrowserPrint) {
            printWithIframe(printableHtml);
            return;
        }
        if (electronAPI === null || electronAPI === void 0 ? void 0 : electronAPI.printHtml) {
            onBeforePrint === null || onBeforePrint === void 0 ? void 0 : onBeforePrint();
            try {
                const result = await electronAPI.printHtml({
                    html: printableHtml,
                    title: title !== null && title !== void 0 ? title : 'Documento',
                    printBackground: true,
                });
                if (!(result === null || result === void 0 ? void 0 : result.success)) {
                    console.warn('[DialogToPrint] Silent print falló, usando método alternativo:', result === null || result === void 0 ? void 0 : result.error);
                    printWithIframe(printableHtml, true);
                }
                else {
                    onAfterPrint === null || onAfterPrint === void 0 ? void 0 : onAfterPrint();
                }
                return;
            }
            catch (error) {
                console.error('[DialogToPrint] Error en impresión silenciosa, usando fallback:', error);
                printWithIframe(printableHtml, true);
                return;
            }
        }
        printWithIframe(printableHtml);
    }, [buildPrintableHtml, onAfterPrint, onBeforePrint, printWithIframe, title]);
    const dialogContent = (_jsxs(Dialog, { open: open, onClose: onClose, title: title, size: size, hideActions: true, scroll: scroll, zIndex: zIndex, children: [_jsx("div", { ref: printableRef, className: `print-dialog-content ${contentClassName}`.trim(), "data-test-id": "print-dialog-content", children: children }), _jsxs("div", { className: "mt-6 flex justify-end gap-3", "data-test-id": "print-dialog-actions", children: [_jsx(Button, { variant: "outlined", onClick: onClose, children: closeLabel }), _jsx(Button, { variant: "primary", onClick: handlePrint, children: printLabel })] })] }));
    if (!isBrowser) {
        return null;
    }
    if (!portalTarget) {
        return null;
    }
    return createPortal(dialogContent, portalTarget);
};
export default DialogToPrint;
//# sourceMappingURL=DialogToPrint.js.map