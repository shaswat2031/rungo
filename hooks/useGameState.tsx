import * as Haptics from 'expo-haptics';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Territory, UserStats, getTerritories, getUserStats, saveTerritory, saveUserStats } from '../utils/storage';

interface GameState {
  stats: UserStats;
  territories: Territory[];
  energy: number;
  setEnergy: (energy: number) => void;
  updateStats: (newStats: Partial<UserStats>) => Promise<void>;
  addTerritory: (territory: Territory) => Promise<void>;
  refreshData: () => Promise<void>;
}

const GameStateContext = createContext<GameState | undefined>(undefined);

export const GameStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stats, setStats] = useState<UserStats>({
    xp: 0, level: 1, totalArea: 0, totalDistance: 0, loopCount: 0, longestRun: 0, lastEnergyRecharge: Date.now(), isLoggedIn: false
  });
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [energy, setEnergy] = useState(100);

  const refreshData = async () => {
    const s = await getUserStats();
    const t = await getTerritories();
    setStats(s);
    setTerritories(t);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const updateStats = async (newStats: Partial<UserStats>) => {
    const updated = { ...stats, ...newStats };
    setStats(updated);
    await saveUserStats(updated);
  };

  const addTerritory = async (territory: Territory) => {
    const updated = [...territories, territory];
    setTerritories(updated);
    await saveTerritory(territory);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };


  return (
    <GameStateContext.Provider value={{
      stats,
      territories,
      energy,
      setEnergy,
      updateStats,
      addTerritory,
      refreshData
    }}>
      {children}
    </GameStateContext.Provider>
  );
};

export const useGameState = () => {
  const context = useContext(GameStateContext);
  if (!context) throw new Error('useGameState must be used within a GameStateProvider');
  return context;
};
