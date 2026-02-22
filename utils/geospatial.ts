import * as turf from '@turf/turf';
import { Position } from '../hooks/useGPS';

const CLOSE_THRESHOLD_METERS = 20;
const MIN_POINTS_FOR_LOOP = 5;

export const checkLoopClosure = (path: Position[]): boolean => {
    if (path.length < MIN_POINTS_FOR_LOOP) return false;

    const start = path[0];
    const end = path[path.length - 1];

    const distance = turf.distance(
        [start.longitude, start.latitude],
        [end.longitude, end.latitude],
        { units: 'meters' }
    );

    return distance < CLOSE_THRESHOLD_METERS;
};

export const calculateArea = (path: Position[]): number => {
    if (path.length < 3) return 0;

    // Close the polygon by adding the first point to the end if not already closed
    const coordinates = path.map((p) => [p.longitude, p.latitude]);
    if (
        coordinates[0][0] !== coordinates[coordinates.length - 1][0] ||
        coordinates[0][1] !== coordinates[coordinates.length - 1][1]
    ) {
        coordinates.push(coordinates[0]);
    }

    const polygon = turf.polygon([coordinates]);
    return turf.area(polygon); // returns area in square meters
};

export const validatePath = (path: Position[]): { isValid: boolean; reason?: string } => {
    // Anti-cheat: Check for maximum speed
    const MAX_SPEED_MPS = 8; // ~28 km/h (Usain Bolt fast)

    for (let i = 1; i < path.length; i++) {
        const p1 = path[i - 1];
        const p2 = path[i];

        const dist = turf.distance(
            [p1.longitude, p1.latitude],
            [p2.longitude, p2.latitude],
            { units: 'kilometers' }
        );

        const timeSec = (p2.timestamp - p1.timestamp) / 1000;
        const speed = (dist * 1000) / timeSec;

        if (speed > MAX_SPEED_MPS && timeSec > 0) {
            return { isValid: false, reason: 'Speed too high (Vehicle detected?)' };
        }
    }

    return { isValid: true };
};
