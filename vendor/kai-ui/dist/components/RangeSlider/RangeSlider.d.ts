import React from "react";
import "./range-slider.css";
interface RangeSliderProps {
    min?: number;
    max?: number;
    value?: [number, number];
    onChange?: (values: [number, number]) => void;
}
declare const RangeSlider: React.FC<RangeSliderProps>;
export default RangeSlider;
//# sourceMappingURL=RangeSlider.d.ts.map