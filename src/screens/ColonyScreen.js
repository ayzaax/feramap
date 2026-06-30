import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';

function ProgressBar({ value, total }) {
  const pct = total > 0 ? value / total : 0;
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${pct * 100}%` }]} />
    </View>
  );
}

export default function ColonyScreen({ navigation }) {
  const [colonyName, setColonyName] = useState('Colonia Centro');
  const [lastUpdated, setLastUpdated] = useState('Updating...');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    knownCats: 0,
    newThisWeek: 0,
    needTrapping: 0,
    reporters: 0,
    neuteredTotal: 0,
  });
  const [zones, setZones] = useState([]);

  const fetchColonyData = async () => {
    try {
      const [colonyRes, catsRes, zonesRes, reportersRes] = await Promise.all([
        supabase.from('colonies').select('name').limit(1).maybeSingle(),
        supabase.from('cats').select('id, status, created_at, zone_id'),
        supabase.from('zones').select('id, name'),
        supabase.from('profiles').select('*', { count: 'exact', head: true })
      ]);

      if (colonyRes.data?.name) {
        setColonyName(colonyRes.data.name);
      }

      const cats = catsRes.data || [];
      const zonesData = zonesRes.data || [];
      const reportersCount = reportersRes.count || 0;

      // 1. Calculate overall statistics
      const knownCats = cats.length;
      const neuteredTotal = cats.filter(c => c.status === 'neutered' || c.status === 'returned').length;
      const needTrapping = cats.filter(c => c.status === 'spotted' || c.status === 'trapped').length;

      // Calculate cats logged in the last 7 days
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const newThisWeek = cats.filter(c => new Date(c.created_at) >= oneWeekAgo).length;

      setStats({
        knownCats,
        newThisWeek,
        needTrapping,
        reporters: reportersCount,
        neuteredTotal,
      });

      // 2. Calculate statistics by zone
      const processedZones = zonesData.map(zone => {
        const zoneCats = cats.filter(c => c.zone_id === zone.id);
        const total = zoneCats.length;
        const neutered = zoneCats.filter(c => c.status === 'neutered' || c.status === 'returned').length;
        return {
          id: zone.id,
          name: zone.name,
          total,
          neutered,
        };
      });

      setZones(processedZones);

      // Set last updated timestamp
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastUpdated(`Updated at ${now}`);
    } catch (err) {
      console.error('Error fetching colony data:', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchColonyData();
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#B85CE8" />
        <Text style={styles.loadingText}>Loading colony statistics...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{colonyName}</Text>
      <Text style={styles.subtitle}>{lastUpdated}</Text>

      {/* stat cards */}
      <View style={styles.statCard}>
        <Text style={styles.statCardText}>{stats.knownCats} known cats</Text>
        <Text style={styles.statCardGreen}>+{stats.newThisWeek} this week</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statCardText}>{stats.needTrapping} need trapping</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statCardText}>{stats.reporters} volunteers</Text>
      </View>

      <TouchableOpacity
        style={styles.trapQueueButton}
        onPress={() => navigation.navigate('TrapQueue')}
      >
        <Text style={styles.trapQueueButtonText}>Trap Queue</Text>
      </TouchableOpacity>

      {/* overall progress */}
      <Text style={styles.sectionLabel}>Overall progress</Text>
      <View style={styles.progressRow}>
        <Text style={styles.progressLabel}>Colony neutered</Text>
        <Text style={styles.progressFraction}>{stats.neuteredTotal}/{stats.knownCats}</Text>
      </View>
      <ProgressBar value={stats.neuteredTotal} total={stats.knownCats} />

      {/* by zone */}
      <Text style={styles.sectionLabel}>By neighbourhood zone</Text>
      {zones.length === 0 ? (
        <View style={styles.emptyZonesCard}>
          <Text style={styles.emptyText}>No active zones defined yet.</Text>
        </View>
      ) : (
        zones.map((zone) => (
          <View key={zone.id} style={styles.zoneBlock}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>{zone.name}</Text>
              <Text style={styles.progressFraction}>{zone.neutered}/{zone.total}</Text>
            </View>
            <ProgressBar value={zone.neutered} total={zone.total} />
          </View>
        ))
      )}

      {/* export button */}
      <TouchableOpacity style={styles.exportButton}>
        <Text style={styles.exportIcon}>📄</Text>
        <Text style={styles.exportText}>Export progress report</Text>
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
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#888',
    fontSize: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#999',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  statCardText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  statCardGreen: {
    fontSize: 13,
    color: '#2E9E60',
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 24,
    marginBottom: 10,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 13,
    color: '#333',
  },
  progressFraction: {
    fontSize: 13,
    color: '#999',
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    marginBottom: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFB3C6',
    borderRadius: 4,
  },
  zoneBlock: {
    marginBottom: 12,
  },
  emptyZonesCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 13,
    color: '#888',
  },
  exportButton: {
    flexDirection: 'row',
    backgroundColor: '#9B30D9',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    gap: 10,
  },
  exportIcon: {
    fontSize: 18,
  },
  exportText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  trapQueueButton: {
    backgroundColor: '#FFD9E2',
    borderRadius: 16,
    padding: 16,
    marginTop: 4,
    marginBottom: 10,
    alignItems: 'center',
  },
  trapQueueButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#9B30D9',
  },
});
