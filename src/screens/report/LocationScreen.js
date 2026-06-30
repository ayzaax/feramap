import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import MapView from 'react-native-maps';
import * as Location from 'expo-location';

export default function LocationScreen({ navigation, route }) {
  const { catId, catName } = route.params ?? {};
  const [mapRegion, setMapRegion] = useState(null);
  const [pinnedLocation, setPinnedLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied.');
        // Fallback to Torreón coordinates if permission is denied
        const fallback = {
          latitude: 25.5428,
          longitude: -103.4068,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        };
        setMapRegion(fallback);
        setPinnedLocation({ latitude: fallback.latitude, longitude: fallback.longitude });
        setLoading(false);
        return;
      }

      try {
        let loc = await Location.getCurrentPositionAsync({});
        const region = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        };
        setMapRegion(region);
        setPinnedLocation({ latitude: region.latitude, longitude: region.longitude });
      } catch (err) {
        console.error('Error getting location:', err);
        // Fallback to Torreón coordinates if location fetching fails
        const fallback = {
          latitude: 25.5428,
          longitude: -103.4068,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        };
        setMapRegion(fallback);
        setPinnedLocation({ latitude: fallback.latitude, longitude: fallback.longitude });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleRegionChangeComplete = (region) => {
    setPinnedLocation({
      latitude: region.latitude,
      longitude: region.longitude,
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#B85CE8" />
        <Text style={styles.loadingText}>Fetching GPS location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View />
        <TouchableOpacity onPress={() => navigation.getParent()?.goBack()} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Cat spotted here?</Text>
      <Text style={styles.subtitle}>
        {errorMsg ? 'GPS Denied. Adjust map manually.' : 'We found your GPS.\nAdjust the map to pin the exact spot.'}
      </Text>

      {/* Real MapView with a fixed center pin */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={mapRegion}
          onRegionChangeComplete={handleRegionChangeComplete}
          showsUserLocation
          showsMyLocationButton={false}
        />
        {/* Static Center Marker */}
        <View style={styles.markerFixed} pointerEvents="none">
          <Text style={styles.centerMarkerEmoji}>📍</Text>
        </View>
      </View>

      <Text style={styles.adjustHint}>Drag the map to position the pin</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          if (catId) {
            navigation.navigate('Camera', { catId, catName, location: pinnedLocation });
          } else {
            navigation.navigate('Identify', { location: pinnedLocation });
          }
        }}
      >
        <Text style={styles.buttonText}>Looks right  →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF0F3',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFF0F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#888',
    fontSize: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  mapContainer: {
    flex: 1,
    width: '100%',
    position: 'relative',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#FFD9E2',
    marginBottom: 12,
  },
  map: {
    flex: 1,
  },
  markerFixed: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -16, // Center the emoji
    marginTop: -32,  // Lift it so the point of the pin sits exactly on the center coordinate
  },
  centerMarkerEmoji: {
    fontSize: 32,
  },
  adjustHint: {
    fontSize: 13,
    color: '#888',
    marginBottom: 24,
  },
  button: {
    width: '100%',
    backgroundColor: '#9B30D9',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  headerButton: {
    padding: 8,
    marginTop: -10,
  },
  headerButtonText: {
    fontSize: 28,
    color: '#9B30D9',
    fontWeight: '600',
  },
});
