'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { EnrichedPNode } from '@/lib/types';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface Globe3DProps {
    nodes: EnrichedPNode[];
    onNodeClick?: (node: EnrichedPNode) => void;
    onNodeHover?: (node: EnrichedPNode | null) => void;
    // Scanner specific props
    userLocation?: { lat: number; lon: number } | null;
    nearbyNodes?: EnrichedPNode[];
    onMapClick?: () => void;
}

const GLOBE_STYLE: maplibregl.StyleSpecification = {
    version: 8,
    name: 'Dark Globe',
    sources: {
        'countries': {
            type: 'geojson',
            data: 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_admin_0_countries.geojson'
        },
        'country-labels': {
            type: 'geojson',
            data: 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_admin_0_countries.geojson'
        },
        'cities': {
            type: 'geojson',
            data: 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_populated_places_simple.geojson'
        }
    },
    layers: [
        // Ocean background (black)
        {
            id: 'background',
            type: 'background',
            paint: {
                'background-color': '#0f1115'
            }
        },
        // Land fill (dark gray)
        {
            id: 'land',
            type: 'fill',
            source: 'countries',
            paint: {
                'fill-color': '#1a1d24',
                'fill-opacity': 1
            }
        },
        {
            id: 'country-borders',
            type: 'line',
            source: 'countries',
            paint: {
                'line-color': '#c9a66b',
                'line-width': [
                    'interpolate', ['linear'], ['zoom'],
                    1, 0.3,
                    3, 0.6,
                    5, 1,
                    8, 1.5
                ],
                'line-opacity': [
                    'interpolate', ['linear'], ['zoom'],
                    1, 0.4,
                    3, 0.6,
                    5, 0.8
                ]
            }
        },
        // Country labels - visible at low zoom, fade at high zoom
        {
            id: 'country-labels',
            type: 'symbol',
            source: 'country-labels',
            minzoom: 1,
            maxzoom: 6,
            layout: {
                'text-field': ['upcase', ['get', 'name']],
                'text-font': ['Open Sans Bold'],
                'text-size': [
                    'interpolate', ['linear'], ['zoom'],
                    1, 10,
                    3, 14,
                    5, 18
                ],
                'text-transform': 'uppercase',
                'text-letter-spacing': 0.1,
                'text-max-width': 8
            },
            paint: {
                'text-color': '#9ca3af',
                'text-halo-color': '#000000',
                'text-halo-width': 1.5,
                'text-opacity': [
                    'interpolate', ['linear'], ['zoom'],
                    1, 0.6,
                    3, 1,
                    5, 0.7,
                    6, 0
                ]
            }
        },
        // City labels - appear at higher zoom
        {
            id: 'city-labels',
            type: 'symbol',
            source: 'cities',
            minzoom: 4,
            layout: {
                'text-field': ['get', 'name'],
                'text-font': ['Open Sans Regular'],
                'text-size': [
                    'interpolate', ['linear'], ['zoom'],
                    4, 8,
                    6, 11,
                    8, 14
                ],
                'text-offset': [0, 0.5],
                'text-anchor': 'top'
            },
            paint: {
                'text-color': '#64748b',
                'text-halo-color': '#000000',
                'text-halo-width': 1,
                'text-opacity': [
                    'interpolate', ['linear'], ['zoom'],
                    4, 0,
                    5, 0.7,
                    7, 1
                ]
            }
        },
        // City markers - small dots
        {
            id: 'city-markers',
            type: 'circle',
            source: 'cities',
            minzoom: 4,
            paint: {
                'circle-radius': [
                    'interpolate', ['linear'], ['zoom'],
                    4, 1,
                    8, 3
                ],
                'circle-color': '#475569',
                'circle-opacity': [
                    'interpolate', ['linear'], ['zoom'],
                    4, 0,
                    5, 0.6,
                    7, 0.8
                ]
            }
        }
    ],
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf'
};

// Zoom threshold for stopping rotation
const ROTATION_STOP_ZOOM = 3;

