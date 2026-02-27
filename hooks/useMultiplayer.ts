import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Position } from './useGPS';

// Replace with your actual backend URL
const SOCKET_URL = 'http://192.168.1.100:3000';

export interface OtherUser {
    id: string;
    position: Position;
    color: string;
    isCapturing: boolean;
    path: Position[];
}

export const useMultiplayer = (
    currentUser: { id: string; position: Position | null; isCapturing: boolean; path: Position[] },
    onNewTerritory: (t: any) => void
) => {
    const [otherUsers, setOtherUsers] = useState<Record<string, OtherUser>>({});
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        socketRef.current = io(SOCKET_URL);

        socketRef.current.on('users_update', (users: Record<string, OtherUser>) => {
            // Filter out users who are NOT capturing (Privacy/Game Mechanic)
            const capturingOthers: Record<string, OtherUser> = {};
            Object.keys(users).forEach((id) => {
                if (id !== currentUser.id && users[id].isCapturing) {
                    capturingOthers[id] = users[id];
                }
            });
            setOtherUsers(capturingOthers);
        });

        socketRef.current.on('new_territory_captured', (territory: any) => {
            onNewTerritory(territory);
        });

        return () => {
            socketRef.current?.disconnect();
        };
    }, []);

    useEffect(() => {
        // Only send position if we are actively capturing
        if (currentUser.position && socketRef.current && currentUser.isCapturing) {
            socketRef.current.emit('update_position', {
                id: currentUser.id,
                position: currentUser.position,
                isCapturing: currentUser.isCapturing,
                path: currentUser.path,
            });
        } else if (socketRef.current && !currentUser.isCapturing) {
            // Clear presence when stopping
            socketRef.current.emit('update_position', {
                id: currentUser.id,
                isCapturing: false,
                path: []
            });
        }
    }, [currentUser.position, currentUser.isCapturing, currentUser.path.length]);

    const claimTerritory = (territory: any) => {
        socketRef.current?.emit('claim_territory', territory);
    };

    return { otherUsers: Object.values(otherUsers), claimTerritory };
};
