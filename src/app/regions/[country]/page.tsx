'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Header from '@/components/layout/Header';
import {
    ArrowLeft,
    Heart,
    MapPin
} from 'lucide-react';
import Badge, { StatusDot } from '@/components/ui/Badge';
import { RegionStats, EnrichedPNode, PNodesResponse } from '@/lib/types';

// Dynamic import for MiniMap (Leaflet requires window)
const MiniMap = dynamic(() => import('@/components/MiniMap'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full bg-dark-800 animate-pulse flex items-center justify-center">
            <span className="text-xs text-dark-500">Loading map...</span>
        </div>
    ),
});

// Country flag
function getCountryFlag(countryCode: string): string {
    try {
        const codePoints = countryCode
            .toUpperCase()
            .split('')
            .map(char => 127397 + char.charCodeAt(0));
        return String.fromCodePoint(...codePoints);
    } catch {
        return '🌍';
    }
}

export default function RegionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const country = decodeURIComponent(params.country as string);

    const [regionStats, setRegionStats] = useState<RegionStats | null>(null);
    const [regionNodes, setRegionNodes] = useState<EnrichedPNode[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            // Fetch stats
            const statsRes = await fetch('/api/stats');
            const statsData = await statsRes.json();

            if (statsData.success && statsData.data) {
                const region = statsData.data.regionStats.find(
                    (r: RegionStats) => r.country === country
                );
                setRegionStats(region || null);
            }

            // Fetch nodes
            const nodesRes = await fetch('/api/pnodes');
            const nodesData: { success: boolean; data: PNodesResponse } = await nodesRes.json();

            if (nodesData.success && nodesData.data) {
                const filtered = nodesData.data.nodes.filter(
                    n => n.location?.country === country
                );
                setRegionNodes(filtered);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [country]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-dark-300">Loading region data...</p>
                </div>
            </div>
        );
    }

    if (!regionStats) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-xl text-dark-300 mb-4">Region not found</p>
                    <button onClick={() => router.back()} className="btn-primary">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <Header />

            <div className="p-6">
                {/* Back button */}
                <button
                    onClick={() => router.push('/regions')}
                    className="flex items-center gap-2 text-dark-300 hover:text-foreground mb-4 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Regions</span>
                </button>

                {/* Region Header */}
                <div className="glass-card p-6 mb-6">
                    <div className="flex items-start justify-between">
                        <div>
                            {/* Status badges */}
                            <div className="flex items-center gap-2 mb-3">
                                <Badge variant="default" size="sm">
                                    {regionStats.totalNodes} Nodes
                                </Badge>
                                <Badge variant="online" size="sm" dot>
                                    {regionStats.onlineNodes} Online
                                </Badge>
                                <Badge variant="offline" size="sm" dot>
                                    {regionStats.offlineNodes} Offline
                                </Badge>
                                <Badge variant="default" size="sm">
                                    {regionStats.countryCode}
                                </Badge>
                            </div>

                            {/* Country name with flag */}
                            <div className="flex items-center gap-4 mb-4">
                                <span className="text-5xl">{getCountryFlag(regionStats.countryCode)}</span>
                                <h1 className="text-3xl font-semibold">{country}</h1>
                            </div>

                            {/* Quick stats */}
                            <div className="flex items-center gap-6 text-sm">
                                {/* Storage removed */}
                                <div className="flex items-center gap-2">
                                    <Heart className="w-4 h-4 text-dark-400" />
                                    <span className="text-dark-300">Health Score</span>
                                    <span className="font-medium">{regionStats.healthScore}%</span>
                                </div>
                            </div>
                        </div>

                        {/* Mini Map */}
                        <div className="w-72 h-40 bg-dark-800 rounded-lg overflow-hidden">
                            {regionNodes.length > 0 && regionNodes[0].location ? (
                                <MiniMap
                                    lat={regionNodes[0].location.lat}
                                    lon={regionNodes[0].location.lon}
                                    label={country}
                                    zoom={4}
                                    className="h-full w-full"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-dark-500">
                                    <MapPin className="w-8 h-8 text-brand-400" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats Cards Removed */}

                {/* Region Nodes List */}
                <div className="glass-card p-5">
                    <h3 className="text-lg font-semibold mb-4">Nodes in {country}</h3>
                    <div className="space-y-2">
                        {regionNodes.slice(0, 10).map((node) => (
                            <div
                                key={node.pubkey}
                                onClick={() => router.push(`/nodes/${node.ipAddress}`)}
                                className="flex items-center justify-between p-3 bg-dark-800/50 rounded-lg hover:bg-dark-700/50 cursor-pointer transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <StatusDot status={node.status} />
                                    <span className="font-mono text-sm text-brand-400">
                                        {node.ipAddress}:{node.port}
                                    </span>
                                    <Badge variant={node.isPublic ? 'public' : 'private'} size="sm">
                                        {node.isPublic ? 'Public' : 'Private'}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                        {regionNodes.length > 10 && (
                            <p className="text-sm text-dark-400 text-center pt-2">
                                +{regionNodes.length - 10} more nodes
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
