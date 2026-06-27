import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const NEARBY_CATS = [
  { id: '1', name: 'Taco', detail: '12m away · Spotted' },
  { id: '2', name: 'Luna', detail: '38m away · Neutered' },
  { id: 'new', name: 'This is a new cat!', detail: 'Never been spotted' },
];

export default function IdentifyScreen({ navigation }) {
  const [selected, setSelected] = useState('new');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Seen this cat before?</Text>
      <Text style={styles.subtitle}>2 cats known nearby.{'\n'}Is this one of them?</Text>

      {NEARBY_CATS.map((cat) => (
        <TouchableOpacity
          key={cat.id}
          style={styles.row}
          onPress={() => setSelected(cat.id)}
        >
          {cat.id !== 'new' && (
            <View style={styles.catAvatar}>
              <Text style={styles.catEmoji}>🐱</Text>
            </View>
          )}
          <View style={styles.catInfo}>
            <Text style={styles.catName}>{cat.name}</Text>
            <Text style={styles.catDetail}>{cat.detail}</Text>
          </View>
          <View style={styles.radio}>
            {selected === cat.id && <View style={styles.radioFilled} />}
          </View>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Camera', { selectedCatId: selected, isNewCat: selected === 'new' })}
      >
        <Text style={styles.buttonText}>Continue  →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    marginTop: 50,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    lineHeight: 22,
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD9E2',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  catAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  catEmoji: {
    fontSize: 24,
  },
  catInfo: {
    flex: 1,
  },
  catName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  catDetail: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  radio: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#9B30D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioFilled: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#9B30D9',
  },
  button: {
    backgroundColor: '#9B30D9',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
