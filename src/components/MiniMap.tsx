'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Next.js
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

// Custom marker icon for nodes
const NodeIcon = L.divIcon({
    className: 'custom-node-marker',
    html: `<div style="
    width: 14px;
    height: 14px;
    background: #f59e0b;
    border: 2px solid #fff;
    border-radius: 50%;
    box-shadow: 0 0 10px rgba(245, 158, 11, 0.5);
  "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MiniMapProps {
    lat: number;
    lon: number;
    label?: string;
    zoom?: number;
    className?: string;
}

// Component to recenter map when coordinates change
function RecenterMap({ lat, lon }: { lat: number; lon: number }) {
    const map = useMap();

    useEffect(() => {
        map.setView([lat, lon]);
    }, [map, lat, lon]);

    return null;
}

export default function MiniMap({
    lat,
    lon,
    label,
    zoom = 6,
    className = ''
}: MiniMapProps) {
    return (
        <div className={`relative overflow-hidden rounded-lg ${className}`}>
            <MapContainer
                center={[lat, lon]}
                zoom={zoom}
                scrollWheelZoom={false}
                dragging={false}
                zoomControl={false}
                attributionControl={false}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                <Marker position={[lat, lon]} icon={NodeIcon}>
                    {label && (
                        <Popup>
                            <span className="text-xs font-medium">{label}</span>
                        </Popup>
                    )}
                </Marker>
                <RecenterMap lat={lat} lon={lon} />
            </MapContainer>

            {/* Coordinate overlay */}
            <div className="absolute bottom-2 left-2 bg-dark-900/80 backdrop-blur-sm px-2 py-1 rounded text-xs text-dark-300 z-10">
                {lat.toFixed(4)}°, {lon.toFixed(4)}°
            </div>
        </div>
    );
}
