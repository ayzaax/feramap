import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';

const PLACEHOLDER_PHOTOS = [
  'https://placecats.com/150/160',
  'https://placecats.com/neo/150/160',
  'https://placecats.com/millie/150/160',
];

const STATUS_COLORS = {
  spotted: '#EF9F27',
  trapped: '#E8725A',
  neutered: '#7F77DD',
  returned: '#1D9E75',
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function CatProfileScreen({ navigation, route }) {
  const [cat, setCat] = useState(null);
  const [sightings, setSightings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      let catId = route?.params?.catId;

      if (!catId) {
        const { data: first } = await supabase
          .rpc('get_cats_with_locations')
          .limit(1)
          .single();
        catId = first?.id;
      }

      if (!catId) {
        setLoading(false);
        return;
      }

      const [{ data: profileData, error: profileError }, { data: sightingData }] = await Promise.all([
        supabase.rpc('get_cat_profile', { cat_id: catId }),
        supabase.rpc('get_cat_sightings', { cat_id: catId }),
      ]);

      console.log('catId from params:', route.params?.catId);
      console.log('profile data:', JSON.stringify(profileData, null, 2));
      console.log('profile error:', profileError);

      if (profileData?.[0]) setCat(profileData[0]);
      if (sightingData) setSightings(sightingData);
      setLoading(false);
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#B85CE8" size="large" />
      </View>
    );
  }

  if (!cat) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: '#888' }}>Cat not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>

      {/* back button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>

      {/* polaroid stack */}
      <View style={styles.photoStack}>
        <View style={[styles.polaroid, { transform: [{ rotate: '-6deg' }], top: 12, left: 8 }]}>
          <Image source={{ uri: PLACEHOLDER_PHOTOS[0] }} style={styles.photo} />
        </View>
        <View style={[styles.polaroid, { transform: [{ rotate: '4deg' }], top: 6, left: 4 }]}>
          <Image source={{ uri: PLACEHOLDER_PHOTOS[1] }} style={styles.photo} />
        </View>
        <View style={[styles.polaroid, { transform: [{ rotate: '-1deg' }], top: 0, left: 0 }]}>
          <Image source={{ uri: PLACEHOLDER_PHOTOS[2] }} style={styles.photo} />
        </View>
      </View>

      {/* name + location */}
      <Text style={styles.name}>{cat.name}</Text>
      <Text style={styles.location}>📍 {cat.zone_name ?? '—'} · since {formatDate(cat.created_at)}</Text>

      {/* stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{cat.sighting_count ?? 0}</Text>
          <Text style={styles.statLabel}>Sightings</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>1</Text>
          <Text style={styles.statLabel}>Contributors</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{cat.last_seen ?? '—'}</Text>
          <Text style={styles.statLabel}>Last seen</Text>
        </View>
      </View>

      {/* community summary */}
      <View style={styles.summaryBox}>
        <Text style={styles.summaryTitle}>✦  Community summary</Text>
        <Text style={styles.summaryText}>{cat.summary ?? 'No summary yet.'}</Text>
      </View>

      {/* sighting history */}
      <Text style={styles.historyLabel}>Sighting history</Text>
      <View style={styles.timeline}>
        {sightings.length === 0 ? (
          <Text style={styles.empty}>No sightings recorded yet.</Text>
        ) : (
          sightings.map((s, i) => (
            <View key={s.id ?? i} style={styles.timelineRow}>
              <View style={styles.timelineLeft}>
                <View style={[styles.dot, { backgroundColor: STATUS_COLORS[s.condition] ?? '#9B30D9' }]} />
                {i < sightings.length - 1 && <View style={styles.line} />}
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.sightingTitle}>{s.condition ?? 'Sighting'}</Text>
                {s.notes ? <Text style={styles.sightingQuote}>"{s.notes}"</Text> : null}
                <Text style={styles.sightingMeta}>{formatDate(s.created_at)}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* bottom buttons */}
      <View style={styles.buttonsRow}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Log{'\n'}Sighting</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>See on{'\n'}map</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Follow</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  photoStack: {
    width: 180,
    height: 210,
    marginBottom: 24,
  },
  polaroid: {
    position: 'absolute',
    width: 160,
    height: 180,
    backgroundColor: '#FFD9E2',
    borderWidth: 4,
    borderColor: '#FFD9E2',
    padding: 6,
    paddingBottom: 24,
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  name: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  location: {
    fontSize: 14,
    color: '#888',
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
    paddingVertical: 16,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#eee',
  },
  summaryBox: {
    alignSelf: 'stretch',
    backgroundColor: '#EDD9F5',
    borderRadius: 16,
    padding: 16,
    marginBottom: 28,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 21,
  },
  historyLabel: {
    alignSelf: 'stretch',
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  timeline: {
    alignSelf: 'stretch',
    marginBottom: 32,
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  timelineLeft: {
    width: 24,
    alignItems: 'center',
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 3,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: '#eee',
    marginTop: 4,
    marginBottom: -4,
  },
  timelineContent: {
    flex: 1,
    paddingLeft: 10,
    paddingBottom: 20,
  },
  sightingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  sightingQuote: {
    fontSize: 13,
    color: '#555',
    fontStyle: 'italic',
    marginTop: 2,
  },
  sightingMeta: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  buttonsRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#9B30D9',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
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
  empty: {
    color: '#aaa',
    fontSize: 14,
  },
});
