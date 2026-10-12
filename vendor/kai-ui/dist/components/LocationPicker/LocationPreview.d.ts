import React from 'react';
import 'leaflet/dist/leaflet.css';
interface LocationPreviewProps {
    latitude: number;
    longitude: number;
    /** Altura del mapa (default: 200px) */
    height?: number | string;
    /** Nivel de zoom (default: 15) */
    zoom?: number;
    /** Clases CSS adicionales */
    className?: string;
}
/**
 * Componente de solo lectura para mostrar una ubicación en el mapa
 */
declare const LocationPreview: React.FC<LocationPreviewProps>;
export default LocationPreview;
//# sourceMappingURL=LocationPreview.d.ts.map