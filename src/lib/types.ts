// pNode types
export interface PNode {
    pubkey: string;
    gossip: string;
    rpc: string | null;
    tpu: string | null;
    tpuForwards: string | null;
    tpuVote: string | null;
    serveRepair: string | null;
    tpuQuic: string | null;
    tpuForwardsQuic: string | null;
    version: string | null;
    featureSet: number | null;
    shredVersion: number;
}

export interface EnrichedPNode extends PNode {
    id: string;
    ipAddress: string;
    port: number;
    status: 'online' | 'syncing' | 'offline';
    location?: GeoLocation;
    lastSeen: number;
    joinedAt?: number;
    isRegistered: boolean;
    isPublic: boolean;
}

export interface GeoLocation {
    ip: string;
    country: string;
    countryCode: string;
    region: string;
    regionName: string;
    city: string;
    lat: number;
    lon: number;
    timezone: string;
    isp: string;
}



export interface NodeMetrics {
    // Empty or removed
}

export interface NetworkStats {
    totalNodes: number;
    onlineNodes: number;
    syncingNodes: number;
    offlineNodes: number;
    nodesReporting: number;
    timestamp: number;
}

export interface RegionStats {
    country: string;
    countryCode: string;
    totalNodes: number;
    onlineNodes: number;
    offlineNodes: number;
    syncingNodes: number;
    healthScore: number;    // 0-100
}

export interface HistoricalDataPoint {
    timestamp: number;
    totalNodes: number;
    onlineNodes: number;
}

export interface NodeHistoryPoint {
    timestamp: string;
    latency: number;
    uptime: number;
}

export interface TimeRange {
    label: string;
    value: '1h' | '6h' | '24h' | '7d' | '30d';
    ms: number;
}

export const TIME_RANGES: TimeRange[] = [
    { label: '1H', value: '1h', ms: 60 * 60 * 1000 },
    { label: '6H', value: '6h', ms: 6 * 60 * 60 * 1000 },
    { label: '24H', value: '24h', ms: 24 * 60 * 60 * 1000 },
    { label: '7D', value: '7d', ms: 7 * 24 * 60 * 60 * 1000 },
    { label: '30D', value: '30d', ms: 30 * 24 * 60 * 60 * 1000 },
];

// API Response types
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    timestamp: number;
}

export interface PNodesResponse {
    nodes: EnrichedPNode[];
    stats: NetworkStats;
    lastUpdated: number;
}

// Chat types
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

// Constants
export const XANDEUM_SEED_NODES = [
    'https://api.devnet.xandeum.com:8899',
];

export const REFRESH_INTERVAL = 30000; // 30 seconds
export const GEO_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
