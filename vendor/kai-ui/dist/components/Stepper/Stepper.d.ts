import React from "react";
import "./stepper.css";
export type StepperStepItem = {
    id: string;
    title: string;
    description?: string;
};
export type StepperProps = {
    steps: StepperStepItem[];
    /** Índice del paso activo (0-based). */
    activeIndex: number;
    /**
     * Contenido del paso (formularios), renderizado debajo del encabezado
     * visual del stepper.
     */
    children?: React.ReactNode;
    /**
     * Pie opcional bajo `children`. Si el Stepper va dentro de un `Dialog`, suele dejarse vacío
     * y colocar Atrás/Siguiente en `Dialog.actions` para un solo bloque de acciones en el modal
     * (ver editor de promociones en admin).
     */
    footer?: React.ReactNode;
    /** Contenido opcional alineado a la derecha en la fila superior (p. ej. título contextual). */
    headerAside?: React.ReactNode;
    /**
     * Si es true, al hacer clic en un paso ya completado (`index < activeIndex`)
     * se llama `onCompletedStepClick` con ese índice.
     */
    allowClickCompletedSteps?: boolean;
    onCompletedStepClick?: (index: number) => void;
    className?: string;
    contentClassName?: string;
    "data-test-id"?: string;
};
/**
 * Chrome presentacional para flujos multi-paso: puntos de estado,
 * título/descripción del paso actual y ranura para el cuerpo del paso.
 * No incluye lógica de formulario ni botones de navegación por defecto.
 */
export declare const Stepper: React.FC<StepperProps>;
export default Stepper;
//# sourceMappingURL=Stepper.d.ts.map