import React, { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import MapView, { Circle, Marker, Polygon, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { Colors } from '../constants/theme';
import { Position } from '../hooks/useGPS';
import { ActiveCapture } from '../hooks/useMultiplayerSync';
import { Territory } from '../utils/storage';

interface GameMapProps {
    currentPosition: Position | null;
    path: Position[];
    capturedTerritiories: Territory[];
    activeCaptures?: ActiveCapture[];
    hotZones?: any[];
}

export const GameMap: React.FC<GameMapProps> = ({
    currentPosition,
    path,
    capturedTerritiories,
    activeCaptures = [],
    hotZones = [],
}) => {
    const pulse = useSharedValue(1);

    useEffect(() => {
        pulse.value = withRepeat(withTiming(1.8, { duration: 1500 }), -1, false);
    }, []);

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulse.value }],
        opacity: 1 - (pulse.value - 1) / 0.8,
    }));

    const region = useMemo(() => {
        const centerLat = currentPosition?.latitude || 21.1702;
        const centerLng = currentPosition?.longitude || 72.8311;
        return {
            latitude: centerLat,
            longitude: centerLng,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
        };
    }, [currentPosition === null]);

    return (
        <View style={styles.container}>
            <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                customMapStyle={mapStyle}
                initialRegion={region || undefined}
                showsUserLocation={false}
                followsUserLocation
                tintColor={Colors.dark.tint}
                rotateEnabled={false}
                pitchEnabled={false}
            >
                {/* Render Hot Zones */}
                {hotZones.map((zone) => (
                    <React.Fragment key={zone.id}>
                        <Circle
                            center={{ latitude: zone.lat, longitude: zone.lng }}
                            radius={zone.radius}
                            fillColor={`${zone.color || '#FF7A00'}33`}
                            strokeColor={zone.color || '#FF7A00'}
                            strokeWidth={2}
                        />
                        <Marker
                            coordinate={{ latitude: zone.lat, longitude: zone.lng }}
                            anchor={{ x: 0.5, y: 0.5 }}
                        >
                            <View style={[styles.zoneLabel, { borderColor: zone.color || '#FF7A00' }]}>
                                <Text style={styles.zoneLabelText}>{zone.title}</Text>
                                <Text style={styles.zoneMultiplier}>{zone.multiplier}x</Text>
                            </View>
                        </Marker>
                    </React.Fragment>
                ))}

                {/* Render Captured Territories */}
                {capturedTerritiories.map((territory) => (
                    <Polygon
                        key={territory.id}
                        coordinates={territory.path.map((p) => ({
                            latitude: p.latitude,
                            longitude: p.longitude,
                        }))}
                        fillColor={territory.color ? `${territory.color}4D` : "rgba(0, 255, 204, 0.3)"}
                        strokeColor={territory.color || "#00FFCC"}
                        strokeWidth={3}
                    />
                ))}

                {/* User Pointer (Pulse Effect) */}
                {currentPosition && (
                    <Marker
                        coordinate={{
                            latitude: currentPosition.latitude,
                            longitude: currentPosition.longitude,
                        }}
                        anchor={{ x: 0.5, y: 0.5 }}
                        flat={true}
                    >
                        <View style={styles.pointerContainer}>
                            <Animated.View style={[styles.pulseCircle, pulseStyle]} />
                            <View style={styles.userPointerOuter}>
                                <View style={styles.userPointerInner} />
                            </View>
                        </View>
                    </Marker>
                )}

                {/* Other Active Captures */}
                {activeCaptures.map((capture) => (
                    <React.Fragment key={capture.userId}>
                        {capture.path.length > 1 && (
                            <>
                                <Polyline
                                    coordinates={capture.path.map((p) => ({
                                        latitude: p.latitude,
                                        longitude: p.longitude,
                                    }))}
                                    strokeColor={capture.color || '#8F00FF'}
                                    strokeWidth={3}
                                    lineDashPattern={[2, 2]}
                                />
                                <Marker
                                    coordinate={{
                                        latitude: capture.path[capture.path.length - 1].latitude,
                                        longitude: capture.path[capture.path.length - 1].longitude,
                                    }}
                                    anchor={{ x: 0.5, y: 0.5 }}
                                >
                                    <View style={[styles.otherUserPointerOuter, { borderColor: `${capture.color || '#8F00FF'}80` }]}>
                                        <View style={[styles.userPointerInner, {
                                            backgroundColor: capture.color || '#8F00FF',
                                            shadowColor: capture.color || '#8F00FF',
                                            width: 8, height: 8, borderRadius: 4
                                        }]} />
                                    </View>
                                </Marker>
                            </>
                        )}
                    </React.Fragment>
                ))}

                {/* Render Current Path Tracing */}
                {path.length > 1 && (
                    <Polyline
                        coordinates={path.map((p) => ({
                            latitude: p.latitude,
                            longitude: p.longitude,
                        }))}
                        strokeColor="#FFCB00"
                        strokeWidth={5}
                        lineJoin="round"
                    />
                )}
            </MapView>
        </View>
    );
};

const mapStyle = [
    { "elementType": "geometry", "stylers": [{ "color": "#1A1A1B" }] },
    { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#4A4A4A" }] },
    { "elementType": "labels.text.stroke", "stylers": [{ "color": "#1A1A1B" }] },
    { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#2C2C2E" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] }
];

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { width: Dimensions.get('window').width, height: Dimensions.get('window').height },
    pointerContainer: { width: 60, height: 60, justifyContent: 'center', alignItems: 'center' },
    pulseCircle: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(255, 203, 0, 0.4)',
        borderWidth: 1,
        borderColor: 'rgba(255, 203, 0, 0.8)',
    },
    userPointerOuter: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#FFCB00',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
    },
    userPointerInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#FFCB00',
    },
    otherUserPointerOuter: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    zoneLabel: {
        backgroundColor: 'rgba(0,0,0,0.85)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
    },
    zoneLabelText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
    zoneMultiplier: { color: '#FFCB00', fontSize: 12, fontWeight: '900' },
});
