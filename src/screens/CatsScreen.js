import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';

const FAKE_CATS = [
  { id: '1', name: 'Taco', status: 'spotted', location: 'Street Juárez', lastSeen: '2h ago' },
  { id: '2', name: 'Luna', status: 'neutered', location: 'Plaza Central', lastSeen: '1d ago' },
  { id: '3', name: 'Gordo', status: 'returned', location: 'Barrio Antiguo', lastSeen: '3d ago' },
  { id: '4', name: 'Sombra', status: 'trapped', location: 'Calle Morelos', lastSeen: '5h ago' },
];

const FILTERS = ['All', 'Spotted', 'Trapped', 'Neutered', 'Returned'];

const STATUS_COLORS = {
  spotted: '#EF9F27',
  trapped: '#E8725A',
  neutered: '#7F77DD',
  returned: '#1D9E75',
};

export default function CatsScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const filtered = FAKE_CATS
    .filter(c => activeFilter === 'All' || c.status === activeFilter.toLowerCase())
    .filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Cats</Text>

      {/* search bar */}
      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name..."
          placeholderTextColor="#aaa"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* filter tabs */}
      <View style={styles.filterContainer}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* cat list */}
      {filtered.length === 0 ? (
        <Text style={styles.empty}>No cats found.</Text>
      ) : (
        filtered.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={styles.card}
            onPress={() => navigation.navigate('CatProfile', { catId: cat.id })}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>🐱</Text>
            </View>
            <View style={styles.cardInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.catName}>{cat.name}</Text>
                <View style={[styles.badge, { backgroundColor: STATUS_COLORS[cat.status] }]}>
                  <Text style={styles.badgeText}>{cat.status}</Text>
                </View>
              </View>
              <Text style={styles.catMeta}>📍 {cat.location} · {cat.lastSeen}</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  searchBox: {
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  searchInput: {
    fontSize: 14,
    color: '#333',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    borderRadius: 24,
    padding: 4,
    marginBottom: 20,
  },
  filterChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: '#FFB3C6',
  },
  filterText: {
    fontSize: 11,
    color: '#888',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#1a1a1a',
    fontWeight: '700',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD9E2',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarEmoji: {
    fontSize: 26,
  },
  cardInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  catName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  catMeta: {
    fontSize: 12,
    color: '#666',
  },
  empty: {
    textAlign: 'center',
    color: '#aaa',
    marginTop: 40,
    fontSize: 15,
  },
});
