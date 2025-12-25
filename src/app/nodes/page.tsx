'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import StatCard from '@/components/ui/StatCard';
import { EnrichedPNode, NetworkStats, PNodesResponse } from '@/lib/types';
import { Server, Wifi, WifiOff, RefreshCw, MapPin, Check, X } from 'lucide-react';



// Truncate pubkey
function truncatePubkey(pubkey: string, chars = 8): string {
    if (pubkey.length <= chars * 2 + 3) return pubkey;
    return `${pubkey.slice(0, chars)}...${pubkey.slice(-chars)}`;
}

export default function NodesPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialSearch = searchParams.get('search') || '';

    const [nodes, setNodes] = useState<EnrichedPNode[]>([]);
    const [stats, setStats] = useState<NetworkStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<number>(0);

    const fetchData = useCallback(async () => {
        try {
            const response = await fetch('/api/pnodes');
            const data: { success: boolean; data: PNodesResponse } = await response.json();

            if (data.success && data.data) {
                setNodes(data.data.nodes);
                setStats(data.data.stats);
                setLastUpdated(Date.now());
            }
        } catch (error) {
            console.error('Failed to fetch pNodes:', error);
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

    const filterNodes = useCallback((node: EnrichedPNode, query: string): boolean => {
        const q = query.toLowerCase();

        // Search by IP
        if (node.ipAddress.toLowerCase().includes(q)) return true;

        // Search by Pubkey
        if (node.pubkey.toLowerCase().includes(q)) return true;

        // Search by RPC
        if (node.rpc && node.rpc.toLowerCase().includes(q)) return true;

        // Search by Location (City, Country, Country Code)
        if (node.location) {
            if (node.location.city.toLowerCase().includes(q)) return true;
            if (node.location.country.toLowerCase().includes(q)) return true;
            if (node.location.countryCode.toLowerCase().includes(q)) return true;
        }

        // Search by Version
        if (node.version && node.version.toLowerCase().includes(q)) return true;

        // Search by IP:Port
        if (`${node.ipAddress}:${node.port}`.includes(q)) return true;

        return false;
    }, []);

    const columns = [
        {
            key: 'ipAddress',
            header: 'IP Address',
            sortable: true,
            width: '150px',
            render: (node: EnrichedPNode) => (
                <span className="font-mono text-brand-400">{node.ipAddress}:{node.port}</span>
            ),
        },
        {
            key: 'pubkey',
            header: 'Public Key',
            render: (node: EnrichedPNode) => (
                <span className="font-mono text-dark-200">{truncatePubkey(node.pubkey)}</span>
            ),
        },
        {
            key: 'isRegistered',
            header: 'Registered',
            width: '100px',
            render: (node: EnrichedPNode) => (
                node.isRegistered
                    ? <Check className="w-4 h-4 text-status-online" />
                    : <X className="w-4 h-4 text-dark-500" />
            ),
        },
        {
            key: 'joinedAt',
            header: 'Joined',
            sortable: true,
            width: '100px',
            render: (node: EnrichedPNode) => {
                if (!node.joinedAt) return '-';
                const days = Math.floor((Date.now() - node.joinedAt) / (1000 * 60 * 60 * 24));
                return `${days}d ago`;
            },
        },
        {
            key: 'isPublic',
            header: 'Access',
            width: '100px',
            render: (node: EnrichedPNode) => (
                <Badge variant={node.isPublic ? 'public' : 'private'} size="sm">
                    {node.isPublic ? 'Public' : 'Private'}
                </Badge>
            ),
        },

        {
            key: 'location',
            header: 'Location',
            render: (node: EnrichedPNode) => (
                <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-dark-400" />
                    <span className="text-dark-200">
                        {node.location ? `${node.location.city}, ${node.location.country}` : 'Unknown'}
                    </span>
                </div>
            ),
        },
    ];

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-dark-300">Loading nodes...</p>
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
                        <Server className="w-6 h-6 text-brand-400" />
                        <h1 className="text-2xl font-semibold">Network Nodes</h1>
                    </div>
                    <p className="text-dark-300">
                        Complete overview of all nodes in the network
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                    <StatCard
                        title="Total Nodes"
                        value={stats?.totalNodes || 0}
                        icon={Server}
                    />
                    <StatCard
                        title="Online Nodes"
                        value={stats?.onlineNodes || 0}
                        icon={Wifi}
                        trend={{ value: 2.5, isPositive: true }}
                    />
                    <StatCard
                        title="Syncing"
                        value={stats?.syncingNodes || 0}
                        icon={RefreshCw}
                    />
                    <StatCard
                        title="Offline Nodes"
                        value={stats?.offlineNodes || 0}
                        icon={WifiOff}
                    />
                </div>

                {/* Note */}
                <div className="glass-card p-3 mb-4 text-sm text-dark-300">
                    <span className="text-dark-400">Note:</span> Most operators keep pRPC private for security.
                    Stats shown: {stats?.nodesReporting || 0} uptime, {stats?.nodesReporting || 0} storage,
                    {stats?.nodesReporting || 0} CPU, 0 latency (of {stats?.totalNodes || 0} total nodes).
                </div>

                {/* Data Table */}
                <DataTable
                    data={nodes}
                    columns={columns}
                    keyField="pubkey"
                    onRowClick={(node) => router.push(`/nodes/${node.ipAddress}`)}
                    searchPlaceholder="Search by IP, public key, location..."
                    itemsPerPage={15}
                    customFilter={filterNodes}
                    initialSearchQuery={initialSearch}
                />
            </div>
        </div>
    );
}
