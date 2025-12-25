'use server';

import { getGeoLocation } from '@/lib/xandeum';
import { GeoLocation } from '@/lib/types';

export async function getIpLocation(ip: string): Promise<GeoLocation | null> {
    try {
        const location = await getGeoLocation(ip);
        return location;
    } catch (error) {
        console.error('Error fetching IP location:', error);
        return null;
    }
}
