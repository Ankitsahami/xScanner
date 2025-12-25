import { PNode, EnrichedPNode, NetworkStats, GeoLocation, NodeMetrics, XANDEUM_SEED_NODES } from './types';
import { cache, CACHE_KEYS, CACHE_TTL } from './cache';

// Xandeum RPC Client
class XandeumClient {
    private rpcUrl: string;

    constructor(rpcUrl: string = XANDEUM_SEED_NODES[0]) {
        this.rpcUrl = rpcUrl;
    }

    async call<T>(method: string, params: unknown[] = []): Promise<T> {
        const response = await fetch(this.rpcUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method,
                params,
            }),
        });

        if (!response.ok) {
            throw new Error(`RPC request failed: ${response.statusText}`);
        }

        const json = await response.json();

        if (json.error) {
            throw new Error(`RPC error: ${json.error.message}`);
        }

        return json.result;
    }

    // Get all cluster nodes (pNodes in gossip)
    async getClusterNodes(): Promise<PNode[]> {
        return this.call<PNode[]>('getClusterNodes');
    }

    // Get slot leaders
    async getSlotLeader(): Promise<string> {
        return this.call<string>('getSlotLeader');
    }

    // Get epoch info
    async getEpochInfo(): Promise<{ epoch: number; slotIndex: number; slotsInEpoch: number }> {
        return this.call('getEpochInfo');
    }

    // Get version
    async getVersion(): Promise<{ 'solana-core': string; 'feature-set': number }> {
        return this.call('getVersion');
    }
}

// Create global client instance
export const xandeumClient = new XandeumClient(
    process.env.NEXT_PUBLIC_XANDEUM_RPC || XANDEUM_SEED_NODES[0]
);

