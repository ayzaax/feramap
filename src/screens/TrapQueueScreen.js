import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';

const FILTERS = ['All', 'Urgent', 'New', 'Overdue'];

const PRIORITY_COLORS = {
  Injured: '#E8725A',
  New: '#2E9E60',
  Overdue: '#7F77DD',
  Urgent: '#E8725A',
  High: '#E8725A',
  Medium: '#EF9F27',
  Low: '#7F77DD',
};

export default function TrapQueueScreen({ navigation }) {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState('volunteer');

  const fetchQueue = async () => {
    try {
      // 1. Get current logged in user and their role
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();
        
        if (profile?.role) {
          setUserRole(profile.role);
        }
      }

      // 2. Fetch cats that need trapping
      const { data: catsData, error: catsError } = await supabase
        .from('cats')
        .select(`
          id,
          name,
          priority,
          status,
          assigned_to,
          zones (
            name
          ),
          cat_photos (
            photo_url
          ),
          sightings (
            created_at
          )
        `)
        .in('status', ['spotted', 'trapped']);

      if (catsError) throw catsError;

      // 3. Fetch profiles of assigned volunteers in parallel (client-side join)
      const assignedIds = (catsData || []).map(c => c.assigned_to).filter(Boolean);
      let profilesMap = {};
      
      if (assignedIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .in('id', assignedIds);

        (profilesData || []).forEach(p => {
          profilesMap[p.id] = p;
        });
      }

      // 4. Combine data
      const processed = (catsData || []).map(cat => ({
        ...cat,
        assigned_volunteer: profilesMap[cat.assigned_to] || null,
      }));

      setCats(processed);
    } catch (err) {
      console.error('Error fetching trap queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchQueue();
    }, [])
  );

  const handleAssign = async (catId) => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const { error } = await supabase
        .from('cats')
        .update({ assigned_to: currentUser.id })
        .eq('id', catId);

      if (error) throw error;
      await fetchQueue();
      Alert.alert('Success', 'Task assigned to you successfully!');
    } catch (err) {
      console.error('Error assigning cat:', err);
      Alert.alert('Error', 'Failed to assign task.');
      setLoading(false);
    }
  };

  const handleRelease = async (catId) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('cats')
        .update({ assigned_to: null })
        .eq('id', catId);

      if (error) throw error;
      await fetchQueue();
      Alert.alert('Success', 'Task released.');
    } catch (err) {
      console.error('Error releasing cat:', err);
      Alert.alert('Error', 'Failed to release task.');
      setLoading(false);
    }
  };

  const handleUpdateStatus = (catId, catName) => {
    Alert.alert(
      `Update Status for ${catName || 'this cat'}`,
      'Select the current status:',
      [
        { text: 'Spotted (Needs trapping)', onPress: () => setCatStatusInDb(catId, 'spotted') },
        { text: 'Trapped (In transit/clinic)', onPress: () => setCatStatusInDb(catId, 'trapped') },
        { text: 'Neutered (Ready to return)', onPress: () => setCatStatusInDb(catId, 'neutered') },
        { text: 'Returned (Back in colony)', onPress: () => setCatStatusInDb(catId, 'returned') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const setCatStatusInDb = async (catId, newStatus) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('cats')
        .update({ status: newStatus })
        .eq('id', catId);

      if (error) throw error;
      await fetchQueue();
      Alert.alert('Success', `Status updated to ${newStatus}!`);
    } catch (err) {
      console.error('Error updating cat status:', err);
      Alert.alert('Error', 'Failed to update status.');
      setLoading(false);
    }
  };

  const filtered = cats.filter(cat => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Urgent') return cat.priority === 'Urgent' || cat.priority === 'High';
    return cat.priority === activeFilter;
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#B85CE8" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* back button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{cats.length} cats need help</Text>
      <Text style={styles.subtitle}>Sorted by priority</Text>

      {/* filter tabs */}
      <View style={styles.filterContainer}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* cat cards */}
      {filtered.length === 0 ? (
        <View style={styles.emptyQueueCard}>
          <Text style={styles.emptyText}>No cats in the queue matching this filter.</Text>
        </View>
      ) : (
        filtered.map(cat => {
          const photoUrl = cat.cat_photos?.[0]?.photo_url;
          const sightingsCount = cat.sightings?.length || 1;
          const isAssignedToMe = cat.assigned_to === currentUser?.id;

          return (
            <View key={cat.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.catAvatar}>
                  {photoUrl ? (
                    <Image source={{ uri: photoUrl }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.catEmoji}>🐱</Text>
                  )}
                </View>
                <View style={styles.cardInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.catName}>{cat.name || 'Unknown cat'}</Text>
                    <Text style={[styles.badge, { color: PRIORITY_COLORS[cat.priority] || '#9B30D9' }]}>
                      {cat.priority === 'Urgent' || cat.priority === 'High' ? '🔔 ' : ''}{cat.priority}
                    </Text>
                  </View>
                  <Text style={styles.catLocation}>
                    📍 {cat.zones?.name ?? 'Ciudad Lerdo'} · {sightingsCount} sighting{sightingsCount > 1 ? 's' : ''}
                  </Text>
                </View>
              </View>

              {/* Volunteer Assignment Banner */}
              {cat.assigned_volunteer && (
                <View style={styles.assignmentBanner}>
                  {cat.assigned_volunteer.avatar_url ? (
                    <Image source={{ uri: cat.assigned_volunteer.avatar_url }} style={styles.assignedAvatar} />
                  ) : (
                    <View style={styles.assignedAvatarPlaceholder}>
                      <Text style={styles.assignedAvatarText}>
                        {cat.assigned_volunteer.display_name?.charAt(0).toUpperCase() || '?'}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.assignmentText}>
                    Assigned to <Text style={styles.assignmentName}>{cat.assigned_volunteer.display_name || 'Volunteer'}</Text>
                  </Text>
                </View>
              )}

              {/* Navigation Buttons */}
              <View style={styles.cardButtons}>
                <TouchableOpacity 
                  style={styles.cardButtonSecondary}
                  onPress={() => navigation.navigate('CatProfile', { catId: cat.id })}
                >
                  <Text style={styles.cardButtonTextSecondary}>View Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.cardButtonSecondary}
                  onPress={() => navigation.navigate('Main', { screen: 'Map', params: { centerOnCat: cat.id } })}
                >
                  <Text style={styles.cardButtonTextSecondary}>See on Map</Text>
                </TouchableOpacity>
              </View>

              {/* Trapping Action Buttons */}
              <View style={styles.actionRow}>
                {!cat.assigned_to ? (
                  // Unassigned Task
                  (userRole === 'volunteer' || userRole === 'coordinator') ? (
                    <TouchableOpacity 
                      style={styles.assignButton}
                      onPress={() => handleAssign(cat.id)}
                    >
                      <Text style={styles.assignButtonText}>🪤 Claim Task (Assign to me)</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.disabledAction}>
                      <Text style={styles.disabledActionText}>Help Needed (Volunteers Only)</Text>
                    </View>
                  )
                ) : (
                  // Assigned Task
                  (isAssignedToMe || userRole === 'coordinator') ? (
                    <View style={styles.assignedActionRow}>
                      <TouchableOpacity 
                        style={styles.statusButton}
                        onPress={() => handleUpdateStatus(cat.id, cat.name)}
                      >
                        <Text style={styles.statusButtonText}>Update Status</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.releaseButton}
                        onPress={() => handleRelease(cat.id)}
                      >
                        <Text style={styles.releaseButtonText}>Release</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.disabledAction}>
                      <Text style={styles.disabledActionText}>
                        Assigned to {cat.assigned_volunteer?.display_name || 'another volunteer'}
                      </Text>
                    </View>
                  ))}
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#FFF0F3',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
    marginTop: 40,
  },
  subtitle: {
    fontSize: 13,
    color: '#999',
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    borderRadius: 24,
    padding: 4,
    marginBottom: 20,
  },
  filterChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: '#FFB3C6',
  },
  filterText: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#1a1a1a',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#B85CE8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#FFD9E2',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  catAvatar: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#FFF0F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  catEmoji: {
    fontSize: 28,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    resizeMode: 'cover',
  },
  cardInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  badge: {
    fontSize: 13,
    fontWeight: '700',
  },
  catLocation: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  assignmentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F3',
    borderRadius: 12,
    padding: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFD9E2',
  },
  assignedAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  assignedAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFD9E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  assignedAvatarText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9B30D9',
  },
  assignmentText: {
    fontSize: 13,
    color: '#555',
  },
  assignmentName: {
    fontWeight: '700',
    color: '#9B30D9',
  },
  cardButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  cardButtonSecondary: {
    flex: 1,
    backgroundColor: '#FFF0F3',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD9E2',
  },
  cardButtonTextSecondary: {
    color: '#9B30D9',
    fontSize: 13,
    fontWeight: '700',
  },
  actionRow: {
    marginTop: 4,
  },
  assignButton: {
    backgroundColor: '#9B30D9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  assignButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  assignedActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    flex: 2,
    backgroundColor: '#E8725A',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  statusButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  releaseButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E8725A',
  },
  releaseButtonText: {
    color: '#E8725A',
    fontSize: 14,
    fontWeight: '700',
  },
  disabledAction: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  disabledActionText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyQueueCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFD9E2',
    borderStyle: 'dashed',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  backArrow: {
    fontSize: 28,
    color: '#9B30D9',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0F3',
  },
});
