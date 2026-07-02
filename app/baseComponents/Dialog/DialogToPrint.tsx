"use client";
import React, { useCallback, useRef } from 'react';
import Dialog from './Dialog';
import { Button } from '../Button/Button';

interface DialogToPrintProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /**
   * Optional size forwarded to the base Dialog component.
   * Defaults to `lg` which gives a comfortable width for printable content.
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  /**
   * Text for the print action button.
   */
  printLabel?: string;
  /**
   * Text for the close action button.
   */
  closeLabel?: string;
  /**
   * Optional className applied to the internal printable container.
   */
  contentClassName?: string;
  /**
   * Called right before opening the print preview.
   */
  onBeforePrint?: () => void;
  /**
   * Called after the print window is closed.
   */
  onAfterPrint?: () => void;
}

const DialogToPrint: React.FC<DialogToPrintProps> = ({
  open,
  onClose,
  title,
  children,
  size = 'lg',
  printLabel = 'Imprimir',
  closeLabel = 'Cerrar',
  contentClassName = '',
  onBeforePrint,
  onAfterPrint,
}) => {
  const printableRef = useRef<HTMLDivElement | null>(null);

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

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charSet="utf-8" />
<title>${title ?? 'Documento'}</title>
<base href="${baseHref}" />
${styles}
<style>
  @media print {
    body {
      margin: 0;
      padding: 0;
    }
  }
</style>
</head>
<body>
<div id="print-root">${content.innerHTML}</div>
</body>
</html>`;
  }, [title]);

  const printWithIframe = useCallback((html: string, skipBeforeHook = false) => {
    if (!skipBeforeHook) {
      onBeforePrint?.();
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
      iframe.parentNode?.removeChild(iframe);
      onAfterPrint?.();
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
          } catch (error) {
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

    const electronAPI = typeof window !== 'undefined' ? (window as any).electronAPI : undefined;

    if (electronAPI?.printHtml) {
      onBeforePrint?.();
      try {
        const result = await electronAPI.printHtml({
          html: printableHtml,
          title: title ?? 'Documento',
          printBackground: true,
        });

        if (!result?.success) {
          console.warn('[DialogToPrint] Silent print falló, usando método alternativo:', result?.error);
          printWithIframe(printableHtml, true);
        } else {
          onAfterPrint?.();
        }
        return;
      } catch (error) {
        console.error('[DialogToPrint] Error en impresión silenciosa, usando fallback:', error);
        printWithIframe(printableHtml, true);
        return;
      }
    }

    printWithIframe(printableHtml);
  }, [buildPrintableHtml, onAfterPrint, onBeforePrint, printWithIframe, title]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      size={size}
      hideActions
      scroll="paper"
    >
      <div
        ref={printableRef}
        className={`print-dialog-content ${contentClassName}`.trim()}
        data-test-id="print-dialog-content"
      >
        {children}
      </div>

      <div className="mt-6 flex justify-end gap-3" data-test-id="print-dialog-actions">
        <Button variant="outlined" onClick={onClose}>
          {closeLabel}
        </Button>
        <Button variant="primary" onClick={handlePrint}>
          {printLabel}
        </Button>
      </div>
    </Dialog>
  );
};

export default DialogToPrint;