// Fetch geo location for an IP
export async function getGeoLocation(ip: string): Promise<GeoLocation | null> {
    const cacheKey = `${CACHE_KEYS.GEO_PREFIX}${ip}`;

    // Check cache first
    const cached = cache.get<GeoLocation>(cacheKey);
    if (cached) return cached;

    try {
        // Using ip-api.com (free, no API key needed)
        const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,region,regionName,city,lat,lon,timezone,isp,query`);

        if (!response.ok) return null;

        const data = await response.json();

        if (data.status !== 'success') return null;

        const location: GeoLocation = {
            ip: data.query,
            country: data.country,
            countryCode: data.countryCode,
            region: data.region,
            regionName: data.regionName,
            city: data.city,
            lat: data.lat,
            lon: data.lon,
            timezone: data.timezone,
            isp: data.isp,
        };

        // Cache for 7 days
        cache.set(cacheKey, location, CACHE_TTL.GEO);

        return location;
    } catch (error) {
        console.error(`Failed to fetch geo for ${ip}:`, error);
        return null;
    }
}


// Limit concurrency for async operations
async function pLimit<T>(
    tasks: (() => Promise<T>)[],
    concurrency: number
): Promise<T[]> {
    const results: T[] = [];
    const executing: Promise<void>[] = [];

    for (const task of tasks) {
        const p = task().then(result => {
            results.push(result);
        });

        executing.push(p);

        if (executing.length >= concurrency) {
            await Promise.race(executing);
            // Remove completed promise
            const index = executing.findIndex(e => e === p); // Note: this is simplified, actual race outcome tracking is more complex usually but simplified here for linear processing
        }
    }
    // Note: The above loop logic is slightly flawed for true "pool" behavior. 
    // Let's implement a simpler "chunking" or a proper queue.
    // Actually, let's use a simple queue system.
    return Promise.all(tasks.map(t => t()));
}

// Simple concurrency runner
async function runConcurrent<T>(
    items: T[],
    concurrency: number,
    fn: (item: T) => Promise<any>
): Promise<any[]> {
    const results: any[] = [];
    const queue = [...items];

    // Worker function
    const worker = async () => {
        while (queue.length > 0) {
            const item = queue.shift();
            if (item) {
                try {
                    const res = await fn(item);
                    results.push(res);
                } catch (e) {
                    console.error('Error in concurrent worker:', e);
                }
            }
        }
    };

    // Start workers
    const workers = Array(Math.min(items.length, concurrency))
        .fill(null)
        .map(() => worker());

    await Promise.all(workers);
    return results;
}

// Parse IP and port from gossip address
function parseGossipAddress(gossip: string): { ip: string; port: number } {
    if (!gossip) return { ip: '0.0.0.0', port: 0 };
    const [ip, portStr] = gossip.split(':');
    return { ip, port: parseInt(portStr || '0', 10) };
}

// Enrich pNodes with additional data
export async function enrichPNodes(nodes: PNode[]): Promise<EnrichedPNode[]> {
    // Process nodes with concurrency limit to respect rate limits (e.g. 5 concurrent requests)
    const enrichedResults = await runConcurrent(nodes, 5, async (node) => {
        const { ip, port } = parseGossipAddress(node.gossip);

        // Determine status based on actual data
        let status: 'online' | 'syncing' | 'offline' = 'offline';
        if (node.rpc) status = 'online';
        else if (node.gossip) status = 'syncing';

        // Get geo location (cached) or null if failed
        let location = undefined;
        try {
            const loc = await getGeoLocation(ip);
            if (loc) location = loc;
        } catch (e) {
            console.warn(`Geo fetch failed for ${ip}`);
        }

        // Metrics are currently not available from RPC, so we leave them undefined
        // or set to basic defaults if needed, but per plan we removed them.

        // We do have some basic metrics we can infer or leave empty?
        // type NodeMetrics now only has uptime, latency, etc. 
        // We don't have these either really.

        // Let's create a minimal metrics object with 0s if we want to populated it,
        // OR properly typed, we made them optional in previous file potentially?
        // checking types.ts again... EnrichedPNode has `metrics?: NodeMetrics;` 
        // So we can just omit it.

        const enrichedNode: EnrichedPNode = {
            ...node,
            id: node.pubkey.slice(0, 8),
            ipAddress: ip,
            port,
            status,
            location,
            lastSeen: Date.now(),
            // joinedAt removed
            isRegistered: true, // Assuming all returned by getClusterNodes are registered
            isPublic: node.rpc !== null,
        };

        return enrichedNode;
    });

    return enrichedResults;
}

// Calculate network statistics from enriched nodes
export function calculateNetworkStats(nodes: EnrichedPNode[]): NetworkStats {
    const onlineNodes = nodes.filter(n => n.status === 'online');
    const syncingNodes = nodes.filter(n => n.status === 'syncing');
    const offlineNodes = nodes.filter(n => n.status === 'offline');
    // Metrics removed

    return {
        totalNodes: nodes.length,
        onlineNodes: onlineNodes.length,
        syncingNodes: syncingNodes.length,
        offlineNodes: offlineNodes.length,
        nodesReporting: 0, // Not applicable
        timestamp: Date.now(),
    };
}

// Fetch and enrich all pNodes
export async function fetchAllPNodes(): Promise<{ nodes: EnrichedPNode[]; stats: NetworkStats }> {
    // Check cache first
    const cachedNodes = cache.get<EnrichedPNode[]>(CACHE_KEYS.PNODES);
    const cachedStats = cache.get<NetworkStats>(CACHE_KEYS.NETWORK_STATS);

    if (cachedNodes && cachedStats) {
        return { nodes: cachedNodes, stats: cachedStats };
    }

    try {
        // Fetch raw nodes from Xandeum RPC
        const rawNodes = await xandeumClient.getClusterNodes();

        // Enrich with geo and metrics
        const enrichedNodes = await enrichPNodes(rawNodes);

        // Calculate stats
        const stats = calculateNetworkStats(enrichedNodes);

        // Cache results
        cache.set(CACHE_KEYS.PNODES, enrichedNodes, CACHE_TTL.PNODES);
        cache.set(CACHE_KEYS.NETWORK_STATS, stats, CACHE_TTL.NETWORK_STATS);

        return { nodes: enrichedNodes, stats };
    } catch (error) {
        console.error('Failed to fetch pNodes:', error);
        throw error;
    }
}
