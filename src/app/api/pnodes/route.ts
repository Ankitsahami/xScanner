import { NextResponse } from 'next/server';
import { fetchAllPNodes } from '@/lib/xandeum';

export const dynamic = 'force-dynamic';
export const revalidate = 30;

export async function GET() {
    try {
        const { nodes, stats } = await fetchAllPNodes();

        return NextResponse.json({
            success: true,
            data: {
                nodes,
                stats,
                lastUpdated: Date.now(),
            },
            timestamp: Date.now(),
        });
    } catch (error) {
        console.error('Error fetching pNodes:', error);

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch pNodes',
                timestamp: Date.now(),
            },
            { status: 500 }
        );
    }
}
