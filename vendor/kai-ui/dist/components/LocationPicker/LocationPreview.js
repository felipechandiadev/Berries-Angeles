'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import dynamic from 'next/dynamic';
const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });
import 'leaflet/dist/leaflet.css';
/**
 * Componente de solo lectura para mostrar una ubicación en el mapa
 */
const LocationPreview = ({ latitude, longitude, height = 200, zoom = 15, className = '', }) => {
    const heightStyle = typeof height === 'number' ? `${height}px` : height;
    React.useEffect(() => {
        if (typeof window === 'undefined')
            return;
        void import('leaflet').then((L) => {
            try {
                // @ts-ignore
                delete L.default.Icon.Default.prototype._getIconUrl;
                L.default.Icon.Default.mergeOptions({
                    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
                    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                });
            }
            catch (err) {
                console.warn('[LocationPreview] leaflet icon merge failed', err);
            }
        });
    }, []);
    return (_jsxs("div", { className: "w-full", children: [_jsx("h5", { className: "text-base font-semibold mb-2", children: "Ubicaci\u00F3n en mapa" }), _jsx("div", { className: `overflow-hidden rounded-md border border-gray-200 ${className}`, style: { zIndex: 1, height: heightStyle, width: '100%' }, children: _jsxs(MapContainer, { center: [latitude, longitude], zoom: zoom, style: { height: '100%', width: '100%' }, attributionControl: false, scrollWheelZoom: false, dragging: false, doubleClickZoom: false, zoomControl: false, children: [_jsx(TileLayer, { url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" }), _jsx(Marker, { position: [latitude, longitude] })] }) })] }));
};
export default LocationPreview;
//# sourceMappingURL=LocationPreview.js.map