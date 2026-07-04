import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { supabase } from '../lib/supabase';

const AVATAR_OPTIONS = [
  { key: 'cat_orange_tabby', label: 'Orange Tabby' },
  { key: 'cat_black', label: 'Black Cat' },
  { key: 'cat_white', label: 'Snow White' },
  { key: 'cat_grey', label: 'Grey Ghost' },
  { key: 'cat_calico', label: 'Calico' },
  { key: 'cat_brown_tabby', label: 'Brown Tabby' },
  { key: 'cat_ginger', label: 'Ginger' },
  { key: 'cat_tuxedo', label: 'Tuxedo' },
];

const AVATAR_MAP = {
  cat_orange_tabby: require('../../assets/avatars/cat_orange_tabby.png'),
  cat_black: require('../../assets/avatars/cat_black.png'),
  cat_white: require('../../assets/avatars/cat_white.png'),
  cat_grey: require('../../assets/avatars/cat_grey.png'),
  cat_calico: require('../../assets/avatars/cat_calico.png'),
  cat_brown_tabby: require('../../assets/avatars/cat_brown_tabby.png'),
  cat_ginger: require('../../assets/avatars/cat_ginger.png'),
  cat_tuxedo: require('../../assets/avatars/cat_tuxedo.png'),
};

export default function OnboardingScreen({ onComplete }) {
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('cat_orange_tabby');
  const [colonies, setColonies] = useState([]);
  const [selectedColony, setSelectedColony] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase
      .from('colonies')
      .select('id, name')
      .then(({ data }) => {
        if (data) setColonies(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async () => {
    if (!displayName.trim()) {
      Alert.alert('Name Required', 'Please enter your name to complete your profile.');
      return;
    }
    if (!selectedColony) {
      Alert.alert('Colony Required', 'Please select your local community.');
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No active session found.');

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          display_name: displayName.trim(),
          avatar_url: avatarUrl,
          colony_id: selectedColony,
          role: 'volunteer', // Default role is volunteer
        });

      if (error) throw error;

      onComplete();
    } catch (err) {
      console.error('Error completing onboarding:', err);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#9B30D9" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Welcome to FeraMap!</Text>
        <Text style={styles.subtitle}>Let's set up your volunteer profile before we start.</Text>

        {/* Avatar Selection Section */}
        <View style={styles.avatarSection}>
          <Text style={styles.avatarSectionTitle}>Choose your cat</Text>
          <Text style={styles.avatarSectionSubtitle}>Pick the cat that represents you best</Text>
          
          <View style={styles.avatarGrid}>
            {AVATAR_OPTIONS.map((option) => {
              const isSelected = avatarUrl === option.key;
              return (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.avatarWrapper,
                    isSelected && { transform: [{ scale: 1.08 }] }
                  ]}
                  onPress={() => setAvatarUrl(option.key)}
                  activeOpacity={0.8}
                >
                  <View style={[
                    styles.avatarCircle,
                    isSelected ? styles.avatarCircleSelected : styles.avatarCircleUnselected
                  ]}>
                    <Image source={AVATAR_MAP[option.key]} style={styles.avatarGridImage} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
          
          <Text style={styles.pickedText}>
            You picked: <Text style={styles.pickedName}>{AVATAR_OPTIONS.find(o => o.key === avatarUrl)?.label || ''}</Text>
          </Text>
        </View>

        {/* Display Name Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>What should we call you?</Text>
          <TextInput
            style={styles.input}
            placeholder="Your name or nickname..."
            placeholderTextColor="#aaa"
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
          />
        </View>

        {/* Colony / City Selector */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Select your local community:</Text>
          <View style={styles.coloniesContainer}>
            {colonies.map((colony) => {
              const isSelected = selectedColony === colony.id;
              return (
                <TouchableOpacity
                  key={colony.id}
                  style={[styles.colonyChip, isSelected && styles.colonyChipActive]}
                  onPress={() => setSelectedColony(colony.id)}
                >
                  <Text style={[styles.colonyChipText, isSelected && styles.colonyChipTextActive]}>
                    📍 {colony.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, (submitting || !displayName.trim()) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting || !displayName.trim()}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Let's Go!  →</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF0F3',
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  emojiHeader: {
    fontSize: 40,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  input: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    color: '#333',
    borderWidth: 1.5,
    borderColor: '#FFD9E2',
  },
  coloniesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colonyChip: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#FFD9E2',
  },
  colonyChipActive: {
    backgroundColor: '#FFD9E2',
    borderColor: '#9B30D9',
  },
  colonyChipText: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  colonyChipTextActive: {
    color: '#9B30D9',
    fontWeight: '700',
  },
  submitButton: {
    width: '100%',
    backgroundColor: '#9B30D9',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#9B30D9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.6,
    elevation: 0,
    shadowOpacity: 0,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  avatarSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
    textAlign: 'center',
  },
  avatarSectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 12,
  },
  avatarWrapper: {
    width: '22%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  avatarCircleUnselected: {
    backgroundColor: '#FFD9E2',
  },
  avatarCircleSelected: {
    backgroundColor: '#ffffff',
    borderWidth: 4,
    borderColor: '#B85CE8',
  },
  avatarGridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  checkBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#B85CE8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  checkBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  pickedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  pickedName: {
    color: '#B85CE8',
    fontWeight: '700',
  },
});