export default function Globe3D({ nodes, onNodeClick, onNodeHover, userLocation, nearbyNodes, onMapClick }: Globe3DProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const markersRef = useRef<maplibregl.Marker[]>([]);
    const userMarkersRef = useRef<maplibregl.Marker[]>([]);
    const rotationRef = useRef<NodeJS.Timeout | null>(null);
    const [isMapLoaded, setIsMapLoaded] = useState(false);
    const [isRotating, setIsRotating] = useState(true);
    const [currentZoom, setCurrentZoom] = useState(1.5);

    // If userLocation is present, disable auto-rotation by default
    useEffect(() => {
        if (userLocation) {
            setIsRotating(false);
            if (rotationRef.current) {
                clearInterval(rotationRef.current);
                rotationRef.current = null;
            }
        }
    }, [userLocation]);

    // Refs for stable access in effects/intervals
    const onMapClickRef = useRef(onMapClick);
    const userLocationRef = useRef(userLocation);

    // Update refs
    useEffect(() => {
        onMapClickRef.current = onMapClick;
        userLocationRef.current = userLocation;
    }, [onMapClick, userLocation]);

    // Start rotation function
    const startRotation = useCallback(() => {
        // Don't rotate if viewing a specific location (check ref to avoid dependency)
        if (userLocationRef.current) return;

        if (rotationRef.current) clearInterval(rotationRef.current);

        rotationRef.current = setInterval(() => {
            if (mapRef.current && !mapRef.current.isMoving()) {
                const zoom = mapRef.current.getZoom();
                // STOP rotation when zoomed in past threshold
                if (zoom >= ROTATION_STOP_ZOOM) {
                    setIsRotating(false);
                    return;
                }
                setIsRotating(true);
                const center = mapRef.current.getCenter();
                // Speed based on zoom: slower as you zoom in
                const speed = Math.max(0.02, 0.08 - (zoom * 0.02));
                mapRef.current.setCenter([center.lng + speed, center.lat]);
            }
        }, 50);
    }, []);

    // Stop rotation function
    const stopRotation = useCallback(() => {
        if (rotationRef.current) {
            clearInterval(rotationRef.current);
            rotationRef.current = null;
        }
        setIsRotating(false);
    }, []);

    // Initialize map
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        const map = new maplibregl.Map({
            container: mapContainerRef.current,
            style: GLOBE_STYLE,
            center: [0, 15],
            zoom: 1.3,
            maxZoom: 8,
            minZoom: 0.8,
            projection: 'globe'
        } as maplibregl.MapOptions);

        map.on('load', () => {
            setIsMapLoaded(true);
            map.resize();
            // Start rotation only if we are not already focusing on a location
            if (!userLocationRef.current) {
                startRotation();
            }
        });

        map.on('click', () => {
            onMapClickRef.current?.();
        });

        // Track zoom level
        map.on('zoom', () => {
            const zoom = map.getZoom();
            setCurrentZoom(zoom);

            // Stop rotation when zoomed in
            if (zoom >= ROTATION_STOP_ZOOM) {
                stopRotation();
            }
        });

        // Stop rotation during user interaction
        map.on('mousedown', stopRotation);
        map.on('touchstart', stopRotation);
        map.on('dragstart', stopRotation);

        // Resume rotation after interaction IF zoomed out and no user location
        const resumeIfZoomedOut = () => {
            setTimeout(() => {
                if (mapRef.current && !userLocationRef.current) {
                    const zoom = mapRef.current.getZoom();
                    if (zoom < ROTATION_STOP_ZOOM) {
                        startRotation();
                    }
                }
            }, 2000); // 2 second delay before resuming
        };

        map.on('mouseup', resumeIfZoomedOut);
        map.on('touchend', resumeIfZoomedOut);
        map.on('dragend', resumeIfZoomedOut);
        map.on('zoomend', resumeIfZoomedOut);

        mapRef.current = map;

        return () => {
            setIsMapLoaded(false); // CRITICAL: Reset loaded state
            stopRotation();
            map.remove();
            mapRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty dependencies = Run once!

    // Add node markers with popups (Standard Nodes)
    useEffect(() => {
        if (!mapRef.current || !isMapLoaded) return;

        // Remove existing standard markers
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];

        // Add new markers
        nodes.forEach((node) => {
            if (!node.location) return;

            // Create marker element
            const el = document.createElement('div');
            el.className = 'node-marker';

            // Color based on status
            let color = '#06b6d4';
            let statusText = 'Unknown';
            switch (node.status) {
                case 'online': color = '#22c55e'; statusText = 'Online'; break;
                case 'syncing': color = '#f59e0b'; statusText = 'Syncing'; break;
                case 'offline': color = '#ef4444'; statusText = 'Offline'; break;
            }

            el.style.cssText = `
                width: 12px;
                height: 12px;
                background-color: ${color};
                border-radius: 50%;
                box-shadow: 0 0 8px ${color}, 0 0 16px ${color}40;
                cursor: pointer;
                transition: transform 0.2s, box-shadow 0.2s;
            `;

            // Create popup with node information
            const popup = new maplibregl.Popup({
                closeButton: false,
                closeOnClick: false,
                offset: 15,
                className: 'node-popup'
            }).setHTML(`
                <div style="
                    background: rgba(15, 23, 42, 0.95);
                    border: 1px solid ${color};
                    border-radius: 8px;
                    padding: 12px;
                    min-width: 180px;
                    font-family: system-ui, sans-serif;
                ">
                    <div style="color: ${color}; font-weight: 600; font-size: 11px; margin-bottom: 6px;">
                        ● ${statusText}
                    </div>
                    <div style="color: #fff; font-size: 12px; margin-bottom: 4px; word-break: break-all;">
                        ${node.ipAddress || 'Unknown IP'}:${node.port || '?'}
                    </div>
                    <div style="color: #64748b; font-size: 10px; word-break: break-all;">
                        ${node.pubkey.slice(0, 16)}...${node.pubkey.slice(-8)}
                    </div>
                    ${node.location ? `
                        <div style="color: #94a3b8; font-size: 10px; margin-top: 6px;">
                            📍 ${node.location.city || ''} ${node.location.country || ''}
                        </div>
                    ` : ''}
                </div>
            `);

            el.onmouseenter = () => {
                el.style.transform = 'scale(1.5)';
                el.style.boxShadow = `0 0 12px ${color}, 0 0 24px ${color}60`;
                popup.addTo(mapRef.current!);
                onNodeHover?.(node);
            };
            el.onmouseleave = () => {
                el.style.transform = 'scale(1)';
                el.style.boxShadow = `0 0 8px ${color}, 0 0 16px ${color}40`;
                popup.remove();
                onNodeHover?.(null);
            };
            el.onclick = (e) => {
                e.stopPropagation(); // Prevent map click (sidebar close)
                onNodeClick?.(node);
            };

            const marker = new maplibregl.Marker({ element: el })
                .setLngLat([node.location.lon, node.location.lat])
                .setPopup(popup)
                .addTo(mapRef.current!);

            markersRef.current.push(marker);
        });
    }, [nodes, isMapLoaded, onNodeClick, onNodeHover]);

    // Handle Scanner Specifics (User Location & Lines)
    useEffect(() => {
        if (!mapRef.current || !isMapLoaded) return;

        // Cleanup scanner markers/lines
        userMarkersRef.current.forEach(m => m.remove());
        userMarkersRef.current = [];
        if (mapRef.current.getLayer('connection-lines')) mapRef.current.removeLayer('connection-lines');
        if (mapRef.current.getSource('connections')) mapRef.current.removeSource('connections');

        if (userLocation) {
            // 1. Add User Marker
            const userEl = document.createElement('div');
            userEl.innerHTML = '<div class="w-4 h-4 bg-amber-500 rounded-full border-2 border-white shadow-[0_0_20px_rgba(245,158,11,0.5)]"></div>';
            const userMarker = new maplibregl.Marker({ element: userEl })
                .setLngLat([userLocation.lon, userLocation.lat])
                .addTo(mapRef.current!);
            userMarkersRef.current.push(userMarker);

            // 2. Draw popup markers for Nearby Nodes (Green Dots)
            if (nearbyNodes && nearbyNodes.length > 0) {
                // Draw Lines
                const features: GeoJSON.Feature[] = nearbyNodes
                    .filter(node => node.location)
                    .map(node => ({
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: 'LineString',
                            coordinates: [
                                [userLocation.lon, userLocation.lat],
                                [node.location!.lon, node.location!.lat]
                            ]
                        }
                    }));

                mapRef.current.addSource('connections', {
                    type: 'geojson',
                    data: { type: 'FeatureCollection', features }
                });

                mapRef.current.addLayer({
                    id: 'connection-lines',
                    type: 'line',
                    source: 'connections',
                    layout: { 'line-join': 'round', 'line-cap': 'round' },
                    paint: {
                        'line-color': '#f59e0b', // Amber/Yellow
                        'line-width': 1.5,
                        'line-opacity': 0.6,
                        'line-dasharray': [2, 2] // Dashed lines
                    }
                });

                // Draw Green Markers with Popups
                nearbyNodes.forEach(node => {
                    if (!node.location) return;

                    const el = document.createElement('div');
                    el.style.cssText = `
                        width: 12px;
                        height: 12px;
                        background-color: #22c55e;
                        border-radius: 50%;
                        box-shadow: 0 0 10px rgba(34,197,94,0.5);
                        cursor: pointer;
                        z-index: 10;
                    `;

                    // Create Popup
                    const popup = new maplibregl.Popup({
                        closeButton: false,
                        closeOnClick: false,
                        offset: 15,
                        className: 'nearby-popup'
                    }).setHTML(`
                        <div style="
                            background: rgba(15, 23, 42, 0.95);
                            border: 1px solid #22c55e;
                            border-radius: 12px;
                            padding: 16px;
                            min-width: 220px;
                            font-family: system-ui, sans-serif;
                            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
                        ">
                            <div style="margin-bottom: 12px;">
                                <div style="color: #64748b; font-size: 10px; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 4px;">PUBLIC ID</div>
                                <div style="color: #94a3b8; font-size: 11px; font-family: monospace; word-break: break-all; line-height: 1.4;">
                                    ${node.pubkey}
                                </div>
                            </div>
                            
                            <div style="margin-bottom: 12px;">
                                <div style="color: #64748b; font-size: 10px; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 4px;">LOCATION</div>
                                <div style="color: #fff; font-size: 13px; font-weight: 500;">
                                    ${node.location?.city || 'Unknown'}, <span style="color: #cbd5e1;">${node.location?.country || ''}</span>
                                </div>
                            </div>

                            <div>
                                <div style="color: #64748b; font-size: 10px; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 4px;">IP ADDRESS</div>
                                <div style="color: #22c55e; font-size: 13px; font-family: monospace;">
                                    ${node.ipAddress}
                                </div>
                            </div>

                            <div style="position: absolute; bottom: 12px; right: 12px; width: 8px; height: 8px; background: #22c55e; border-radius: 50%; box-shadow: 0 0 8px #22c55e;"></div>
                        </div>
                    `);

                    el.onmouseenter = () => {
                        el.style.transform = 'scale(1.2)';
                        popup.addTo(mapRef.current!);
                    };
                    el.onmouseleave = () => {
                        el.style.transform = 'scale(1)';
                        popup.remove();
                    };

                    const marker = new maplibregl.Marker({ element: el })
                        .setLngLat([node.location.lon, node.location.lat])
                        .setPopup(popup)
                        .addTo(mapRef.current!);

                    userMarkersRef.current.push(marker);
                });
            }

            // 3. Fly to user location
            mapRef.current.flyTo({
                center: [userLocation.lon, userLocation.lat],
                zoom: 4.5, // Scanner zoom level
                speed: 1.5,
                curve: 1
            });
        }
    }, [userLocation, nearbyNodes, isMapLoaded]);

    // Control functions
    const handleZoomIn = useCallback(() => {
        stopRotation();
        mapRef.current?.zoomIn({ duration: 500 });
    }, [stopRotation]);

    const handleZoomOut = useCallback(() => {
        stopRotation();
        mapRef.current?.zoomOut({ duration: 500 });
    }, [stopRotation]);

    const handleReset = useCallback(() => {
        mapRef.current?.flyTo({
            center: [0, 20],
            zoom: 1.5,
            duration: 1500
        });
        if (!userLocation) {
            setTimeout(() => startRotation(), 1600);
        }
    }, [startRotation, userLocation]);

    return (
        <div className="globe-container relative rounded-xl overflow-hidden bg-[#0f1115] border border-dark-700/30">
            {/* Map container */}
            <div
                ref={mapContainerRef}
                className="w-full h-full"
                style={{ width: '100%', height: '100%', minHeight: '400px' }}
            />

            {/* Control buttons */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                <button
                    onClick={handleZoomIn}
                    className="p-2 bg-dark-800/80 hover:bg-dark-700 rounded-lg border border-dark-600 transition-colors"
                    title="Zoom In"
                >
                    <ZoomIn className="w-4 h-4 text-dark-200" />
                </button>
                <button
                    onClick={handleReset}
                    className="p-2 bg-dark-800/80 hover:bg-dark-700 rounded-lg border border-dark-600 transition-colors"
                    title="Reset View"
                >
                    <RotateCcw className="w-4 h-4 text-dark-200" />
                </button>
                <button
                    onClick={handleZoomOut}
                    className="p-2 bg-dark-800/80 hover:bg-dark-700 rounded-lg border border-dark-600 transition-colors"
                    title="Zoom Out"
                >
                    <ZoomOut className="w-4 h-4 text-dark-200" />
                </button>
            </div>

            {/* Status indicator */}
            <div className="absolute top-3 right-3 flex items-center gap-2 z-10 text-xs">
                <div className={`w-2 h-2 rounded-full ${isRotating ? 'bg-green-500' : 'bg-amber-500'}`} />
                <span className="text-dark-400">
                    {isRotating ? 'Rotating' : currentZoom >= ROTATION_STOP_ZOOM ? 'Zoomed In' : 'Paused'}
                </span>
            </div>

            {/* Loading state */}
            {!isMapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-dark-900">
                    <div className="text-dark-400 text-sm">Loading globe...</div>
                </div>
            )}
        </div>
    );
}
