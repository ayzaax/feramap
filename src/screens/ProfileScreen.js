import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../lib/supabase';

const STATUS_COLORS = {
  spotted: '#EF9F27',
  trapped: '#E8725A',
  neutered: '#7F77DD',
  returned: '#1D9E75',
};

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [followedCats, setFollowedCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchProfileData = async () => {
    try {
      // 1. Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (currentUser) {
        // 2. Fetch avatar and followed cats in parallel
        const [profileRes, followsRes] = await Promise.all([
          supabase.from('profiles').select('avatar_url').eq('id', currentUser.id).maybeSingle(),
          supabase.from('user_follows').select(`
            cat_id,
            cats (
              id,
              name,
              status,
              cat_photos (
                photo_url
              )
            )
          `).eq('user_id', currentUser.id)
        ]);

        if (profileRes.data?.avatar_url) {
          setAvatarUrl(profileRes.data.avatar_url);
        }

        if (followsRes.error) throw followsRes.error;

        // Process followed cats list
        const processed = (followsRes.data || [])
          .filter(f => f.cats) // Filter out any orphaned records
          .map(f => {
            const cat = f.cats;
            const photo = cat.cat_photos?.[0]?.photo_url || null;
            return {
              id: cat.id,
              name: cat.name || 'Unknown',
              status: cat.status,
              photo_url: photo,
            };
          });

        setFollowedCats(processed);
      }
    } catch (err) {
      console.error('Error fetching profile data:', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfileData();
    }, [])
  );

  const handlePickAvatar = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Denied', 'Permission to access your photos is required to change your profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (result.canceled || !result.assets?.[0]?.uri) return;

      const pickedUri = result.assets[0].uri;
      await handleUploadAvatar(pickedUri);
    } catch (err) {
      console.error('Error picking avatar:', err);
    }
  };

  const handleUploadAvatar = async (uri) => {
    if (!user) return;
    setUploading(true);

    try {
      // 1. Read file as base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });
      const arrayBuffer = decode(base64);
      const fileName = `${user.id}/avatar-${Date.now()}.jpg`;

      // 2. Upload to Supabase Storage (using the existing public cat-photos bucket)
      const { error: uploadError } = await supabase.storage
        .from('cat-photos')
        .upload(fileName, arrayBuffer, { contentType: 'image/jpeg', upsert: true });

      if (uploadError) throw uploadError;

      // 3. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('cat-photos')
        .getPublicUrl(fileName);

      // 4. Upsert user profile record with new avatar URL
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          avatar_url: publicUrl,
        });

      if (profileError) throw profileError;

      setAvatarUrl(publicUrl);
      Alert.alert('Success', 'Profile picture updated successfully!');
    } catch (err) {
      console.error('Error uploading avatar:', err);
      Alert.alert('Error', 'Failed to upload profile picture.');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#9B30D9" />
      </View>
    );
  }

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : '?';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>My Profile</Text>

      {/* User Info Card */}
      <View style={styles.userCard}>
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
              <Text style={styles.avatarText}>{userInitial}</Text>
            </View>
          )}
          <View style={styles.editBadge}>
            <Text style={styles.editBadgeText}>📸</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.userInfo}>
          <Text style={styles.userLabel}>Volunteer Account</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>
      </View>

      {/* Followed Cats Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cats I Follow ({followedCats.length})</Text>
        
        {followedCats.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🐈</Text>
            <Text style={styles.emptyTitle}>No followed cats yet</Text>
            <Text style={styles.emptySubtitle}>
              Follow cats from the Map or Cat List to get updates on their status here.
            </Text>
          </View>
        ) : (
          <View style={styles.catsList}>
            {followedCats.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={styles.catCard}
                onPress={() => navigation.navigate('CatProfile', { catId: cat.id })}
              >
                {cat.photo_url ? (
                  <Image source={{ uri: cat.photo_url }} style={styles.catPhoto} />
                ) : (
                  <View style={styles.catPhotoPlaceholder}>
                    <Text style={styles.catPlaceholderEmoji}>🐱</Text>
                  </View>
                )}
                <View style={styles.catInfo}>
                  <Text style={styles.catName}>{cat.name}</Text>
                  <View style={[styles.badge, { backgroundColor: STATUS_COLORS[cat.status] || '#888' }]}>
                    <Text style={styles.badgeText}>{cat.status}</Text>
                  </View>
                </View>
                <Text style={styles.arrow}>→</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#FFF0F3',
    padding: 24,
    paddingTop: 60,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF0F3',
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 24,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 28,
    shadowColor: '#B85CE8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatarImage: {
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  avatarPlaceholder: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFD9E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#9B30D9',
  },
  editBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#fff',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#9B30D9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  editBadgeText: {
    fontSize: 12,
  },
  userInfo: {
    flex: 1,
  },
  userLabel: {
    fontSize: 12,
    color: '#9B30D9',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  section: {
    flex: 1,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD9E2',
    borderStyle: 'dashed',
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    lineHeight: 18,
  },
  catsList: {
    gap: 12,
  },
  catCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  catPhoto: {
    width: 54,
    height: 54,
    borderRadius: 14,
    marginRight: 14,
  },
  catPhotoPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: '#FFF0F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  catPlaceholderEmoji: {
    fontSize: 24,
  },
  catInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  catName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
  },
  arrow: {
    fontSize: 18,
    color: '#ccc',
    paddingHorizontal: 8,
  },
  logoutButton: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E8725A',
    marginBottom: 20,
  },
  logoutText: {
    color: '#E8725A',
    fontSize: 16,
    fontWeight: '600',
  },
});
