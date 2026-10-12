import React from "react";
import "./dot-progress.css";
export type DotProgressVariant = "step" | "wave";
interface DotProgressProps {
    size?: number;
    gap?: number;
    colorPrimary?: string;
    colorNeutral?: string;
    className?: string;
    interval?: number;
    /** Cantidad de bolitas. Si no se pasa, se usa `totalSteps`. */
    count?: number;
    /** Alias de `count`. El indicador de pasos del stepper lo sigue usando. */
    totalSteps?: number;
    activeStep?: number;
    /** `step` ilumina una bolita. `wave` las hace saltar en secuencia. */
    variant?: DotProgressVariant;
}
declare const DotProgress: React.FC<DotProgressProps>;
export default DotProgress;
//# sourceMappingURL=DotProgress.d.ts.map