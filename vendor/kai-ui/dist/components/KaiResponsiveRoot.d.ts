export type KaiResponsiveRootProps = {
    children: React.ReactNode;
    /**
     * Escribe `data-kai-bp` en `<html>` (default true).
     * La densidad tipográfica/spacing la controlan las media queries de `tokens.css`.
     */
    syncHtmlAttribute?: boolean;
};
/**
 * Montar cerca de la raíz de la PWA (p. ej. Providers).
 * Expone el breakpoint en `document.documentElement.dataset.kaiBp`.
 */
export declare function KaiResponsiveRoot({ children, syncHtmlAttribute, }: KaiResponsiveRootProps): import("react").JSX.Element;
//# sourceMappingURL=KaiResponsiveRoot.d.ts.map