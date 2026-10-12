import React from "react";
export type PageLayoutHeaderProps = {
    title?: React.ReactNode;
    subtitle?: React.ReactNode;
    /** Slot derecho en la misma fila que el título (botones, tabs, toggles, etc.). */
    headerActions?: React.ReactNode;
    headerClassName?: string;
    titlesTestId?: string;
    subtitleTestId?: string;
    headerTestId?: string;
    headerRowTestId?: string;
    headerActionsTestId?: string;
};
/**
 * Encabezado compartido entre {@link BasicPageLayout} y {@link TabPageLayout}:
 * título y acciones en la misma fila; subtítulo debajo del título.
 */
export declare function PageLayoutHeader({ title, subtitle, headerActions, headerClassName, titlesTestId, subtitleTestId, headerTestId, headerRowTestId, headerActionsTestId, }: PageLayoutHeaderProps): React.JSX.Element | null;
//# sourceMappingURL=PageLayoutHeader.d.ts.map