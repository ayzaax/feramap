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
  TextInput,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
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

const STATUS_COLORS = {
  spotted: '#EF9F27',
  trapped: '#E8725A',
  neutered: '#7F77DD',
  returned: '#1D9E75',
};

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('volunteer');
  const [colonyName, setColonyName] = useState('Ciudad Lerdo');
  const [followedCats, setFollowedCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [tempDisplayName, setTempDisplayName] = useState('');
  const [tempAvatarUrl, setTempAvatarUrl] = useState('');
  const [colonies, setColonies] = useState([]);
  const [colonyId, setColonyId] = useState(null);
  const [tempColonyId, setTempColonyId] = useState(null);

  const fetchProfileData = async () => {
    try {
      // 1. Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (currentUser) {
        // 2. Fetch avatar, profile details, followed cats, and colonies in parallel
        const [profileRes, followsRes, coloniesRes] = await Promise.all([
          supabase.from('profiles').select('avatar_url, display_name, role, colony_id, colonies(name)').eq('id', currentUser.id).maybeSingle(),
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
          `).eq('user_id', currentUser.id),
          supabase.from('colonies').select('id, name')
        ]);

        if (profileRes.data) {
          if (profileRes.data.avatar_url) {
            setAvatarUrl(profileRes.data.avatar_url);
            setTempAvatarUrl(profileRes.data.avatar_url);
          }
          if (profileRes.data.display_name) {
            setDisplayName(profileRes.data.display_name);
            setTempDisplayName(profileRes.data.display_name);
          }
          if (profileRes.data.role) setRole(profileRes.data.role);
          if (profileRes.data.colony_id) {
            setColonyId(profileRes.data.colony_id);
            setTempColonyId(profileRes.data.colony_id);
          }
          if (profileRes.data.colonies?.name) setColonyName(profileRes.data.colonies.name);
        }

        if (coloniesRes.data) {
          setColonies(coloniesRes.data);
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleOpenEdit = () => {
    setTempDisplayName(displayName);
    setTempAvatarUrl(avatarUrl);
    setTempColonyId(colonyId);
    setIsEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!tempDisplayName.trim()) {
      Alert.alert('Error', 'Display name cannot be empty.');
      return;
    }
    if (!tempColonyId) {
      Alert.alert('Error', 'Please select a colony.');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: tempDisplayName.trim(),
          avatar_url: tempAvatarUrl,
          colony_id: tempColonyId,
        })
        .eq('id', user.id);

      if (error) throw error;

      setDisplayName(tempDisplayName.trim());
      setAvatarUrl(tempAvatarUrl);
      setColonyId(tempColonyId);

      const selectedColony = colonies.find(c => c.id === tempColonyId);
      if (selectedColony) {
        setColonyName(selectedColony.name);
      }

      setIsEditModalVisible(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (err) {
      console.error('Error saving profile:', err);
      Alert.alert('Error', 'Failed to save profile settings.');
    } finally {
      setSaving(false);
    }
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
        <View style={styles.avatarContainer}>
          {AVATAR_MAP[avatarUrl] ? (
            <Image source={AVATAR_MAP[avatarUrl]} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{userInitial}</Text>
            </View>
          )}
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userLabel}>{role} Account</Text>
          <Text style={styles.userName}>{displayName || 'Unnamed Volunteer'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <TouchableOpacity style={styles.editProfileButton} onPress={handleOpenEdit}>
            <Text style={styles.editProfileButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Choose Avatar Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              {/* Display Name Input */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Display Name</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={tempDisplayName}
                  onChangeText={setTempDisplayName}
                  placeholder="Enter your name..."
                  placeholderTextColor="#aaa"
                />
              </View>

              {/* Select Colony */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Select Colony</Text>
                <View style={styles.coloniesContainer}>
                  {colonies.map((colony) => {
                    const isSelected = tempColonyId === colony.id;
                    return (
                      <TouchableOpacity
                        key={colony.id}
                        style={[styles.colonyChip, isSelected && styles.colonyChipActive]}
                        onPress={() => setTempColonyId(colony.id)}
                      >
                        <Text style={[styles.colonyChipText, isSelected && styles.colonyChipTextActive]}>
                          📍 {colony.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Avatar Selection Grid */}
              <Text style={styles.modalInputLabel}>Choose Avatar</Text>
              <View style={styles.avatarGrid}>
                {AVATAR_OPTIONS.map((option) => {
                  const isSelected = tempAvatarUrl === option.key;
                  return (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.avatarWrapper,
                        isSelected && { transform: [{ scale: 1.08 }] }
                      ]}
                      onPress={() => setTempAvatarUrl(option.key)}
                      activeOpacity={0.8}
                    >
                      <View style={[
                        styles.avatarCircle,
                        isSelected ? styles.avatarCircleSelected : styles.avatarCircleUnselected
                      ]}>
                        <Image source={AVATAR_MAP[option.key]} style={styles.avatarGridImage} />
                      </View>
                      {isSelected && (
                        <View style={styles.checkBadge}>
                          <Text style={styles.checkBadgeText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.pickedText}>
                You picked: <Text style={styles.pickedName}>{AVATAR_OPTIONS.find(o => o.key === tempAvatarUrl)?.label || ''}</Text>
              </Text>

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.modalSaveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                <Text style={styles.modalSaveButtonText}>
                  {saving ? 'Saving...' : 'Save Profile'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

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
    marginBottom: 40,
    marginTop: 12,
  },
  logoutText: {
    color: '#E8725A',
    fontSize: 16,
    fontWeight: '600',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 2,
  },
  settingsCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#B85CE8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabelField: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFF0F3',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#333',
    borderWidth: 1,
    borderColor: '#FFD9E2',
  },
  infoGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#9B30D9',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  editProfileButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3E5F5',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  editProfileButtonText: {
    color: '#B85CE8',
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E8725A',
  },
  modalScroll: {
    padding: 24,
  },
  modalInputGroup: {
    marginBottom: 20,
  },
  modalInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  modalTextInput: {
    backgroundColor: '#FFF0F3',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#333',
    borderWidth: 1,
    borderColor: '#FFD9E2',
  },
  modalColonyInfo: {
    marginBottom: 24,
  },
  modalColonyValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    backgroundColor: '#F5F5F5',
    padding: 14,
    borderRadius: 12,
  },
  coloniesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  colonyChip: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: '#FFD9E2',
  },
  colonyChipActive: {
    backgroundColor: '#FFD9E2',
    borderColor: '#9B30D9',
  },
  colonyChipText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
  },
  colonyChipTextActive: {
    color: '#9B30D9',
    fontWeight: '700',
  },
  modalSaveButton: {
    backgroundColor: '#9B30D9',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  modalSaveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
  },
  avatarWrapper: {
    width: '22%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 12,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  avatarCircleUnselected: {
    backgroundColor: '#FFD9E2',
  },
  avatarCircleSelected: {
    backgroundColor: '#ffffff',
    borderWidth: 2.5,
    borderColor: '#B85CE8',
  },
  avatarGridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  checkBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 18,
    height: 18,
    borderRadius: 9,
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
    fontSize: 9,
    fontWeight: '800',
  },
  pickedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginTop: 6,
    textAlign: 'center',
  },
  pickedName: {
    color: '#B85CE8',
    fontWeight: '700',
  },
});
