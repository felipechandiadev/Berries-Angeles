import React from "react";
import "./button.css";
export type ButtonVariant = "primary" | "secondary" | "outlined" | "outlinedSecondary" | "text" | "danger";
export type ButtonSize = "sm" | "md" | "lg";
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
    className?: string;
    disabled?: boolean;
    loading?: boolean;
    /** Ignored (compat); use className w-full for full width */
    fullWidth?: boolean;
    /** Ignored (compat) */
    color?: string;
    "data-test-id"?: string;
}
export declare const Button: React.FC<ButtonProps>;
export {};
//# sourceMappingURL=Button.d.ts.map