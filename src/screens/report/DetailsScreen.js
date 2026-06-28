import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../../lib/supabase';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { photoUri } = route.params ?? {};
  const location = route.params?.location ?? { latitude: 25.5428, longitude: -103.4068 };

  const handleSubmit = async () => {
    if (!condition) return;
    setLoading(true);
    setError('');

    const { data: newCat, error: catError } = await supabase
      .from('cats')
      .insert({
        name: name.trim() || null,
        status: 'spotted',
        priority: condition === 'injured' || condition === 'sick' ? 'Urgent' : 'Medium',
        colony_id: '00000000-0000-0000-0000-000000000001',
      })
      .select()
      .single();

    if (catError) {
      setError(catError.message);
      setLoading(false);
      return;
    }

    const { error: sightingError } = await supabase
      .from('sightings')
      .insert({
        cat_id: newCat.id,
        location: `POINT(${location.longitude} ${location.latitude})`,
        notes: notes.trim() || null,
        condition: condition,
        status: 'spotted',
      });

    if (sightingError) {
      setError(sightingError.message);
      setLoading(false);
      return;
    }

    let finalPhotoUri = photoUri;
    if (photoUri) {
      try {
        const base64 = await FileSystem.readAsStringAsync(photoUri, {
          encoding: 'base64',
        });
        const arrayBuffer = decode(base64);
        const fileName = `${newCat.id}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('cat-photos')
          .upload(fileName, arrayBuffer, { contentType: 'image/jpeg', upsert: true });

        if (uploadError) {
          console.log('Photo upload error:', uploadError.message);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('cat-photos')
            .getPublicUrl(fileName);
          await supabase.from('cat_photos').insert({
            cat_id: newCat.id,
            photo_url: publicUrl,
          });
          finalPhotoUri = publicUrl;
        }
      } catch (uploadErr) {
        console.log('Photo upload error:', JSON.stringify(uploadErr, null, 2));
        console.log('Photo upload error message:', uploadErr?.message);
        console.log('photoUri was:', photoUri);
      }
    }

    navigation.navigate('Success', {
      name: name || 'Unknown cat',
      condition,
      photoUri: finalPhotoUri,
      catId: newCat.id,
    });
  };

  const isUrgent = condition === 'injured' || condition === 'sick';

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

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.button, (!condition || loading) && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={!condition || loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Saving...' : isUrgent ? 'Report urgently' : 'Report cat'}
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
  errorText: {
    color: '#c0392b',
    fontSize: 13,
    marginBottom: 12,
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
