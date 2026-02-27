import { useState, useEffect, useRef } from 'react';
import { Position } from './useGPS';
import { Territory } from '../utils/storage';

import { BASE_API_URL } from '../constants/Config';

export interface ActiveCapture {
    userId: string;
    path: Position[];
    color: string;
    lastUpdate: number;
}

export const useMultiplayerSync = (
    currentUser: { id: string; position: Position | null; isCapturing: boolean; path: Position[] },
    onNewGlobalTerritory: (t: Territory) => void
) => {
    const [activeCaptures, setActiveCaptures] = useState<ActiveCapture[]>([]);
    const pollInterval = useRef<NodeJS.Timeout | null>(null);

    // 1. Sync self state to "server"
    useEffect(() => {
        if (currentUser.isCapturing && currentUser.position) {
            syncMyCapture();
        }
    }, [currentUser.path.length, currentUser.isCapturing]);

    const syncMyCapture = async () => {
        try {
            await fetch(`${BASE_API_URL}/active`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: currentUser.id,
                    path: currentUser.path,
                    isCapturing: currentUser.isCapturing,
                }),
            });
        } catch (e) {
            // Fail silently for now
        }
    };

    // 2. Poll for other people's active captures and new territories
    useEffect(() => {
        const poll = async () => {
            try {
                // Fetch people currently "Capturing"
                const activeRes = await fetch(`${BASE_API_URL}/active`);
                const activeData: ActiveCapture[] = await activeRes.json();

                // Filter out self
                setActiveCaptures(activeData.filter(u => u.userId !== currentUser.id));

                // Fetch newly finished territories
                const territoryRes = await fetch(`${BASE_API_URL}/territories`);
                const newTerritories: Territory[] = await territoryRes.json();
                newTerritories.forEach(t => onNewGlobalTerritory(t));

            } catch (e) {
                console.warn('Sync failed - Server might be offline');
            }
        };

        poll(); // Initial check
        pollInterval.current = setInterval(poll, 5000); // Poll every 5 seconds

        return () => {
            if (pollInterval.current) clearInterval(pollInterval.current);
        };
    }, []);

    const broadcastClaim = async (territory: Territory, userId: string, stats: any) => {
        try {
            await fetch(`${BASE_API_URL}/claim`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ territory, userId, stats }),
            });
        } catch (e) {
            console.error('Failed to broadcast claim', e);
        }
    };

    return { activeCaptures, broadcastClaim };
};
