import { GameMap } from '@/components/GameMap';
import { BASE_API_URL } from '@/constants/Config';
import { Colors } from '@/constants/theme';
import { useGameState } from '@/hooks/useGameState';
import { useGPS } from '@/hooks/useGPS';
import { useMultiplayerSync } from '@/hooks/useMultiplayerSync';
import { calculateArea, checkLoopClosure, validatePath } from '@/utils/geospatial';
import { Territory } from '@/utils/storage';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { Activity, Maximize2, Milestone, Play, Shield, Square, Users, Zap } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const {
    stats, updateStats, territories, addTerritory,
    energy, setEnergy
  } = useGameState();

  const [isCapturing, setIsCapturing] = useState(false);
  const [hotZones, setHotZones] = useState<any[]>([]);
  const [userCity, setUserCity] = useState("Unknown");
  const [showDashboard, setShowDashboard] = useState(false);
  const router = useRouter();

  const { currentPosition, path, sessionDistance, resetSessionDistance, resetPath } = useGPS(isCapturing);
  const lastPos = useRef<any>(null);

  const { activeCaptures, broadcastClaim } = useMultiplayerSync(
    {
      id: stats.userId || 'unknown',
      position: currentPosition,
      isCapturing: isCapturing,
      path: path
    },
    (incomingTerritory) => {
      // Logic for incoming territories handled by GameState if needed, 
      // but for now we just show them on map via sync
    }
  );

  useEffect(() => {
    if (!stats.isLoggedIn) {
      router.replace('/auth');
      return;
    }

    const loadExtraData = async () => {
      try {
        const res = await fetch(`${BASE_API_URL}/zones`);
        const zones = await res.json();
        setHotZones(zones);

        if (currentPosition) {
          const rev = await Location.reverseGeocodeAsync({
            latitude: currentPosition.latitude,
            longitude: currentPosition.longitude
          });
          if (rev.length > 0) setUserCity(rev[0].city || rev[0].region || "Unknown");
        }
      } catch (e) { }
    };
    loadExtraData();
  }, [stats.isLoggedIn]);

  useEffect(() => {
    if (currentPosition && lastPos.current) {
      if (!isCapturing && energy < 100) {
        setEnergy(Math.min(100, energy + 0.1));
      }
      if (isCapturing) {
        setEnergy(Math.max(0, energy - 0.2));
        if (energy <= 0) handleStopCapture();
      }
    }
    lastPos.current = currentPosition;
  }, [currentPosition]);

  useEffect(() => {
    if (sessionDistance > 0 && !isCapturing) {
      updateStats({
        totalDistance: stats.totalDistance + sessionDistance,
        longestRun: Math.max(stats.longestRun, sessionDistance)
      });
      resetSessionDistance();
    }
  }, [isCapturing, sessionDistance]);

  useEffect(() => {
    if (isCapturing && path.length > 5) {
      if (checkLoopClosure(path)) {
        handleLoopCaptured();
      }
    }
  }, [path]);

  const handleLoopCaptured = () => {
    const { isValid, reason } = validatePath(path);
    if (!isValid) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Capture Failed', reason);
      handleStopCapture();
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    let areaM2 = calculateArea(path);

    const head = path[path.length - 1];
    let multiplier = 1;
    hotZones.forEach(zone => {
      const dist = Math.sqrt(Math.pow(zone.lat - head.latitude, 2) + Math.pow(zone.lng - head.longitude, 2)) * 111320;
      if (dist < zone.radius) multiplier = zone.multiplier;
    });

    const finalArea = areaM2 * multiplier;
    const areaKm2 = (finalArea / 1000000).toFixed(4);

    Alert.alert(
      multiplier > 1 ? `HOT ZONE! (x${multiplier})` : 'Area Captured!',
      `You captured ${areaKm2} km²`,
      [
        {
          text: 'Claim',
          onPress: async () => {
            const colors = ['#FFCB00', '#007AFF', '#FF2D55', '#AF52DE', '#5856D6'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];

            const newTerritory: Territory = {
              id: Math.random().toString(36).substr(2, 9),
              path: [...path],
              area: finalArea,
              timestamp: Date.now(),
              color: randomColor,
              city: userCity,
            };

            const xpGained = Math.floor(finalArea / 10);
            const newXP = stats.xp + xpGained;
            const newLevel = Math.floor(newXP / 1000) + 1;

            if (newLevel > stats.level) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('LEVEL UP!', `Welcome to Level ${newLevel}, Commander.`);
            }

            await updateStats({
              xp: newXP,
              totalArea: stats.totalArea + finalArea,
              level: newLevel,
              loopCount: (stats.loopCount || 0) + 1
            });

            await addTerritory(newTerritory);
            broadcastClaim(newTerritory, stats.userId || 'unknown', stats);


            handleStopCapture();
          },
        },
      ]
    );
  };

  const handleToggleCapture = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!isCapturing) {
      if (energy < 10) {
        Alert.alert('Low Energy', 'Recharge by moving without capturing.');
        return;
      }
      setIsCapturing(true);
      resetPath();
    } else {
      handleStopCapture();
    }
  };

  const handleStopCapture = () => {
    setIsCapturing(false);
    resetPath();
  };

  return (
    <View style={styles.container}>
      <GameMap
        currentPosition={currentPosition}
        path={path}
        capturedTerritiories={territories}
        activeCaptures={activeCaptures}
        hotZones={hotZones}
      />

      {/* Team Selection Overlay */}
      {!stats.team && (
        <View style={styles.teamOverlay}>
          <Text style={styles.teamTitle}>CHOOSE YOUR FACTION</Text>
          <View style={styles.teamGrid}>
            <TouchableOpacity
              style={[styles.teamBtn, { borderColor: '#FFCB00' }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                updateStats({ team: 'Neon' });
              }}
            >
              <Text style={{ color: '#FFCB00', fontWeight: 'bold' }}>NEON SQUAD</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.teamBtn, { borderColor: '#007AFF' }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                updateStats({ team: 'Pink' });
              }}
            >
              <Text style={{ color: '#007AFF', fontWeight: 'bold' }}>PINK REBELS</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* UI Overlay */}
      <View style={styles.overlay}>
        <View style={styles.topSection}>
          <View style={styles.topStats}>
            <View style={styles.statBox}>
              <Zap size={18} color={Colors.dark.tint} />
              <Text style={styles.statText}>{Math.floor(energy)}%</Text>
            </View>
            <View style={styles.statBox}>
              <Users size={18} color={Colors.dark.accent} />
              <Text style={styles.statText}>{activeCaptures.length}</Text>
            </View>
            <View style={styles.statBox}>
              <Shield size={18} color={Colors.dark.secondary} />
              <Text style={styles.statText}>Lvl {stats.level}</Text>
            </View>
            <TouchableOpacity
              style={[styles.statBox, showDashboard && styles.statBoxActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowDashboard(!showDashboard);
              }}
            >
              <Activity size={18} color={showDashboard ? "#000" : "#FFCB00"} />
            </TouchableOpacity>
          </View>

        </View>

        {showDashboard && !isCapturing && (
          <View style={styles.dashboardCard}>
            <View style={styles.dashboardRow}>
              <View style={styles.dashItem}>
                <Activity size={18} color="#FFCB00" />
                <Text style={styles.dashValue}>{(stats.totalDistance / 1000).toFixed(2)}</Text>
                <Text style={styles.dashLabel}>TOTAL KM</Text>
              </View>
              <View style={styles.dashItem}>
                <Maximize2 size={18} color="#007AFF" />
                <Text style={styles.dashValue}>{(stats.totalArea / 1000000).toFixed(3)}</Text>
                <Text style={styles.dashLabel}>KM² OWNED</Text>
              </View>
              <View style={styles.dashItem}>
                <Milestone size={18} color="#FF2D55" />
                <Text style={styles.dashValue}>{stats.loopCount || 0}</Text>
                <Text style={styles.dashLabel}>LOOPS</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.bottomSection}>

          <View style={styles.bottomControls}>
            <TouchableOpacity
              style={[
                styles.captureButton,
                isCapturing ? styles.captureButtonActive : styles.captureButtonInactive,
              ]}
              onPress={handleToggleCapture}
            >
              {isCapturing ? (
                <Square size={32} color="#FFF" fill="#FFF" />
              ) : (
                <Play size={32} color="#000" fill="#000" />
              )}
            </TouchableOpacity>

            <Text style={styles.statusText}>
              {isCapturing ? 'CAPTURING TERRITORY...' : 'READY TO CONQUER'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    pointerEvents: 'box-none',
  },
  topSection: {
    gap: 10,
  },
  topStats: {
    flexDirection: 'row',
    gap: 15,
  },
  statBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 8,
  },
  statBoxActive: {
    backgroundColor: '#FFCB00',
    borderColor: '#FFCB00',
  },
  statText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
  bottomControls: {
    alignItems: 'center',
    gap: 15,
    marginBottom: 20,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#FFCB00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  captureButtonInactive: {
    backgroundColor: '#FFCB00',
  },
  captureButtonActive: {
    backgroundColor: '#FF2D55',
    shadowColor: '#FF2D55',
  },
  statusText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  teamOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.95)',
    zIndex: 2000,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  teamTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 4,
    marginBottom: 40,
  },
  teamGrid: {
    width: '100%',
    gap: 20,
  },
  teamBtn: {
    width: '100%',
    padding: 20,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  dashboardCard: {
    position: 'absolute',
    top: 120,
    right: 20,
    width: 120,
    backgroundColor: 'rgba(10, 11, 13, 0.98)',
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 203, 0, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
    zIndex: 100,
  },
  dashboardRow: {
    gap: 20,
  },
  dashItem: {
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  dashValue: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
  },
  dashLabel: {
    color: '#666',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  bottomSection: {
    gap: 15,
  },
});
