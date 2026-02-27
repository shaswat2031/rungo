import { BASE_API_URL } from '@/constants/Config';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { Crown, Flame, MapPin, Medal, Shield, TrendingUp, Trophy } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function LeaderboardScreen() {
  const [selectedCity, setSelectedCity] = useState("Detecting...");
  const [scope, setScope] = useState<'City' | 'India'>('City');
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    detectLocation();
  }, []);

  useEffect(() => {
    if (selectedCity && selectedCity !== "Detecting...") {
      fetchLeaderboard();
    }
  }, [selectedCity, scope]);

  const detectLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setSelectedCity("Global");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      let reverse = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });

      if (reverse.length > 0) {
        const city = reverse[0].city || reverse[0].region || "Unknown";
        setSelectedCity(city);
      } else {
        setSelectedCity("Surat"); // Default to Surat for launch
      }
    } catch (e) {
      setSelectedCity("Surat"); // Default to Surat for launch
    }
  };

  const fetchLeaderboard = async () => {
    setLoading(true);
    const apiParam = scope === 'India' ? 'India' : selectedCity;
    try {
      const res = await fetch(`${BASE_API_URL}/leaderboard/${apiParam}`);
      const data = await res.json();
      setLeaderboardData(data);
    } catch (e) {
      console.warn("Failed to fetch leaderboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchLeaderboard();
  };

  const renderLeaderItem = ({ item, index }: { item: any, index: number }) => (
    <Animated.View
      entering={FadeInDown.delay(index * 50).duration(500)}
      style={styles.leaderCard}
    >
      <View style={styles.rankCircle}>
        <Text style={styles.rankText}>{index + 4}</Text>
      </View>
      <View style={styles.playerInfo}>
        <Text style={styles.playerName}>{item.name}</Text>
        <View style={styles.teamBadge}>
          <Shield size={12} color={item.team === 'Neon' ? '#FFCB00' : '#007AFF'} />
          <Text style={[styles.teamLabel, { color: item.team === 'Neon' ? '#FFCB00' : '#007AFF' }]}>
            {item.team.toUpperCase()}
          </Text>
        </View>
      </View>
      <View style={styles.areaInfo}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Flame size={14} color="#FFCB00" />
          <Text style={styles.areaValue}>{Number(item.area || 0).toFixed(2)}</Text>
        </View>
        <Text style={styles.areaUnit}>km² OWNED</Text>
      </View>
    </Animated.View>
  );

  const TopPodium = () => {
    const top3 = leaderboardData.slice(0, 3);
    if (top3.length === 0) return null;

    return (
      <View style={styles.podiumContainer}>
        {/* 2nd Place */}
        {top3[1] && (
          <Animated.View entering={FadeInUp.delay(200)} style={[styles.podiumItem, styles.podium2nd]}>
            <Medal size={20} color="#C0C0C0" style={{ marginBottom: 5 }} />
            <View style={[styles.podiumAvatar, { borderColor: top3[1].team === 'Neon' ? '#FFCB00' : '#007AFF' }]}>
              <Text style={styles.avatarText}>{top3[1].name[0]}</Text>
              <View style={styles.rankBadge}>
                <Text style={styles.rankBadgeText}>2</Text>
              </View>
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>{top3[1].name}</Text>
            <Text style={styles.podiumArea}>{Number(top3[1].area || 0).toFixed(2)} km²</Text>
          </Animated.View>
        )}

        {/* 1st Place */}
        {top3[0] && (
          <Animated.View entering={FadeInUp.delay(100)} style={[styles.podiumItem, styles.podium1st]}>
            <Crown size={32} color="#FFCB00" style={{ marginBottom: 5 }} />
            <View style={[styles.podiumAvatar, styles.avatar1st, { borderColor: top3[0].team === 'Neon' ? '#FFCB00' : '#007AFF' }]}>
              <Text style={[styles.avatarText, { fontSize: 32 }]}>{top3[0].name[0]}</Text>
              <View style={[styles.rankBadge, { backgroundColor: '#FFCB00', width: 24, height: 24, borderRadius: 12 }]}>
                <Text style={[styles.rankBadgeText, { color: '#000' }]}>1</Text>
              </View>
            </View>
            <Text style={[styles.podiumName, { fontSize: 18 }]} numberOfLines={1}>{top3[0].name}</Text>
            <Text style={[styles.podiumArea, { fontSize: 15 }]}>{Number(top3[0].area || 0).toFixed(2)} km²</Text>
          </Animated.View>
        )}

        {/* 3rd Place */}
        {top3[2] && (
          <Animated.View entering={FadeInUp.delay(300)} style={[styles.podiumItem, styles.podium3rd]}>
            <Medal size={20} color="#CD7F32" style={{ marginBottom: 5 }} />
            <View style={[styles.podiumAvatar, { borderColor: top3[2].team === 'Neon' ? '#FFCB00' : '#007AFF' }]}>
              <Text style={styles.avatarText}>{top3[2].name[0]}</Text>
              <View style={styles.rankBadge}>
                <Text style={styles.rankBadgeText}>3</Text>
              </View>
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>{top3[2].name}</Text>
            <Text style={styles.podiumArea}>{Number(top3[2].area || 0).toFixed(2)} km²</Text>
          </Animated.View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#111', '#000']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.headerLogoContainer}>
                <Image
                  source={require('../../assets/images/logo.png')}
                  style={styles.headerLogo}
                />
              </View>
              <Text style={styles.title}>StrideRealm</Text>
            </View>
            <Text style={{ color: '#888', fontSize: 12, fontWeight: '700', letterSpacing: 2, marginTop: 4 }}>HALL OF FAME</Text>
          </View>
          <Trophy color="#FFCB00" size={24} />
        </View>

        <View style={styles.scopeToggle}>
          <TouchableOpacity
            style={[styles.scopeBtn, scope === 'City' && styles.scopeBtnActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setScope('City');
            }}
          >
            <MapPin size={14} color={scope === 'City' ? '#000' : '#888'} />
            <Text style={[styles.scopeBtnText, scope === 'City' && styles.scopeBtnTextActive]}>
              {selectedCity.toUpperCase()}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.scopeBtn, scope === 'India' && styles.scopeBtnActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setScope('India');
            }}
          >
            <TrendingUp size={14} color={scope === 'India' ? '#000' : '#888'} />
            <Text style={[styles.scopeBtnText, scope === 'India' && styles.scopeBtnTextActive]}>
              INDIA
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <TopPodium />

        <FlatList
          data={leaderboardData.slice(3)}
          keyExtractor={item => item.id?.toString() || Math.random().toString()}
          renderItem={renderLeaderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FFCB00"
            />
          }
          ListEmptyComponent={
            loading ? null : <Text style={styles.emptyText}>No challengers in this city yet.</Text>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 2,
  },
  scopeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 25,
    padding: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  scopeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  scopeBtnActive: {
    backgroundColor: '#FFCB00',
  },
  scopeBtnText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  scopeBtnTextActive: {
    color: '#000',
  },
  content: {
    flex: 1,
  },
  podiumContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: 'rgba(255,255,255,0.01)',
  },
  podiumItem: {
    alignItems: 'center',
    width: 110,
  },
  podiumRank: {
    color: '#555',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 5,
  },
  podiumAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  avatar1st: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: 'bold',
  },
  rankBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  rankBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
  podiumName: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  podiumArea: {
    color: '#FFCB00',
    fontSize: 13,
    fontWeight: '800',
  },
  podium1st: {
    zIndex: 1,
    transform: [{ translateY: -15 }],
  },
  podium2nd: {
    transform: [{ translateX: 5 }],
  },
  podium3rd: {
    transform: [{ translateX: -5 }],
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  leaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 18,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  rankCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  rankText: {
    color: '#777',
    fontWeight: 'bold',
    fontSize: 14,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  teamBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  teamLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  areaInfo: {
    alignItems: 'flex-end',
  },
  areaValue: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
  },
  areaUnit: {
    color: '#555',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyText: {
    color: '#333',
    textAlign: 'center',
    marginTop: 80,
    fontSize: 16,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  headerLogoContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#FFCB00',
    backgroundColor: '#000',
  },
  headerLogo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});
