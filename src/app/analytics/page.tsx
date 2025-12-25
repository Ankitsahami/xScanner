'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/layout/Header';
import { EnrichedPNode, NetworkStats, RegionStats, PNodesResponse } from '@/lib/types';
import { StatusDot } from '@/components/ui/Badge';
import { InlineStat } from '@/components/ui/StatCard';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    Legend
} from 'recharts';
import {
    Server,
    Package,
    Map as MapIcon,
    Search,
    Globe2
} from 'lucide-react';

// Dynamically import Globe3D
const Globe3D = dynamic(() => import('@/components/Globe3D'), {
    ssr: false,
    loading: () => (
        <div className="h-full bg-[#15181e] rounded-xl flex items-center justify-center border border-[#2a2d35]">
            <div className="text-center">
                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-gray-500">Loading Map...</p>
            </div>
        </div>
    ),
});

// Country flag emoji helper
function getCountryFlag(countryCode: string): string {
    if (!countryCode || countryCode.length !== 2) return '🌍';
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

export default function AnalyticsPage() {
    const [nodes, setNodes] = useState<EnrichedPNode[]>([]);
    const [stats, setStats] = useState<NetworkStats | null>(null);
    const [regionStats, setRegionStats] = useState<RegionStats[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<number>(0);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchData = useCallback(async () => {
        try {
            const nodesRes = await fetch('/api/pnodes');
            const nodesData: { success: boolean; data: PNodesResponse } = await nodesRes.json();

            if (nodesData.success && nodesData.data) {
                setNodes(nodesData.data.nodes);
                setStats(nodesData.data.stats);
            }

            const statsRes = await fetch('/api/stats');
            const statsData = await statsRes.json();

            if (statsData.success && statsData.data) {
                setRegionStats(statsData.data.regionStats);
            }

            setLastUpdated(Date.now());
        } catch (error) {
            console.error('Failed to fetch data:', error);
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

    // Filter nodes based on search
    const filteredNodes = useMemo(() => {
        if (!searchQuery.trim()) return nodes;
        const query = searchQuery.toLowerCase();
        return nodes.filter(node =>
            node.ipAddress.toLowerCase().includes(query) ||
            node.pubkey.toLowerCase().includes(query) ||
            node.location?.city?.toLowerCase().includes(query) ||
            node.location?.country?.toLowerCase().includes(query) ||
            node.version?.toLowerCase().includes(query)
        );
    }, [nodes, searchQuery]);

    // SECTION 2 Data: Version Distribution
    const versionData = useMemo(() => {
        const counts = filteredNodes.reduce((acc, node) => {
            const v = node.version || 'Unknown';
            acc[v] = (acc[v] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value) // Sort desc
            .slice(0, 8); // Top 8
    }, [filteredNodes]);

    // SECTION 2 Data: Top Nodes (Latest version + Online)
    const topNodes = useMemo(() => {
        return filteredNodes
            .filter(n => n.status === 'online') // Prioritize online
            .slice(0, 5);
    }, [filteredNodes]);

    // SECTION 3 Data: Geographic Distribution (Grouped: Online vs Offline)
    const geoData = useMemo(() => {
        return regionStats
            .sort((a, b) => b.totalNodes - a.totalNodes)
            .slice(0, 15) // Top 15 Countries
            .map(region => ({
                name: region.country,
                code: region.countryCode,
                Online: region.onlineNodes,
                Offline: region.offlineNodes,
                Syncing: region.syncingNodes
            }));
    }, [regionStats]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0f1115] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Loading analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f1115]">
            <Header
                onRefresh={handleRefresh}
                isRefreshing={isRefreshing}
                lastUpdated={lastUpdated}
            />

            <div className="p-6 space-y-8">

                {/* Search Bar (Optional, fitting nicely in layout) */}
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
                        <Globe2 className="w-6 h-6 text-amber-500" />
                        Network Analytics
                    </h1>
                    <div className="relative w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search nodes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-[#15181e] border border-[#2a2d35] rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-amber-500/50 transition-colors"
                        />
                    </div>
                </div>

                {/* SECTION 1: Top Map with Overlay */}
                <div className="h-[500px] w-full relative rounded-xl overflow-hidden border border-[#2a2d35] bg-[#15181e]">

                    {/* Network Stats Overlay */}
                    <div className="absolute top-6 left-6 z-10 w-64 pointer-events-none animate-fade-in-up">
                        <div className="glass-card p-4 pointer-events-auto shadow-2xl bg-black/40 backdrop-blur-md border border-white/5 rounded-xl">
                            <h3 className="text-xs uppercase tracking-wider text-gray-400 font-medium mb-4 flex items-center gap-2">
                                <Server className="w-3 h-3" />
                                Network Overview
                            </h3>
                            <div className="space-y-1">
                                <InlineStat
                                    label="Total Nodes"
                                    value={stats?.totalNodes || 0}
                                    icon={Server}
                                />
                                <div className="flex items-center justify-between py-2 border-t border-white/5 mt-2">
                                    <div className="flex items-center gap-2">
                                        <StatusDot status="online" />
                                        <span className="text-sm text-gray-300">Online</span>
                                    </div>
                                    <span className="text-sm font-medium text-green-400">
                                        {stats?.onlineNodes || 0}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-t border-white/5">
                                    <div className="flex items-center gap-2">
                                        <StatusDot status="syncing" />
                                        <span className="text-sm text-gray-300">Syncing</span>
                                    </div>
                                    <span className="text-sm font-medium text-amber-400">
                                        {stats?.syncingNodes || 0}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-t border-white/5">
                                    <div className="flex items-center gap-2">
                                        <StatusDot status="offline" />
                                        <span className="text-sm text-gray-300">Offline</span>
                                    </div>
                                    <span className="text-sm font-medium text-red-400">
                                        {stats?.offlineNodes || 0}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Globe3D
                        nodes={filteredNodes}
                        onNodeClick={(node) => window.location.href = `/nodes/${encodeURIComponent(node.ipAddress)}`}
                    />
                </div>

                {/* SECTION 2: Version Distribution & Top Nodes */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Version Distribution */}
                    <div className="bg-[#15181e] rounded-xl p-6 border border-[#2a2d35] animate-slide-in-left flex flex-col">
                        <h3 className="text-lg font-medium text-gray-200 mb-2 flex items-center gap-2">
                            <Package className="w-5 h-5 text-amber-500" />
                            Version Distribution
                        </h3>
                        <p className="text-xs text-gray-500 mb-6 pl-7">Distribution of node software versions</p>

                        <div className="flex-1 min-h-[400px] w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={versionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2d35" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#9ca3af"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        interval={0}
                                        angle={-45}
                                        textAnchor="end"
                                        height={60}
                                    />
                                    <YAxis
                                        stroke="#4b5563"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        allowDecimals={false}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#2a2d35', opacity: 0.4 }}
                                        contentStyle={{ backgroundColor: '#1f2229', borderColor: '#374151', color: '#fff' }}
                                        itemStyle={{ color: '#fbbf24' }}
                                        formatter={(value: any) => [`${value} Nodes`, 'Count']}
                                    />
                                    <Bar
                                        dataKey="value"
                                        fill="#f59e0b"
                                        radius={[4, 4, 0, 0]}
                                        animationDuration={1500}
                                        maxBarSize={60}
                                    >
                                        {versionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#fbbf24' : '#d97706'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Right: Top Nodes */}
                    <div className="bg-[#15181e] rounded-xl p-6 border border-[#2a2d35] animate-slide-in-right">
                        <h3 className="text-lg font-medium text-gray-200 mb-6 flex items-center gap-2">
                            <Server className="w-5 h-5 text-amber-500" />
                            Top Active Nodes
                        </h3>
                        <div className="space-y-3">
                            {topNodes.map((node, i) => (
                                <div
                                    key={node.ipAddress}
                                    className="flex items-center justify-between p-3 rounded-lg bg-[#1a1d24] hover:bg-[#1f2229] border border-transparent hover:border-amber-500/20 transition-all cursor-pointer group"
                                    onClick={() => window.location.href = `/nodes/${encodeURIComponent(node.ipAddress)}`}
                                    style={{ animationDelay: `${i * 100}ms` }}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-amber-500 text-black' :
                                            i === 1 ? 'bg-amber-500/50 text-white' :
                                                i === 2 ? 'bg-amber-500/20 text-amber-500' : 'bg-gray-700 text-gray-400'
                                            }`}>
                                            {i + 1}
                                        </div>
                                        <div>
                                            <p className="text-sm font-mono text-gray-200 group-hover:text-amber-400 transition-colors">
                                                {node.ipAddress}
                                            </p>
                                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                                {getCountryFlag(node.location?.countryCode || '')}
                                                {node.location?.city || 'Unknown Location'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="px-2 py-1 rounded text-[10px] bg-green-500/10 text-green-400 border border-green-500/20">
                                            {node.version || 'v0.0.0'}
                                        </span>
                                        <StatusDot status={node.status as any} />
                                    </div>
                                </div>
                            ))}
                            {topNodes.length === 0 && (
                                <div className="text-center py-10 text-gray-500">
                                    No active nodes found matching parameters.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* SECTION 3: Geographic Distribution (Grouped Bar Chart) */}
                <div className="bg-[#15181e] rounded-xl p-6 border border-[#2a2d35] animate-fade-in-up">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-medium text-gray-200 flex items-center gap-2">
                            <MapIcon className="w-5 h-5 text-amber-500" />
                            Geographic Distribution
                        </h3>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-sm bg-green-500" /> Online
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-sm bg-red-500" /> Offline
                            </div>
                        </div>
                    </div>

                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={geoData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d35" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="#4b5563"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#4b5563"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2229', borderColor: '#374151', color: '#fff' }}
                                    cursor={{ fill: '#2a2d35', opacity: 0.4 }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Bar dataKey="Online" fill="#22c55e" stackId="a" radius={[0, 0, 4, 4]} animationDuration={1500} />
                                <Bar dataKey="Syncing" fill="#f59e0b" stackId="a" animationDuration={1500} />
                                <Bar dataKey="Offline" fill="#ef4444" stackId="a" radius={[4, 4, 0, 0]} animationDuration={1500} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
}
