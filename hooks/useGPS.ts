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

    const startWatching = async () => {
        stopWatching();
        subscription.current = await Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.BestForNavigation,
                timeInterval: 2000,
                distanceInterval: 5,
            },
            (location) => {
                const newPos: Position = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    timestamp: location.timestamp,
                    accuracy: location.coords.accuracy ?? undefined,
                    speed: location.coords.speed ?? undefined,
                };

                setCurrentPosition(newPos);
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

    const resetPath = () => {
        setPath([]);
    };

    return { currentPosition, path, errorMsg, resetPath };
};
