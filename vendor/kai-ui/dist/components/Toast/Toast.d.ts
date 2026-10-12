import React from "react";
import "./toast.css";
export type ToastVariant = "success" | "info" | "warning" | "error";
export type ToastProps = {
    variant?: ToastVariant;
    message: string;
    onClose?: () => void;
    /** Applied while the toast is leaving the stack. */
    exiting?: boolean;
    className?: string;
    ["data-test-id"]?: string;
    onMouseEnter?: React.MouseEventHandler<HTMLDivElement>;
    onMouseLeave?: React.MouseEventHandler<HTMLDivElement>;
};
declare const Toast: React.FC<ToastProps>;
export default Toast;
//# sourceMappingURL=Toast.d.ts.map