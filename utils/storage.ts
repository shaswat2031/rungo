import AsyncStorage from '@react-native-async-storage/async-storage';
import { Position } from '../hooks/useGPS';

const TERRITORIES_KEY = '@striderealm_territories';
const USER_STATS_KEY = '@striderealm_user_stats';
const AUTH_TOKEN_KEY = '@striderealm_auth_token';

export interface UserStats {
    xp: number;
    level: number;
    totalArea: number;
    totalDistance: number;
    loopCount: number;
    longestRun: number;
    lastEnergyRecharge: number;
    team?: 'Neon' | 'Pink' | 'Electric';
    email?: string;
    username?: string;
    isLoggedIn: boolean;
    userId?: string;
    token?: string;
}
export interface Territory {
    id: string;
    path: Position[];
    area: number;
    timestamp: number;
    color?: string;
    city?: string;
}

export const saveTerritory = async (territory: Territory) => {
    try {
        const existing = await getTerritories();
        const updated = [...existing, territory];
        await AsyncStorage.setItem(TERRITORIES_KEY, JSON.stringify(updated));
    } catch (e) {
        console.error('Failed to save territory', e);
    }
};

export const getTerritories = async (): Promise<Territory[]> => {
    try {
        const jsonValue = await AsyncStorage.getItem(TERRITORIES_KEY);
        return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
        console.error('Failed to fetch territories', e);
        return [];
    }
};

export const clearTerritories = async () => {
    try {
        await AsyncStorage.removeItem(TERRITORIES_KEY);
        await AsyncStorage.removeItem(USER_STATS_KEY);
        await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    } catch (e) {
        console.error('Failed to clear territories', e);
    }
};

export const saveToken = async (token: string) => {
    try {
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    } catch (e) {
        console.error('Failed to save token', e);
    }
};

export const getToken = async (): Promise<string | null> => {
    try {
        return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    } catch (e) {
        return null;
    }
};

export const getUserStats = async (): Promise<UserStats> => {
    try {
        const value = await AsyncStorage.getItem(USER_STATS_KEY);
        return value != null ? JSON.parse(value) : {
            xp: 0,
            level: 1,
            totalArea: 0,
            totalDistance: 0,
            loopCount: 0,
            longestRun: 0,
            lastEnergyRecharge: Date.now(),
            isLoggedIn: false,
            userId: `user_${Math.random().toString(36).substr(2, 5)}`
        };
    } catch (e) {
        return {
            xp: 0,
            level: 1,
            totalArea: 0,
            totalDistance: 0,
            loopCount: 0,
            longestRun: 0,
            lastEnergyRecharge: Date.now(),
            isLoggedIn: false,
            userId: `user_${Math.random().toString(36).substr(2, 5)}`
        };
    }
};

export const saveUserStats = async (stats: UserStats) => {
    try {
        await AsyncStorage.setItem(USER_STATS_KEY, JSON.stringify(stats));
    } catch (e) {
        console.error('Failed to save stats', e);
    }
};
