import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function LocationScreen({ navigation, route }) {
  const { catId, catName } = route.params ?? {};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cat spotted here?</Text>
      <Text style={styles.subtitle}>We used your GPS.{'\n'}Adjust if needed.</Text>

      {/* map placeholder — real MapView in a later iteration */}
      <View style={styles.mapBox}>
        <View style={styles.mapCircle}>
          <Text style={styles.mapEmoji}>📍</Text>
        </View>
      </View>

      <Text style={styles.adjustHint}>Tap map to adjust pin</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          if (catId) {
            navigation.navigate('Camera', { catId, catName });
          } else {
            navigation.navigate('Identify');
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
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  header: {
    fontSize: 13,
    color: '#999',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    marginTop: 45,
  },
  subtitle: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
    marginBottom: 32,
  },
  mapBox: {
    backgroundColor: '#e8e8e8',
    borderRadius: 20,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  mapCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#d0d0d0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapEmoji: {
    fontSize: 64,
  },
  adjustHint: {
    textAlign: 'center',
    color: '#9B30D9',
    fontSize: 14,
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#9B30D9',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
