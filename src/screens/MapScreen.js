import { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';

// fake cats data for now — we'll replace with Supabase later
const FAKE_CATS = [
  {
    id: '1',
    name: 'Taco',
    status: 'spotted',
    latitude: 25.5428,
    longitude: -103.4068,
    notes: 'Orange tabby near the taqueria',
  },
  {
    id: '2',
    name: 'Luna',
    status: 'neutered',
    latitude: 25.5435,
    longitude: -103.4058,
    notes: 'Friendly tortoiseshell',
  },
  {
    id: '3',
    name: 'Gordo',
    status: 'returned',
    latitude: 25.5420,
    longitude: -103.4075,
    notes: 'Big grey cat near the plaza',
  },
  {
    id: '4',
    name: 'Sombra',
    status: 'trapped',
    latitude: 25.5440,
    longitude: -103.4050,
    notes: 'Black cat, shy',
  },
];

const STATUS_COLORS = {
  spotted: '#EF9F27',
  trapped: '#E8725A',
  neutered: '#7F77DD',
  returned: '#1D9E75',
};

const FILTERS = ['All', 'Spotted', 'Trapped', 'Neutered', 'Returned'];

export default function MapScreen({ navigation }) {
  const mapRef = useRef(null);

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
        {FAKE_CATS.map((cat) => (
          <Marker
            key={cat.id}
            coordinate={{
              latitude: cat.latitude,
              longitude: cat.longitude,
            }}
            title={cat.name}
            description={cat.notes}
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
          {FAKE_CATS.map((cat) => (
            <TouchableOpacity key={cat.id} style={styles.catChip}>
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