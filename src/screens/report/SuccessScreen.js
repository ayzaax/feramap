import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

export default function SuccessScreen({ navigation, route }) {
  const { name, condition, photoUri } = route.params ?? {};
  const catName = name?.trim() || 'Unknown cat';
  const isUrgent = condition === 'injured' || condition === 'sick';

  return (
    <View style={styles.container}>

      {/* cat photo */}
      <View style={styles.avatarRing}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarEmoji}>🐱</Text>
          </View>
        )}
      </View>

      <Text style={styles.title}>{catName} is on the map!</Text>
      <Text style={styles.thanks}>The neighbourhood thanks you</Text>

      {isUrgent ? (
        <Text style={styles.urgent}>⚠️ Marked as {condition} — volunteers notified</Text>
      ) : (
        <Text style={styles.founder}>You're {catName}'s first spotter!</Text>
      )}

      <Image
        source={require('../../../assets/catsuccess.png')}
        style={styles.catIllustration}
      />

      {/* timeline */}
      <View style={styles.timeline}>
        <View style={styles.timelineRow}>
          <View style={[styles.dot, { backgroundColor: '#FF9800' }]} />
          <View>
            <Text style={styles.timelineBold}>First spotted — just now</Text>
            <Text style={styles.timelineSub}>Just now · by you</Text>
          </View>
        </View>
        <View style={styles.timelineRow}>
          <View style={[styles.dot, { backgroundColor: '#bbb' }]} />
          <Text style={styles.timelineSub}>Waiting for more sightings...</Text>
        </View>
      </View>

      {/* buttons */}
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => navigation.getParent()?.navigate('CatProfile')}
      >
        <Text style={styles.primaryButtonText}>View full profile</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => navigation.getParent()?.goBack()}
      >
        <Text style={styles.secondaryButtonText}>Back to map</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  avatarRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: '#B85CE8',
    marginBottom: 20,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    flex: 1,
    backgroundColor: '#FFD9E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  thanks: {
    fontSize: 15,
    color: '#B85CE8',
    marginBottom: 4,
  },
  founder: {
    fontSize: 15,
    color: '#B85CE8',
    fontWeight: '600',
    marginBottom: 16,
  },
  urgent: {
    fontSize: 15,
    color: '#FF9800',
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  catIllustration: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 24,
  },
  timeline: {
    alignSelf: 'stretch',
    marginBottom: 32,
    gap: 12,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 3,
  },
  timelineBold: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  timelineSub: {
    fontSize: 13,
    color: '#888',
  },
  primaryButton: {
    backgroundColor: '#9B30D9',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    alignSelf: 'stretch',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#9B30D9',
    padding: 16,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  secondaryButtonText: {
    color: '#9B30D9',
    fontSize: 16,
    fontWeight: '600',
  },
});
