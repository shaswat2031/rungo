import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { Position } from '../hooks/useGPS';

// Mapbox.setAccessToken('YOUR_MAPBOX_ACCESS_TOKEN');

interface GameMapProps {
    currentPosition: Position | null;
    path: Position[];
    capturedTerritiories: any[]; // To be defined
}

export const GameMap: React.FC<GameMapProps> = ({ currentPosition, path, capturedTerritiories }) => {
    const lineString = useMemo(() => {
        if (path.length < 2) return null;
        return {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'LineString',
                coordinates: path.map((p) => [p.longitude, p.latitude]),
            },
        };
    }, [path]);

    return (
        <View style={styles.container}>
            <Mapbox.MapView style={styles.map} styleURL={Mapbox.StyleURL.Dark}>
                <Mapbox.Camera
                    followUserLocation
                    followUserMode={Mapbox.UserTrackingMode.FollowWithHeading}
                    zoomLevel={15}
                />

                {lineString && (
                    <Mapbox.ShapeSource id="pathSource" shape={lineString as any}>
                        <Mapbox.LineLayer
                            id="pathLayer"
                            style={{
                                lineColor: '#00FFCC',
                                lineWidth: 5,
                                lineJoin: 'round',
                                lineCap: 'round',
                                lineOpacity: 0.8,
                            }}
                        />
                    </Mapbox.ShapeSource>
                )}

                <Mapbox.UserLocation />
            </Mapbox.MapView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
});
