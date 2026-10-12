import React from "react";
import "./button.css";
interface ButtonPillProps {
    children: React.ReactNode;
    variant?: "primary" | "secondary" | "outlined";
    className?: string;
    disabled?: boolean;
    [key: string]: any;
}
export declare const ButtonPill: React.FC<ButtonPillProps>;
export {};
//# sourceMappingURL=ButtonPill.d.ts.map