import { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { supabase } from '../lib/supabase';

const STATUS_COLORS = {
  spotted: '#EF9F27',
  trapped: '#E8725A',
  neutered: '#7F77DD',
  returned: '#1D9E75',
};

const FILTERS = ['All', 'Spotted', 'Trapped', 'Neutered', 'Returned'];

export default function MapScreen({ navigation }) {
  const mapRef = useRef(null);
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCats = async () => {
      const { data, error } = await supabase
        .rpc('get_cats_with_locations');

      console.log('cats:', JSON.stringify(data, null, 2));

      if (!error && data) {
        setCats(data);
      }
      setLoading(false);
    };

    fetchCats();
  }, []);

  return (
    <View style={styles.container}>

      {/* map fills full screen */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 25.5428,
          longitude: -103.4068,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {!loading && cats.map((cat) => (
          <Marker
            key={cat.id}
            coordinate={{
              latitude: cat.latitude,
              longitude: cat.longitude,
            }}
            title={cat.name}
            onPress={() => navigation.navigate('CatProfile', { catId: cat.id })}
          >
            <View style={[
              styles.catMarker,
              { backgroundColor: STATUS_COLORS[cat.status] }
            ]}>
              <Text style={styles.catMarkerEmoji}>🐱</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* floating search bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search neighbourhood..."
          placeholderTextColor="#999"
        />
      </View>

      {/* filter chips */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={styles.filterChip}
            >
              <Text style={styles.filterText}>{filter}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* floating + button */}
     <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('Report')}>
    <Text style={styles.fabText}>+</Text>
  </TouchableOpacity>

      {/* cats nearby strip */}
      <View style={[styles.bottomSheet, { bottom: 0 }]}>
        <View style={styles.handle} />
        <Text style={styles.nearbyLabel}>Cats nearby</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {!loading && cats.map((cat) => (
            <TouchableOpacity key={cat.id} style={styles.catChip} onPress={() => navigation.navigate('CatProfile', { catId: cat.id })}>
              <View
                style={[
                  styles.catDot,
                  { backgroundColor: STATUS_COLORS[cat.status] },
                ]}
              />
              <Text style={styles.catChipText}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  searchContainer: {
    position: 'absolute',
    top: 52,
    left: 12,
    right: 12,
    zIndex: 10,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  filterContainer: {
    position: 'absolute',
    top: 104,
    left: 12,
    right: 12,
    zIndex: 10,
  },
  filterChip: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  fab: {
    position: 'absolute',
    bottom: 160,
    right: 16,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#B85CE8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#B85CE8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    fontSize: 28,
    color: '#fff',
    lineHeight: 32,
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 12,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  handle: {
    width: 32,
    height: 3,
    backgroundColor: '#ddd',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 10,
  },
  nearbyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginLeft: 4,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  catDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  catMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  catMarkerEmoji: {
    fontSize: 18,
  },
});