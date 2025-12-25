import { NextResponse } from 'next/server';
import { fetchAllPNodes } from '@/lib/xandeum';
import { EnrichedPNode, RegionStats } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 30;

// Calculate stats grouped by region/country
function calculateRegionStats(nodes: EnrichedPNode[]): RegionStats[] {
    const regionMap = new Map<string, EnrichedPNode[]>();

    // Group nodes by country
    nodes.forEach(node => {
        const country = node.location?.country || 'Unknown';
        const existing = regionMap.get(country) || [];
        existing.push(node);
        regionMap.set(country, existing);
    });

    // Calculate stats for each region
    const regionStats: RegionStats[] = [];

    regionMap.forEach((regionNodes, country) => {
        const onlineNodes = regionNodes.filter(n => n.status === 'online');
        const offlineNodes = regionNodes.filter(n => n.status === 'offline');
        const syncingNodes = regionNodes.filter(n => n.status === 'syncing');

        // Calculate health score (0-100) based on uptime and online percentage
        const onlinePercent = regionNodes.length > 0 ? (onlineNodes.length / regionNodes.length) * 100 : 0;
        const healthScore = Math.round(onlinePercent);

        regionStats.push({
            country,
            countryCode: regionNodes[0]?.location?.countryCode || 'XX',
            totalNodes: regionNodes.length,
            onlineNodes: onlineNodes.length,
            offlineNodes: offlineNodes.length,
            syncingNodes: syncingNodes.length,
            healthScore,
        });
    });

    // Sort by total nodes descending
    return regionStats.sort((a, b) => b.totalNodes - a.totalNodes);
}

export async function GET() {
    try {
        const { nodes, stats } = await fetchAllPNodes();
        const regionStats = calculateRegionStats(nodes);

        return NextResponse.json({
            success: true,
            data: {
                networkStats: stats,
                regionStats,
                topCountries: regionStats.slice(0, 10),
                lastUpdated: Date.now(),
            },
            timestamp: Date.now(),
        });
    } catch (error) {
        console.error('Error fetching stats:', error);

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch stats',
                timestamp: Date.now(),
            },
            { status: 500 }
        );
    }
}
