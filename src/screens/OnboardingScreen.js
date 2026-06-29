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
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../lib/supabase';

export default function OnboardingScreen({ onComplete }) {
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [colonies, setColonies] = useState([]);
  const [selectedColony, setSelectedColony] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchColonies = async () => {
      try {
        const { data, error } = await supabase.from('colonies').select('id, name');
        if (error) throw error;
        setColonies(data || []);
        if (data && data.length > 0) {
          // Default to the first colony (which will be Ciudad Lerdo)
          setSelectedColony(data[0].id);
        }
      } catch (err) {
        console.error('Error fetching colonies:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchColonies();
  }, []);

  const handlePickAvatar = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Denied', 'Permission to access your photos is required.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (result.canceled || !result.assets?.[0]?.uri) return;

      await handleUploadAvatar(result.assets[0].uri);
    } catch (err) {
      console.error('Error picking avatar:', err);
    }
  };

  const handleUploadAvatar = async (uri) => {
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });
      const arrayBuffer = decode(base64);
      const fileName = `${user.id}/avatar-${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('cat-photos')
        .upload(fileName, arrayBuffer, { contentType: 'image/jpeg', upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('cat-photos')
        .getPublicUrl(fileName);

      setAvatarUrl(publicUrl);
    } catch (err) {
      console.error('Error uploading avatar:', err);
      Alert.alert('Error', 'Failed to upload photo.');
    } finally {
      setUploading(false);
    }
  };

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

        {/* Avatar Uploader */}
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={handlePickAvatar}
          disabled={uploading}
        >
          {uploading ? (
            <View style={styles.avatarPlaceholder}>
              <ActivityIndicator color="#9B30D9" />
            </View>
          ) : avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarIcon}>📷</Text>
              <Text style={styles.avatarUploadText}>Add Photo</Text>
            </View>
          )}
        </TouchableOpacity>

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
  avatarContainer: {
    marginBottom: 32,
  },
  avatarImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: '#9B30D9',
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#FFD9E2',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  avatarUploadText: {
    fontSize: 12,
    color: '#9B30D9',
    fontWeight: '600',
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
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFF0F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
