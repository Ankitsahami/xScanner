'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Header from '@/components/layout/Header';
import Badge from '@/components/ui/Badge';
import { EnrichedPNode, PNodesResponse } from '@/lib/types';
import {
    ArrowLeft,
    MapPin,
    Clock,
    Network,
    Copy,
    Check
} from 'lucide-react';
// Dynamic import for MiniMap (Leaflet requires window)
const MiniMap = dynamic(() => import('@/components/MiniMap'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full bg-dark-800 animate-pulse flex items-center justify-center">
            <span className="text-xs text-dark-500">Loading map...</span>
        </div>
    ),
});

export default function NodeDetailPage() {
    const params = useParams();
    const router = useRouter();
    const ipAddress = params.address as string;

    const [node, setNode] = useState<EnrichedPNode | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const response = await fetch('/api/pnodes');
            const data: { success: boolean; data: PNodesResponse } = await response.json();

            if (data.success && data.data) {
                const foundNode = data.data.nodes.find(n => n.ipAddress === ipAddress);
                setNode(foundNode || null);
            }
        } catch (error) {
            console.error('Failed to fetch node:', error);
        } finally {
            setIsLoading(false);
        }
    }, [ipAddress]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCopy = async (text: string) => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-dark-300">Loading node details...</p>
                </div>
            </div>
        );
    }

    if (!node) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-xl text-dark-300 mb-4">Node not found</p>
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
                    onClick={() => router.push('/nodes')}
                    className="flex items-center gap-2 text-dark-300 hover:text-foreground mb-4 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Nodes</span>
                </button>

                {/* Node Header Card */}
                <div className="glass-card p-6 mb-6">
                    <div className="flex items-start justify-between">
                        <div>
                            {/* Status badges */}
                            <div className="flex items-center gap-2 mb-3">
                                <Badge variant={node.status} dot>
                                    {node.status.charAt(0).toUpperCase() + node.status.slice(1)}
                                </Badge>
                                <Badge variant={node.isPublic ? 'public' : 'private'}>
                                    {node.isPublic ? 'Public' : 'Private'}
                                </Badge>
                                {node.joinedAt && (
                                    <span className="text-xs text-dark-400 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        Joined {new Date(node.joinedAt).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                )}
                            </div>

                            {/* IP Address */}
                            <h1 className="text-3xl font-mono font-semibold text-brand-400 mb-2">
                                {node.ipAddress}:{node.port}
                            </h1>

                            {/* Location */}
                            <div className="flex items-center gap-2 text-dark-300 mb-2">
                                <MapPin className="w-4 h-4" />
                                <span>
                                    {node.location
                                        ? `${node.location.city}, ${node.location.country}`
                                        : 'Unknown location'}
                                </span>
                            </div>

                            {/* Version */}
                            <p className="text-sm text-dark-400">
                                Version {node.version || 'Unknown'}
                            </p>

                            {/* Pubkey */}
                            <div className="flex items-center gap-2 mt-4">
                                <span className="font-mono text-sm text-dark-300 bg-dark-800 px-3 py-1.5 rounded-lg">
                                    {node.pubkey.slice(0, 20)}...{node.pubkey.slice(-8)}
                                </span>
                                <button
                                    onClick={() => handleCopy(node.pubkey)}
                                    className="p-1.5 rounded hover:bg-dark-700 transition-colors"
                                >
                                    {copied ? (
                                        <Check className="w-4 h-4 text-status-online" />
                                    ) : (
                                        <Copy className="w-4 h-4 text-dark-400" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Mini Map */}
                        <div className="w-64 h-40 bg-dark-800 rounded-lg overflow-hidden">
                            {node.location ? (
                                <MiniMap
                                    lat={node.location.lat}
                                    lon={node.location.lon}
                                    label={`${node.ipAddress}:${node.port}`}
                                    zoom={6}
                                    className="h-full w-full"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-dark-500">
                                    No location data
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Node Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Info */}
                    <div className="glass-card p-5">
                        <h3 className="text-sm font-medium text-dark-300 mb-4 flex items-center gap-2">
                            <Network className="w-4 h-4 text-brand-400" />
                            Network Details
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between py-2 border-b border-dark-700">
                                <span className="text-sm text-dark-300">Address</span>
                                <span className="font-mono text-sm">{node.ipAddress}:{node.port}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-dark-700">
                                <span className="text-sm text-dark-300">RPC Port</span>
                                <span className="font-mono text-sm">{node.rpc || 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <span className="text-sm text-dark-300">Registered</span>
                                <div className="flex items-center gap-1">
                                    {node.isRegistered ? (
                                        <>
                                            <Check className="w-4 h-4 text-status-online" />
                                            <span className="text-status-online">Yes</span>
                                        </>
                                    ) : (
                                        <span className="text-dark-400">No</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
