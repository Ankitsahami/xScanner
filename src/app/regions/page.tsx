'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
import { RegionStats } from '@/lib/types';
import { MapPin, Server, Wifi, Heart } from 'lucide-react';

// Country flag emoji
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

export default function RegionsPage() {
    const router = useRouter();
    const [regionStats, setRegionStats] = useState<RegionStats[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<number>(0);

    const fetchData = useCallback(async () => {
        try {
            const response = await fetch('/api/stats');
            const data = await response.json();

            if (data.success && data.data) {
                setRegionStats(data.data.regionStats);
                setLastUpdated(Date.now());
            }
        } catch (error) {
            console.error('Failed to fetch regions:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchData();
    };

    // Calculate totals
    const totalNodes = regionStats.reduce((sum, r) => sum + r.totalNodes, 0);
    const totalOnline = regionStats.reduce((sum, r) => sum + r.onlineNodes, 0);
    const totalCountries = regionStats.length;

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-dark-300">Loading regions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <Header
                onRefresh={handleRefresh}
                isRefreshing={isRefreshing}
                lastUpdated={lastUpdated}
            />

            <div className="p-6">
                {/* Page Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <MapPin className="w-6 h-6 text-brand-400" />
                        <h1 className="text-2xl font-semibold">Regions</h1>
                    </div>
                    <p className="text-dark-300">
                        Geographic distribution of pNodes across {totalCountries} countries
                    </p>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                    <StatCard
                        title="Total Countries"
                        value={totalCountries}
                        icon={MapPin}
                    />
                    <StatCard
                        title="Total Nodes"
                        value={totalNodes}
                        icon={Server}
                    />
                    <StatCard
                        title="Online Nodes"
                        value={totalOnline}
                        icon={Wifi}
                        trend={{ value: 2.1, isPositive: true }}
                    />
                    <StatCard
                        title="Avg Health Score"
                        value={`${Math.round(regionStats.reduce((sum, r) => sum + r.healthScore, 0) / regionStats.length || 0)}%`}
                        icon={Heart}
                    />
                </div>

                {/* Regions Grid */}
                <div className="grid grid-cols-3 gap-4">
                    {regionStats.map((region) => (
                        <div
                            key={region.country}
                            onClick={() => router.push(`/regions/${encodeURIComponent(region.country)}`)}
                            className="glass-card p-5 cursor-pointer hover:border-brand-500/30 hover:shadow-glow transition-all duration-300"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">{getCountryFlag(region.countryCode)}</span>
                                    <div>
                                        <h3 className="font-semibold text-foreground">{region.country}</h3>
                                        <p className="text-sm text-dark-400">{region.countryCode}</p>
                                    </div>
                                </div>
                                <Badge
                                    variant={region.healthScore >= 70 ? 'online' : region.healthScore >= 40 ? 'syncing' : 'offline'}
                                    size="sm"
                                >
                                    {region.healthScore}%
                                </Badge>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div>
                                    <p className="text-lg font-semibold text-foreground">{region.totalNodes}</p>
                                    <p className="text-xs text-dark-400">Nodes</p>
                                </div>
                                <div>
                                    <p className="text-lg font-semibold text-status-online">{region.onlineNodes}</p>
                                    <p className="text-xs text-dark-400">Online</p>
                                </div>
                                <div>
                                    <p className="text-lg font-semibold text-status-offline">{region.offlineNodes}</p>
                                    <p className="text-xs text-dark-400">Offline</p>
                                </div>
                            </div>

                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
