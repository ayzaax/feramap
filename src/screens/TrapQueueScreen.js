import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';


const FAKE_CATS = [
  { id: '1', name: 'Sombra', priority: 'Injured', location: 'Barrio Antiguo', sightings: 3 },
  { id: '2', name: 'Chispas', priority: 'New', location: 'Plaza Central', sightings: 5 },
  { id: '3', name: 'Gordo', priority: 'Overdue', location: 'Barrio Antiguo', sightings: 3 },
];

const FILTERS = ['All', 'Urgent', 'New', 'Overdue'];

const PRIORITY_COLORS = {
  Injured: '#E8725A',
  New: '#2E9E60',
  Overdue: '#7F77DD',
  Urgent: '#E8725A',
};

export default function TrapQueueScreen() {
  const [activeFilter, setActiveFilter] = useState('All');

  const filtered = activeFilter === 'All'
    ? FAKE_CATS
    : activeFilter === 'Urgent'
      ? FAKE_CATS.filter(c => c.priority === 'Injured')
      : FAKE_CATS.filter(c => c.priority === activeFilter);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{FAKE_CATS.length} cats need help</Text>
      <Text style={styles.subtitle}>Sorted by priority</Text>

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

      {/* cat cards */}
      {filtered.map(cat => (
        <View key={cat.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.catAvatar}>
              <Text style={styles.catEmoji}>🐱</Text>
            </View>
            <View style={styles.cardInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.catName}>{cat.name}</Text>
                <Text style={[styles.badge, { color: PRIORITY_COLORS[cat.priority] }]}>
                  {cat.priority === 'Injured' ? '🔔 ' : ''}{cat.priority}
                </Text>
              </View>
              <Text style={styles.catLocation}>📍 {cat.location} · {cat.sightings} sightings</Text>
            </View>
          </View>
          <View style={styles.cardButtons}>
            <TouchableOpacity style={styles.cardButton}>
              <Text style={styles.cardButtonText}>View{'\n'}profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cardButton}>
              <Text style={styles.cardButtonText}>See on{'\n'}map</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cardButton}>
              <Text style={styles.cardButtonText}>Assign{'\n'}to me</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
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
    marginBottom: 4,
    marginTop: 40,
  },
  subtitle: {
    fontSize: 13,
    color: '#999',
    marginBottom: 16,
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
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#1a1a1a',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#FFD9E2',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  catAvatar: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  catEmoji: {
    fontSize: 28,
  },
  cardInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  badge: {
    fontSize: 13,
    fontWeight: '700',
  },
  catLocation: {
    fontSize: 13,
    color: '#555',
    marginTop: 2,
  },
  cardButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  cardButton: {
    flex: 1,
    backgroundColor: '#9B30D9',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cardButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
});
