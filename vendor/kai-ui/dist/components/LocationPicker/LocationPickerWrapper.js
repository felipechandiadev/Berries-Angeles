'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import dynamic from 'next/dynamic';
import { LoadingState } from '../LoadingState';
const LocationPickerComponent = dynamic(() => import('./LocationPicker'), {
    ssr: false,
    loading: () => (_jsx(LoadingState, { className: "flex items-center justify-center p-4", label: "Cargando mapa" })),
});
export default LocationPickerComponent;
//# sourceMappingURL=LocationPickerWrapper.js.map