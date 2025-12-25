import { NextRequest, NextResponse } from 'next/server';
import { getGeoLocation } from '@/lib/xandeum';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const ip = searchParams.get('ip');

    if (!ip) {
        return NextResponse.json(
            {
                success: false,
                error: 'IP address is required',
                timestamp: Date.now(),
            },
            { status: 400 }
        );
    }

    try {
        const location = await getGeoLocation(ip);

        if (!location) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Could not determine location for IP',
                    timestamp: Date.now(),
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: location,
            timestamp: Date.now(),
        });
    } catch (error) {
        console.error('Error fetching geo:', error);

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch geo location',
                timestamp: Date.now(),
            },
            { status: 500 }
        );
    }
}
