import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';

const FILTERS = ['All', 'Urgent', 'New', 'Overdue'];

const PRIORITY_COLORS = {
  Injured: '#E8725A',
  New: '#2E9E60',
  Overdue: '#7F77DD',
  Urgent: '#E8725A',
  High: '#E8725A',
  Medium: '#EF9F27',
  Low: '#7F77DD',
};

export default function TrapQueueScreen({ navigation }) {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const { data, error } = await supabase
          .from('cats')
          .select(`
            id,
            name,
            priority,
            status,
            zones (
              name
            ),
            cat_photos (
              photo_url
            ),
            sightings (
              created_at
            )
          `)
          .in('status', ['spotted', 'trapped']);

        if (error) throw error;
        setCats(data || []);
      } catch (err) {
        console.error('Error fetching trap queue:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQueue();
  }, []);

  const filtered = cats.filter(cat => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Urgent') return cat.priority === 'Urgent' || cat.priority === 'High';
    return cat.priority === activeFilter;
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#B85CE8" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* back button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{cats.length} cats need help</Text>
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
      {filtered.map(cat => {
        const photoUrl = cat.cat_photos?.[0]?.photo_url;
        const sightingsCount = cat.sightings?.length || 1;
        return (
          <View key={cat.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.catAvatar}>
                {photoUrl ? (
                  <Image source={{ uri: photoUrl }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.catEmoji}>🐱</Text>
                )}
              </View>
              <View style={styles.cardInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.catName}>{cat.name || 'Unknown cat'}</Text>
                  <Text style={[styles.badge, { color: PRIORITY_COLORS[cat.priority] || '#9B30D9' }]}>
                    {cat.priority === 'Urgent' || cat.priority === 'High' ? '🔔 ' : ''}{cat.priority}
                  </Text>
                </View>
                <Text style={styles.catLocation}>
                  📍 {cat.zones?.name ?? 'Colonia Centro'} · {sightingsCount} sighting{sightingsCount > 1 ? 's' : ''}
                </Text>
              </View>
            </View>
            <View style={styles.cardButtons}>
              <TouchableOpacity 
                style={styles.cardButton}
                onPress={() => navigation.navigate('CatProfile', { catId: cat.id })}
              >
                <Text style={styles.cardButtonText}>View{'\n'}profile</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.cardButton}
                onPress={() => navigation.navigate('Main', { screen: 'Map' })}
              >
                <Text style={styles.cardButtonText}>See on{'\n'}map</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cardButton}>
                <Text style={styles.cardButtonText}>Assign{'\n'}to me</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
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
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    resizeMode: 'cover',
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
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  backArrow: {
    fontSize: 28,
    color: '#9B30D9',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
});
