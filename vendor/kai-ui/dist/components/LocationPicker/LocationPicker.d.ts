import React from 'react';
import 'leaflet/dist/leaflet.css';
import './location-picker.css';
type LocationPickerVariant = 'default' | 'flat' | 'borderless';
type LocationPickerRounded = 'none' | 'sm' | 'md' | 'lg' | 'full';
type LocationPickerMode = 'viewer' | 'edit' | 'update';
export interface LocationPickerProps {
    onChange?: (coordinates: {
        lat: number;
        lng: number;
    } | null) => void;
    initialLat?: number;
    initialLng?: number;
    variant?: LocationPickerVariant;
    rounded?: LocationPickerRounded;
    className?: string;
    draggable?: boolean;
    mode?: LocationPickerMode;
    zoom?: number;
    height?: number;
    fillContainer?: boolean;
    externalPosition?: {
        lat: number;
        lng: number;
    };
    recenterOnExternalChange?: boolean;
}
export default function LocationPicker({ onChange, initialLat, initialLng, variant, rounded, className, draggable, mode, zoom, height, fillContainer, externalPosition, recenterOnExternalChange, }: LocationPickerProps): React.JSX.Element;
export {};
//# sourceMappingURL=LocationPicker.d.ts.map