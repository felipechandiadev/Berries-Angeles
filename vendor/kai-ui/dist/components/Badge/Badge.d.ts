import React from 'react';
import './badge.css';
export type BadgeVariant = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' | 'primary-outlined' | 'secondary-outlined' | 'success-outlined' | 'error-outlined' | 'warning-outlined' | 'info-outlined';
interface BadgeProps {
    children: React.ReactNode;
    variant?: BadgeVariant;
    className?: string;
}
declare const Badge: React.FC<BadgeProps>;
export default Badge;
//# sourceMappingURL=Badge.d.ts.map