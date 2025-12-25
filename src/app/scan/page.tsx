'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/layout/Header';
import { Search, MapPin, Loader2, Navigation, ChevronRight, ChevronLeft } from 'lucide-react';
import { EnrichedPNode, PNodesResponse, GeoLocation } from '@/lib/types';
import { getIpLocation } from '@/app/actions/scan';

// Dynamically import Globe3D
const Globe3D = dynamic(() => import('@/components/Globe3D'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full bg-[#0f1115] flex items-center justify-center border border-dark-700/30 rounded-xl min-h-[500px]">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
    ),
});

// Calculate Haversine distance
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
}

function deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
}

export default function ScanPage() {
    const [nodes, setNodes] = useState<EnrichedPNode[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
    const [userLocationInfo, setUserLocationInfo] = useState<GeoLocation | null>(null);
    const [nearbyNodes, setNearbyNodes] = useState<EnrichedPNode[]>([]);

    // Sidebar state
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Fetch all nodes on mount
    useEffect(() => {
        fetch('/api/pnodes')
            .then(res => res.json())
            .then((data: { success: boolean; data: PNodesResponse }) => {
                if (data.success && data.data) {
                    setNodes(data.data.nodes);
                }
            })
            .catch(err => console.error('Failed to fetch nodes:', err));
    }, []);



    const handleScan = async () => {
        if (!searchQuery.trim()) return;

        setIsScanning(true);
        // Ensure sidebar is open to see results
        setIsSidebarOpen(true);

        try {
            const location = await getIpLocation(searchQuery);
            if (location) {
                processLocation(location);
            } else {
                alert('Could not locate IP address');
            }
        } catch (error) {
            console.error('Scan failed:', error);
            alert('Scan failed. Please try again.');
        } finally {
            setIsScanning(false);
        }
    };

    const handleUseMyIP = async () => {
        setIsScanning(true);
        setIsSidebarOpen(true);
        try {
            const res = await fetch('https://api.ipify.org?format=json');
            const data = await res.json();
            if (data.ip) {
                setSearchQuery(data.ip);
                const location = await getIpLocation(data.ip);
                if (location) {
                    processLocation(location);
                }
            }
        } catch (error) {
            console.error('Failed to get IP:', error);
        } finally {
            setIsScanning(false);
        }
    };

    const processLocation = (location: GeoLocation) => {
        setUserLocation({ lat: location.lat, lon: location.lon });
        setUserLocationInfo(location);

        // Find nearby nodes
        const nodesWithDistance = nodes
            .filter(n => n.location)
            .map(n => ({
                ...n,
                distance: getDistance(location.lat, location.lon, n.location!.lat, n.location!.lon)
            }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 20); // Top 20 nearby

        setNearbyNodes(nodesWithDistance);
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            <div className="flex-1 flex overflow-hidden relative">

                {/* Hover Trigger Zone (when sidebar is closed) */}
                {!isSidebarOpen && (
                    <div
                        className="absolute left-0 top-0 bottom-0 w-4 z-50 cursor-e-resize"
                        onMouseEnter={() => setIsSidebarOpen(true)}
                    />
                )}

                {/* Sidebar (Left) */}
                <div
                    className={`border-r border-dark-700 bg-dark-900/95 backdrop-blur-sm flex flex-col transition-all duration-300 ease-in-out z-40 absolute h-full shadow-2xl ${isSidebarOpen ? "w-[400px] translate-x-0" : "w-[400px] -translate-x-full"
                        }`}
                >
                    {/* Sidebar Toggle Button (Visible when open) */}
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="absolute -right-3 top-1/2 -translate-y-1/2 bg-dark-800 border border-dark-600 rounded-full p-1 text-dark-300 hover:text-white z-50 cursor-pointer shadow-lg"
                        title="Close Sidebar"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>


                    <div className="p-6 border-b border-dark-700 flex justify-between items-center">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Search className="w-5 h-5 text-dark-400" />
                                <h1 className="text-xl font-semibold">Node Scanner</h1>
                            </div>
                            <p className="text-sm text-dark-400">
                                Find the closest nodes to any IP address
                            </p>
                        </div>
                    </div>

                    <div className="p-6 space-y-6 overflow-y-auto flex-1 scrollbar-thin">
                        {/* Input Section */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-dark-300 mb-1.5">
                                    IP Address
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="e.g., 192.190.136.35"
                                        className="flex-1 px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-sm focus:outline-none focus:border-brand-500"
                                        onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                                    />
                                    <button
                                        onClick={handleScan}
                                        disabled={isScanning}
                                        className="px-4 py-2 bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 border border-brand-500/50 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                                    >
                                        {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                        Scan
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={handleUseMyIP}
                                className="w-full py-2.5 bg-dark-800 hover:bg-dark-750 border border-dark-600 rounded-lg text-sm text-dark-200 flex items-center justify-center gap-2 transition-colors"
                            >
                                <Navigation className="w-4 h-4" />
                                Use My IP Address
                            </button>
                        </div>

                        {/* User Location Info - MOVED TO TOP as requested */}
                        {userLocationInfo && (
                            <div className="p-4 rounded-lg bg-dark-800/50 border border-brand-500/30 animate-fade-in">
                                <h3 className="text-xs uppercase text-dark-400 font-semibold mb-3 tracking-wider">Your Location</h3>
                                <div className="flex items-start gap-3">
                                    <div className="bg-brand-500/10 p-2 rounded-lg">
                                        <MapPin className="w-6 h-6 text-brand-500 shrink-0" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-lg text-foreground">
                                            {userLocationInfo.city}, {userLocationInfo.country}
                                        </p>
                                        <p className="text-xs text-dark-400 font-mono mt-1">
                                            Lat: {userLocationInfo.lat.toFixed(4)} • Lon: {userLocationInfo.lon.toFixed(4)}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                            <span className="text-xs text-green-400">Position Acquired</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Results List */}
                        {nearbyNodes.length > 0 && (
                            <div>
                                <h3 className="text-sm font-medium text-dark-300 mb-3 flex items-center justify-between">
                                    <span>Nodes Near Me</span>
                                    <span className="text-xs bg-dark-800 px-2 py-0.5 rounded-full">{nearbyNodes.length} visible</span>
                                </h3>
                                <div className="space-y-3">
                                    {nearbyNodes.map((node, index) => (
                                        <div
                                            key={node.pubkey}
                                            className="p-3 rounded-lg bg-dark-800 border border-dark-700 hover:border-dark-600 transition-colors cursor-pointer group"
                                            onClick={() => window.open(`/nodes/${node.ipAddress}`, '_blank')}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-mono text-xs text-dark-400 truncate w-32">
                                                    {node.pubkey}
                                                </span>
                                                <span className="text-xs font-medium text-brand-400">
                                                    {(node as unknown as { distance: number }).distance?.toFixed(1) || '0.0'}km
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-dark-200">
                                                        {node.location?.city}, {node.location?.country}
                                                    </span>
                                                </div>
                                                <div className="flex gap-2">
                                                    {index === 0 && (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 border border-brand-500/30">
                                                            Closest
                                                        </span>
                                                    )}
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${node.status === 'online' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                        node.status === 'syncing' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                            'bg-red-500/10 text-red-500 border-red-500/20'
                                                        }`}>
                                                        {node.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!userLocationInfo && !isScanning && (
                            <div className="text-center py-8 text-dark-400 text-sm border-t border-dark-800 mt-4">
                                Enter an IP address to begin scanning
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Toggle (Visible when closed) */}
                {!isSidebarOpen && (
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="absolute left-0 top-1/2 -translate-y-1/2 bg-dark-800 border border-dark-600 rounded-r-lg p-2 text-dark-300 hover:text-white z-50 cursor-pointer shadow-lg animate-fade-in-right"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                )}

                {/* Map Area (Right) - Occupies full space */}
                <div className="w-full h-full bg-[#0f1115] relative">
                    <Globe3D
                        nodes={nodes}
                        userLocation={userLocation}
                        nearbyNodes={nearbyNodes}
                        onMapClick={() => {
                            if (isSidebarOpen) setIsSidebarOpen(false);
                        }}
                    /><div className="absolute top-4 right-4 z-10 glass-card p-3 pointer-events-none">
                        <div className="space-y-2 pointer-events-auto">
                            <h4 className="text-xs font-medium text-dark-400 mb-2">Map Legend</h4>
                            <div className="flex items-center gap-2 text-xs text-dark-200">
                                <div className="w-2 h-2 rounded-full bg-amber-500 border border-white" />
                                <span>Your Location</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-dark-200">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                <span>Nearby Node</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-dark-200">
                                <div className="w-1 h-1 rounded-full bg-slate-600" />
                                <span>Other Node</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
