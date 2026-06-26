import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';

const CONDITIONS = [
  { id: 'healthy', label: 'Healthy', color: '#4CAF50' },
  { id: 'injured', label: 'Injured', color: '#FF9800' },
  { id: 'sick', label: 'Sick', color: '#29B6F6' },
  { id: 'unknown', label: 'Unknown', color: '#bbb' },
];

export default function DetailsScreen({ navigation, route }) {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [condition, setCondition] = useState(null);
  const { photoUri } = route.params ?? {};

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Tell us about them</Text>
      <Text style={styles.subtitle}>All fields optional except condition.</Text>

      {/* name input */}
      <View style={styles.inputBox}>
        <Text style={styles.inputLabel}>Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Leave blank if unsure..."
          placeholderTextColor="#aaa"
          value={name}
          onChangeText={setName}
        />
      </View>

      {/* notes input */}
      <View style={styles.inputBox}>
        <Text style={styles.inputLabel}>Notes</Text>
        <TextInput
          style={styles.input}
          placeholder="Colour, behaviour, location details..."
          placeholderTextColor="#aaa"
          value={notes}
          onChangeText={setNotes}
          multiline
        />
      </View>

      {/* condition chips */}
      <Text style={styles.conditionLabel}>Condition</Text>
      <View style={styles.chipsRow}>
        {CONDITIONS.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={[
              styles.chip,
              { backgroundColor: c.color },
              condition === c.id && styles.chipSelected,
            ]}
            onPress={() => setCondition(c.id)}
          >
            <Text style={styles.chipText}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.button, !condition && styles.buttonDisabled]}
        onPress={() => condition && navigation.navigate('Success', { name, notes, condition, photoUri })}
      >
        <Text style={styles.buttonText}>
          {condition === 'injured' || condition === 'sick'
            ? 'Report urgently'
            : 'Report cat'}
        </Text>
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
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    marginTop: 45,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 24,
  },
  inputBox: {
    backgroundColor: '#FFD9E2',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  input: {
    fontSize: 14,
    color: '#555',
  },
  conditionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 8,
    marginBottom: 12,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 32,
  },
  chip: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chipSelected: {
    borderWidth: 2,
    borderColor: '#1a1a1a',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  button: {
    backgroundColor: '#9B30D9',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
