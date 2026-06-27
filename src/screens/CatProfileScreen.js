import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';

const FAKE_CAT = {
  name: 'Taco',
  location: 'Street Juárez',
  since: 'Jan 5, 2025',
  sightings: 8,
  contributors: 3,
  lastSeen: '3d',
  photos: [
    'https://placecats.com/150/160',
    'https://placecats.com/neo/150/160',
    'https://placecats.com/millie/150/160',
  ],
  summary: 'Taco is an orange tabby spotted near the taqueria on Calle Juárez. Friendly with people, usually appears in the evenings. Needs neutering.',
  sightings_history: [
    { id: '1', title: 'Spotted near taqueria', quote: 'Looks healthy, came up to me!', time: '2 days ago', by: 'Carlos', color: '#EF9F27' },
    { id: '2', title: 'Spotted on Calle Juárez', quote: 'Orange tabby, no ear notch', time: '1 week ago', by: 'Sofía', color: '#EF9F27' },
    { id: '3', title: 'First spotted', quote: 'Found him near the corner', time: 'Jan 5', by: 'María', color: '#9B30D9' },
  ],
};

export default function CatProfileScreen({ navigation }) {
  const cat = FAKE_CAT;

  return (
    <ScrollView contentContainerStyle={styles.container}>

      {/* back button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>

      {/* polaroid stack */}
      <View style={styles.photoStack}>
        <View style={[styles.polaroid, { transform: [{ rotate: '-6deg' }], top: 12, left: 8 }]}>
          <Image source={{ uri: cat.photos[0] }} style={styles.photo} />
        </View>
        <View style={[styles.polaroid, { transform: [{ rotate: '4deg' }], top: 6, left: 4 }]}>
          <Image source={{ uri: cat.photos[1] }} style={styles.photo} />
        </View>
        <View style={[styles.polaroid, { transform: [{ rotate: '-1deg' }], top: 0, left: 0 }]}>
          <Image source={{ uri: cat.photos[2] }} style={styles.photo} />
        </View>
      </View>

      {/* name + location */}
      <Text style={styles.name}>{cat.name}</Text>
      <Text style={styles.location}>📍 {cat.location} · since {cat.since}</Text>

      {/* stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{cat.sightings}</Text>
          <Text style={styles.statLabel}>Sightings</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{cat.contributors}</Text>
          <Text style={styles.statLabel}>Contributors</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{cat.lastSeen}</Text>
          <Text style={styles.statLabel}>Last seen</Text>
        </View>
      </View>

      {/* community summary */}
      <View style={styles.summaryBox}>
        <Text style={styles.summaryTitle}>✦  Community summary</Text>
        <Text style={styles.summaryText}>{cat.summary}</Text>
      </View>

      {/* sighting history */}
      <Text style={styles.historyLabel}>Sighting history</Text>
      <View style={styles.timeline}>
        {cat.sightings_history.map((s, i) => (
          <View key={s.id} style={styles.timelineRow}>
            <View style={styles.timelineLeft}>
              <View style={[styles.dot, { backgroundColor: s.color }]} />
              {i < cat.sightings_history.length - 1 && <View style={styles.line} />}
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.sightingTitle}>{s.title}</Text>
              <Text style={styles.sightingQuote}>"{s.quote}"</Text>
              <Text style={styles.sightingMeta}>{s.time} · by {s.by}</Text>
            </View>
          </View>
        ))}
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
});
