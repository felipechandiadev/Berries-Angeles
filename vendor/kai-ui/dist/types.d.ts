import type { ReactNode } from 'react';
/**
 * Tipos centralizados para componentes compartidos @kai/ui.
 */
export type AlertVariant = 'success' | 'info' | 'warning' | 'error';
export type ButtonVariant = 'primary' | 'secondary' | 'outlined' | 'outlinedSecondary' | 'text' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type TextFieldVariant = 'normal' | 'contrast' | 'autocomplete';
export interface SelectOption {
    id: string;
    label: string;
    disabled?: boolean;
}
export interface AutoCompleteOption {
    id: string;
    label: string;
    [key: string]: any;
}
export interface DataGridColumn {
    key: string;
    label: string;
    width?: string;
    sortable?: boolean;
    filterable?: boolean;
    render?: (value: unknown, row: unknown) => ReactNode;
}
export interface DataGridProps {
    columns: DataGridColumn[];
    data: unknown[];
    loading?: boolean;
    selectable?: boolean;
    pageable?: boolean;
    pageSize?: number;
    onRowClick?: (row: unknown) => void;
    onSelectionChange?: (selectedRows: unknown[]) => void;
}
export type BaseFormFieldType = 'text' | 'textarea' | 'autocomplete' | 'number' | 'numberStepper' | 'email' | 'password' | 'date' | 'switch' | 'select' | 'range' | 'location' | 'dni' | 'currency' | 'image' | 'video' | 'avatar';
export interface BaseFormField {
    name: string;
    label: string;
    type: BaseFormFieldType;
    required?: boolean;
    autoFocus?: boolean;
    options?: SelectOption[];
    multiline?: boolean;
    rows?: number;
    placeholder?: string;
    min?: number | string;
    max?: number | string;
    step?: number | string;
    pattern?: string;
    readOnly?: boolean;
    disabled?: boolean;
    hint?: string;
    errorMessage?: string;
    validation?: (value: any) => boolean | string;
}
export interface LocationCoordinates {
    latitude: number;
    longitude: number;
}
export interface UploadedFile {
    name: string;
    size: number;
    type: string;
    url?: string;
    data?: ArrayBuffer;
}
export interface Tab {
    id?: string;
    label: string;
    content: ReactNode;
    icon?: string;
    disabled?: boolean;
}
export interface RangeValue {
    min: number;
    max: number;
}
export interface DialogProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    actions?: {
        label: string;
        onClick: () => void;
        variant?: ButtonVariant;
    }[];
    size?: 'sm' | 'md' | 'lg';
}
export interface NumberStepperProps {
    value: number;
    min?: number;
    max?: number;
    step?: number;
    onChange: (value: number) => void;
    disabled?: boolean;
}
export interface SwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    disabled?: boolean;
    name?: string;
}
export interface TabsProps {
    tabs: Tab[];
    defaultTab?: string;
    onChange?: (tabId: string) => void;
    variant?: 'default' | 'outlined' | 'pills';
}
export interface TopBarItem {
    icon?: string;
    label: string;
    onClick?: () => void;
    badge?: number;
}
export interface TopBarProps {
    title?: string;
    logo?: string;
    items?: TopBarItem[];
    onMenuClick?: () => void;
    showMenu?: boolean;
}
//# sourceMappingURL=types.d.ts.map