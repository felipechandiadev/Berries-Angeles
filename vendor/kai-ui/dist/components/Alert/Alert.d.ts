import React from "react";
import "./alert.css";
export type AlertVariant = "success" | "info" | "warning" | "error";
interface AlertProps {
    variant?: AlertVariant;
    children: React.ReactNode;
    className?: string;
    ["data-test-id"]?: string;
}
declare const Alert: React.FC<AlertProps>;
export default Alert;
//# sourceMappingURL=Alert.d.ts.map