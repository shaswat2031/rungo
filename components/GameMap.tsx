import { LocateFixed } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
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
    const webViewRef = useRef<WebView>(null);

    // Sync React State to WebView
    useEffect(() => {
        if (webViewRef.current && currentPosition) {
            const message = JSON.stringify({
                type: 'SYNC_STATE',
                data: {
                    currentPosition,
                    path,
                    capturedTerritiories,
                    activeCaptures,
                    hotZones,
                }
            });
            webViewRef.current.postMessage(message);
        }
    }, [currentPosition, path, capturedTerritiories, activeCaptures, hotZones]);

    const handleCenterMap = () => {
        if (webViewRef.current && currentPosition) {
            webViewRef.current.postMessage(JSON.stringify({
                type: 'CENTER_MAP',
                data: { lat: currentPosition.latitude, lng: currentPosition.longitude }
            }));
        }
    };

    const leafletHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
            body { margin: 0; padding: 0; background-color: #000; }
            #map { height: 100vh; width: 100vw; background-color: #000; }
            .user-pulse {
                width: 20px;
                height: 20px;
                background: #FFCB00;
                border: 3px solid #FFF;
                border-radius: 50%;
                box-shadow: 0 0 15px #FFCB00;
            }
            .other-user {
                width: 12px;
                height: 12px;
                background: #8F00FF;
                border: 2px solid #FFF;
                border-radius: 50%;
            }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <script>
            const map = L.map('map', {
                zoomControl: false,
                attributionControl: false
            }).setView([21.1702, 72.8311], 17);

            // Dark Mode Tiles (CartoDB)
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                maxZoom: 20
            }).addTo(map);

            let userMarker, pathTrace, territoryLayers = [], otherRunners = {}, zoneLayers = [];

            window.addEventListener('message', (event) => {
                const { type, data } = JSON.parse(event.data);
                if (type === 'SYNC_STATE') {
                    const { currentPosition, path, capturedTerritiories, activeCaptures, hotZones } = data;

                    // 1. Update User Position
                    if (currentPosition) {
                        const latlng = [currentPosition.latitude, currentPosition.longitude];
                        if (!userMarker) {
                            userMarker = L.marker(latlng, {
                                icon: L.divIcon({ className: 'user-pulse', iconSize: [20, 20], iconAnchor: [10, 10] })
                            }).addTo(map);
                            map.setView(latlng, 17);
                        } else {
                            userMarker.setLatLng(latlng);
                        }
                    }

                    // 2. Trailing Path
                    if (path && path.length > 1) {
                        const latlngs = path.map(p => [p.latitude, p.longitude]);
                        if (!pathTrace) {
                            pathTrace = L.polyline(latlngs, { color: '#FFCB00', weight: 5, lineCap: 'round' }).addTo(map);
                        } else {
                            pathTrace.setLatLngs(latlngs);
                        }
                    } else if (pathTrace) {
                        map.removeLayer(pathTrace);
                        pathTrace = null;
                    }

                    // 3. Captured Territories
                    territoryLayers.forEach(l => map.removeLayer(l));
                    territoryLayers = capturedTerritiories.map(t => {
                        return L.polygon(t.path.map(p => [p.latitude, p.longitude]), {
                            color: t.color || '#00FFCC',
                            weight: 2,
                            fillOpacity: 0.3
                        }).addTo(map);
                    });

                    // 4. Other Players
                    activeCaptures.forEach(c => {
                        const id = c.userId;
                        const lastPos = [c.path[c.path.length-1].latitude, c.path[c.path.length-1].longitude];
                        if (!otherRunners[id]) {
                            otherRunners[id] = L.marker(lastPos, {
                                icon: L.divIcon({ className: 'other-user', iconSize: [12, 12], iconAnchor: [6, 6] })
                            }).addTo(map);
                        } else {
                            otherRunners[id].setLatLng(lastPos);
                        }
                    });

                    // 5. Hot Zones
                    zoneLayers.forEach(l => map.removeLayer(l));
                    zoneLayers = hotZones.map(z => {
                        return L.circle([z.lat, z.lng], {
                            radius: z.radius,
                            color: z.color || '#FF7A00',
                            weight: 1,
                            fillOpacity: 0.1
                        }).addTo(map);
                    });
                } else if (type === 'CENTER_MAP') {
                    map.setView([data.lat, data.lng], 17);
                }
            });
        </script>
    </body>
    </html>
    `;

    return (
        <View style={styles.container}>
            <WebView
                ref={webViewRef}
                originWhitelist={['*']}
                source={{ html: leafletHtml }}
                style={styles.map}
                scrollEnabled={false}
                overScrollMode="never"
                domStorageEnabled={true}
                javaScriptEnabled={true}
            />

            {/* Center Location Button */}
            <TouchableOpacity style={styles.locationButton} onPress={handleCenterMap}>
                <LocateFixed size={24} color="#000" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    map: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
        backgroundColor: '#000',
    },
    locationButton: {
        position: 'absolute',
        bottom: 140, // Positioned above the capture button
        right: 20,
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#FFCB00',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        zIndex: 100,
    }
});
