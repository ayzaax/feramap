import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

const FAKE_COLONY = {
  name: 'Colonia Centro',
  lastUpdated: '2 hours ago',
  knownCats: 34,
  newThisWeek: 3,
  needTrapping: 8,
  reporters: 47,
  neuteredTotal: 19,
  totalCats: 34,
  zones: [
    { name: 'Street Juárez', neutered: 12, total: 14 },
    { name: 'Plaza Central', neutered: 5, total: 10 },
    { name: 'Barrio Antiguo', neutered: 2, total: 10 },
  ],
};

function ProgressBar({ value, total }) {
  const pct = total > 0 ? value / total : 0;
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${pct * 100}%` }]} />
    </View>
  );
}

export default function ColonyScreen() {
  const c = FAKE_COLONY;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{c.name}</Text>
      <Text style={styles.subtitle}>Last updated {c.lastUpdated}</Text>

      {/* stat cards */}
      <View style={styles.statCard}>
        <Text style={styles.statCardText}>{c.knownCats} known cats</Text>
        <Text style={styles.statCardGreen}>+{c.newThisWeek} this week</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statCardText}>{c.needTrapping} need trapping</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statCardText}>{c.reporters} reporters</Text>
      </View>

      {/* overall progress */}
      <Text style={styles.sectionLabel}>Overall progress</Text>
      <View style={styles.progressRow}>
        <Text style={styles.progressLabel}>Colony neutered</Text>
        <Text style={styles.progressFraction}>{c.neuteredTotal}/{c.totalCats}</Text>
      </View>
      <ProgressBar value={c.neuteredTotal} total={c.totalCats} />

      {/* by zone */}
      <Text style={styles.sectionLabel}>By neighbourhood zone</Text>
      {c.zones.map((zone) => (
        <View key={zone.name} style={styles.zoneBlock}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>{zone.name}</Text>
            <Text style={styles.progressFraction}>{zone.neutered}/{zone.total}</Text>
          </View>
          <ProgressBar value={zone.neutered} total={zone.total} />
        </View>
      ))}

      {/* export button */}
      <TouchableOpacity style={styles.exportButton}>
        <Text style={styles.exportIcon}>📄</Text>
        <Text style={styles.exportText}>Export progress report</Text>
      </TouchableOpacity>
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
    marginTop: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#999',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  statCardText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  statCardGreen: {
    fontSize: 13,
    color: '#2E9E60',
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 24,
    marginBottom: 10,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 13,
    color: '#333',
  },
  progressFraction: {
    fontSize: 13,
    color: '#999',
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    marginBottom: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFB3C6',
    borderRadius: 4,
  },
  zoneBlock: {
    marginBottom: 12,
  },
  exportButton: {
    flexDirection: 'row',
    backgroundColor: '#9B30D9',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    gap: 10,
  },
  exportIcon: {
    fontSize: 18,
  },
  exportText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
