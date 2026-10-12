import React from 'react';
import './number-stepper.css';
interface NumberStepperProps {
    label?: string;
    icon?: string;
    iconPosition?: 'above' | 'beside';
    value: number;
    onChange: (value: number) => void;
    step?: number;
    min?: number;
    max?: number;
    required?: boolean;
    allowNegative?: boolean;
    allowFloat?: boolean;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    ["data-test-id"]?: string;
}
export declare const NumberStepper: React.FC<NumberStepperProps>;
export default NumberStepper;
//# sourceMappingURL=NumberStepper.d.ts.map