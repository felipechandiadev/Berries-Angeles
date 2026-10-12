"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import './badge.css';
const variantClass = {
    primary: 'fs-badge--primary',
    secondary: 'fs-badge--secondary',
    success: 'fs-badge--success',
    error: 'fs-badge--error',
    warning: 'fs-badge--warning',
    info: 'fs-badge--info',
    'primary-outlined': 'fs-badge--primary-outlined',
    'secondary-outlined': 'fs-badge--secondary-outlined',
    'success-outlined': 'fs-badge--success-outlined',
    'error-outlined': 'fs-badge--error-outlined',
    'warning-outlined': 'fs-badge--warning-outlined',
    'info-outlined': 'fs-badge--info-outlined',
};
const Badge = ({ children, variant = 'primary', className = '' }) => {
    return (_jsx("span", { className: `fs-badge ${variantClass[variant]} ${className}`.trim(), children: children }));
};
export default Badge;
//# sourceMappingURL=Badge.js.map