'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/layout/Header';
import { InlineStat } from '@/components/ui/StatCard';
import { StatusDot } from '@/components/ui/Badge';
import { EnrichedPNode, NetworkStats, PNodesResponse } from '@/lib/types';
import {
  Server,
  Clock,
  Cpu,
  MemoryStick,
  Timer,
  HardDrive,
  Database,
  Activity,
  Zap,
  TrendingUp,
  Coins,
  Radio,
  MapPin
} from 'lucide-react';

// Dynamically import Globe3D to avoid SSR issues with Three.js
const Globe3D = dynamic(() => import('@/components/Globe3D'), {
  ssr: false,
  loading: () => (
    <div className="globe-container rounded-xl bg-dark-800/50 border border-dark-700 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-dark-300">Loading globe...</p>
      </div>
    </div>
  ),
});

// Format uptime from seconds to human readable
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return `${days}d ${hours}h`;
}

// Format large numbers
function formatNumber(num: number): string {
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toLocaleString();
}

export default function OverviewPage() {
  const [nodes, setNodes] = useState<EnrichedPNode[]>([]);
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number>(0);
  const [hoveredNode, setHoveredNode] = useState<EnrichedPNode | null>(null);


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

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };



  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-dark-300">Loading network data...</p>
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


      {/* Main Globe Area */}
      <div className="flex-1 p-4">
        {/* Globe Header */}
        <div className="flex items-center justify-between mb-4">
          {/* Node Status Legend */}
          <div className="flex items-center gap-4 glass-card px-4 py-2">
            <span className="text-xs text-dark-400">Node Status</span>
            <div className="flex items-center gap-2">
              <StatusDot status="online" />
              <span className="text-xs text-dark-200">Online</span>
            </div>
            <div className="flex items-center gap-2">
              <StatusDot status="syncing" />
              <span className="text-xs text-dark-200">Syncing</span>
            </div>
            <div className="flex items-center gap-2">
              <StatusDot status="offline" />
              <span className="text-xs text-dark-200">Offline</span>
            </div>
            <span className="text-xs text-dark-500 border-l border-dark-600 pl-4">
              {nodes.length} nodes
            </span>
          </div>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search nodes by pubkey, address, or location..."
              className="w-80 px-4 py-2 bg-dark-800 border border-dark-600 rounded-lg text-sm placeholder:text-dark-400 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {/* Globe */}
        <div className="h-[600px] relative">
          {/* Network Stats Overlay */}
          <div className="absolute top-4 left-4 z-10 w-64 pointer-events-none">
            <div className="glass-card p-4 pointer-events-auto">
              <h3 className="text-xs uppercase tracking-wider text-dark-400 font-medium mb-3">
                Network Stats
              </h3>
              <div className="space-y-1">
                <InlineStat
                  label="Total Nodes"
                  value={stats?.totalNodes || 0}
                  icon={Server}
                />
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <StatusDot status="online" />
                    <span className="text-sm text-dark-200">Online</span>
                  </div>
                  <span className="text-sm font-medium text-status-online">
                    {stats?.onlineNodes || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <StatusDot status="syncing" />
                    <span className="text-sm text-dark-200">Syncing</span>
                  </div>
                  <span className="text-sm font-medium text-status-syncing">
                    {stats?.syncingNodes || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-dark-700">
                  <div className="flex items-center gap-2">
                    <StatusDot status="offline" />
                    <span className="text-sm text-dark-200">Offline</span>
                  </div>
                  <span className="text-sm font-medium text-status-offline">
                    {stats?.offlineNodes || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Globe3D
            nodes={nodes}
            onNodeHover={setHoveredNode}
            onNodeClick={(node) => {
              // Navigate to node detail page
              window.location.href = `/nodes/${encodeURIComponent(node.ipAddress)}`;
            }}
          />
        </div>



        {/* Hovered Node Tooltip */}
        {hoveredNode && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 glass-card p-4 z-50 animate-fade-in">
            <div className="flex items-center gap-4">
              <StatusDot status={hoveredNode.status} size="lg" />
              <div>
                <p className="font-medium text-foreground">
                  {hoveredNode.ipAddress}:{hoveredNode.port}
                </p>
                <div className="flex items-center gap-2 text-sm text-dark-300">
                  <MapPin className="w-3 h-3" />
                  <span>
                    {hoveredNode.location?.city}, {hoveredNode.location?.country}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
