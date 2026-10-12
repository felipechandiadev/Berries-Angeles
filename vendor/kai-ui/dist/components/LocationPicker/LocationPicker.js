'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import dynamic from 'next/dynamic';
import { AlertCircle } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), {
    ssr: false,
});
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });
import './location-picker.css';
const MapContainerAny = MapContainer;
const TileLayerAny = TileLayer;
const MarkerAny = Marker;
let customIcon = null;
let draggingIcon = null;
if (typeof window !== 'undefined') {
    import('leaflet').then((L) => {
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            shadowUrl: '',
        });
        customIcon = new L.Icon({
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            shadowUrl: '',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [0, 0],
        });
        draggingIcon = new L.Icon({
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            shadowUrl: '',
            iconSize: [30, 49],
            iconAnchor: [15, 49],
            popupAnchor: [1, -34],
            shadowSize: [0, 0],
        });
    });
}
const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-xl',
};
const variantClasses = {
    default: 'border border-border',
    flat: '',
    borderless: '',
};
const DraggableMarker = memo(function DraggableMarker({ position, draggable, onDragEnd, }) {
    const onDragEndRef = useRef(onDragEnd);
    onDragEndRef.current = onDragEnd;
    const eventHandlers = useMemo(() => ({
        dragstart: () => {
            if (draggingIcon) {
                // Leaflet will swap icon by instance.
            }
        },
        dragend: (e) => {
            const marker = e.target;
            if (customIcon)
                marker.setIcon(customIcon);
            const latlng = marker.getLatLng();
            onDragEndRef.current({ lat: latlng.lat, lng: latlng.lng });
        },
    }), []);
    return (_jsx(MarkerAny, { position: [position.lat, position.lng], draggable: draggable, eventHandlers: eventHandlers }));
});
function MapController({ positionToCenter, zoom, hasCenteredRef, }) {
    const map = require('react-leaflet').useMap();
    useEffect(() => {
        if (positionToCenter && !hasCenteredRef.current && map) {
            map.setView([positionToCenter.lat, positionToCenter.lng], zoom);
            hasCenteredRef.current = true;
        }
    }, [positionToCenter, zoom, map, hasCenteredRef]);
    return null;
}
export default function LocationPicker({ onChange, initialLat = -33.4489, initialLng = -70.6693, variant = 'default', rounded = 'md', className = '', draggable = true, mode = 'viewer', zoom = 13, height, fillContainer = false, externalPosition, recenterOnExternalChange = false, }) {
    const [position, setPosition] = useState(null);
    const [locationError, setLocationError] = useState(null);
    const containerRef = useRef(null);
    const hasCenteredInitially = useRef(false);
    const prevExternalRef = useRef(null);
    const [positionToCenter, setPositionToCenter] = useState(null);
    const isEditable = mode === 'edit' || mode === 'update';
    const extLat = externalPosition === null || externalPosition === void 0 ? void 0 : externalPosition.lat;
    const extLng = externalPosition === null || externalPosition === void 0 ? void 0 : externalPosition.lng;
    useEffect(() => {
        var _a, _b;
        if (mode === 'update' && extLat != null && extLng != null && !Number.isNaN(extLat) && !Number.isNaN(extLng)) {
            const fromParent = { lat: extLat, lng: extLng };
            setPosition(fromParent);
            const externalChanged = ((_a = prevExternalRef.current) === null || _a === void 0 ? void 0 : _a.lat) !== extLat || ((_b = prevExternalRef.current) === null || _b === void 0 ? void 0 : _b.lng) !== extLng;
            prevExternalRef.current = fromParent;
            if (recenterOnExternalChange && externalChanged) {
                hasCenteredInitially.current = false;
                setPositionToCenter(fromParent);
            }
            else if (!hasCenteredInitially.current) {
                setPositionToCenter(fromParent);
            }
        }
        else if (mode === 'edit' && !position) {
            if (typeof window === 'undefined')
                return;
            const timer = setTimeout(() => {
                if (!navigator.geolocation)
                    return;
                navigator.geolocation.getCurrentPosition((p) => {
                    const newPos = { lat: p.coords.latitude, lng: p.coords.longitude };
                    setPosition(newPos);
                    setPositionToCenter(newPos);
                    onChange === null || onChange === void 0 ? void 0 : onChange(newPos);
                }, () => {
                    const fallbackPos = { lat: initialLat, lng: initialLng };
                    setPosition(fallbackPos);
                    setPositionToCenter(fallbackPos);
                    onChange === null || onChange === void 0 ? void 0 : onChange(fallbackPos);
                }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 });
            }, 100);
            return () => clearTimeout(timer);
        }
        else if (initialLat != null && initialLng != null && !position) {
            const initialPos = { lat: initialLat, lng: initialLng };
            setPosition(initialPos);
            setPositionToCenter(initialPos);
        }
        else if (!position) {
            const defaultPos = { lat: initialLat, lng: initialLng };
            setPosition(defaultPos);
            setPositionToCenter(defaultPos);
            onChange === null || onChange === void 0 ? void 0 : onChange(defaultPos);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, extLat, extLng, initialLat, initialLng, recenterOnExternalChange]);
    const handleMarkerDragEnd = useCallback((newPos) => {
        if (!isEditable)
            return;
        setPosition(newPos);
        onChange === null || onChange === void 0 ? void 0 : onChange(newPos);
    }, [isEditable, onChange]);
    const MapEvents = () => {
        require('react-leaflet').useMapEvents({
            click: (e) => {
                if (!isEditable)
                    return;
                const newPosition = { lat: e.latlng.lat, lng: e.latlng.lng };
                setPosition(newPosition);
                onChange === null || onChange === void 0 ? void 0 : onChange(newPosition);
                if (containerRef.current) {
                    void containerRef.current; // no-op: mantener consistencia con Wrapper visual
                }
            },
        });
        return null;
    };
    const containerClasses = [
        'location-container overflow-hidden relative',
        variantClasses[variant],
        roundedClasses[rounded],
        !isEditable ? 'pointer-events-none' : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');
    const containerStyle = fillContainer
        ? { zIndex: 0, height: '100%', width: '100%' }
        : height
            ? { zIndex: 0, height: `${height}vh`, width: '100%' }
            : { zIndex: 0, height: '200px', width: '100%' };
    const mapInitialCenter = useRef(null);
    if (mapInitialCenter.current === null) {
        mapInitialCenter.current =
            mode === 'update' && externalPosition ? [externalPosition.lat, externalPosition.lng] : [initialLat, initialLng];
    }
    return (_jsxs("div", { ref: containerRef, className: containerClasses, style: containerStyle, children: [locationError ? (_jsx("div", { className: "absolute top-2 right-2 z-1000 max-w-xs", children: _jsx("div", { className: "bg-red-50 border border-red-200 rounded-lg p-3 shadow-sm", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(AlertCircle, { className: "text-red-500", size: 20 }), _jsx("span", { className: "text-red-700 text-sm font-medium", children: locationError })] }) }) })) : null, _jsxs(MapContainerAny, { center: mapInitialCenter.current, zoom: zoom, style: { height: '100%', width: '100%' }, attributionControl: false, className: !isEditable ? 'cursor-default' : 'cursor-crosshair', dragging: isEditable, zoomControl: isEditable, scrollWheelZoom: isEditable, doubleClickZoom: isEditable, touchZoom: isEditable, children: [_jsx(TileLayerAny, { url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" }), _jsx(MapController, { positionToCenter: positionToCenter, zoom: zoom, hasCenteredRef: hasCenteredInitially }), isEditable ? _jsx(MapEvents, {}) : null, position ? (_jsx(DraggableMarker, { position: position, draggable: isEditable && draggable, onDragEnd: handleMarkerDragEnd })) : null] })] }));
}
//# sourceMappingURL=LocationPicker.js.map