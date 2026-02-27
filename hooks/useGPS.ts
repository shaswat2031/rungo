import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import * as turf from '@turf/turf';

export interface Position {
    latitude: number;
    longitude: number;
    timestamp: number;
    accuracy?: number;
    speed?: number;
}

export const useGPS = (isCapturing: boolean) => {
    const [currentPosition, setCurrentPosition] = useState<Position | null>(null);
    const [path, setPath] = useState<Position[]>([]);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const subscription = useRef<Location.LocationSubscription | null>(null);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
            }

            const loc = await Location.getCurrentPositionAsync({});
            setCurrentPosition({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
                timestamp: loc.timestamp,
                accuracy: loc.coords.accuracy ?? undefined,
                speed: loc.coords.speed ?? undefined,
            });
        })();
    }, []);

    useEffect(() => {
        if (isCapturing) {
            startWatching();
        } else {
            stopWatching();
        }

        return () => stopWatching();
    }, [isCapturing]);

    const [sessionDistance, setSessionDistance] = useState(0);

    const startWatching = async () => {
        stopWatching();
        subscription.current = await Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.High,
                timeInterval: 4000, // 4 seconds
                distanceInterval: 10,
            },
            (location) => {
                const { latitude, longitude, accuracy, speed } = location.coords;

                // NOISE FILTERING
                // 1. Accuracy check (reject anything > 35m)
                if (accuracy && accuracy > 35) return;

                // 2. Speed check (reject vehicle movement > 12m/s approx 43km/h)
                if (speed && speed > 12) return;

                const newPos: Position = {
                    latitude,
                    longitude,
                    timestamp: location.timestamp,
                    accuracy: accuracy ?? undefined,
                    speed: speed ?? undefined,
                };

                // Track distance if we have a previous point
                setCurrentPosition((prev) => {
                    if (prev) {
                        const from = turf.point([prev.longitude, prev.latitude]);
                        const to = turf.point([newPos.longitude, newPos.latitude]);
                        const dist = turf.distance(from, to, { units: 'meters' });
                        // Reject huge jumps (GPS glitches)
                        if (dist > 1 && dist < 100) {
                            setSessionDistance(d => d + dist);
                        }
                    }
                    return newPos;
                });

                setPath((prev) => [...prev, newPos]);
            }
        );
    };

    const stopWatching = () => {
        if (subscription.current) {
            subscription.current.remove();
            subscription.current = null;
        }
    };

    const resetSessionDistance = () => setSessionDistance(0);
    const resetPath = () => setPath([]);

    return { currentPosition, path, sessionDistance, resetSessionDistance, errorMsg, resetPath };
};
