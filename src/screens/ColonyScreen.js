import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
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
  const [exporting, setExporting] = useState(false);
  const [stats, setStats] = useState({
    knownCats: 0,
    newThisWeek: 0,
    needTrapping: 0,
    reporters: 0,
    neuteredTotal: 0,
    earliestCatDate: '—',
    addedThisMonth: 0,
    urgentCats: 0,
  });
  const [zones, setZones] = useState([]);

  const fetchColonyData = async () => {
    try {
      // 1. Get current logged-in user
      const { data: { user } } = await supabase.auth.getUser();
      let colonyId = null;

      if (user) {
        // 2. Fetch the user's colony_id from their profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('colony_id')
          .eq('id', user.id)
          .maybeSingle();
        colonyId = profile?.colony_id;
      }

      // If user has no colony, fallback to the first colony in the database so the screen is not empty
      if (!colonyId) {
        const { data: firstColony } = await supabase
          .from('colonies')
          .select('id')
          .limit(1)
          .maybeSingle();
        colonyId = firstColony?.id;
      }

      if (!colonyId) {
        setLoading(false);
        return;
      }

      const [colonyRes, catsRes, zonesRes, reportersRes] = await Promise.all([
        supabase.from('colonies').select('name').eq('id', colonyId).maybeSingle(),
        supabase.from('cats').select('id, status, priority, created_at, zone_id').eq('colony_id', colonyId),
        supabase.from('zones').select('id, name').eq('colony_id', colonyId),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('colony_id', colonyId)
      ]);

      console.log('--- COLONY DIAGNOSTICS ---');
      console.log('Selected Colony ID:', colonyId);
      console.log('Colony Name Response:', JSON.stringify(colonyRes, null, 2));
      console.log('Cats Response:', JSON.stringify(catsRes, null, 2));
      console.log('Zones Response:', JSON.stringify(zonesRes, null, 2));
      console.log('Reporters Count:', reportersRes.count);

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

      // Calculate earliest cat creation date
      const earliestDate = cats.length > 0 
        ? new Date(Math.min(...cats.map(c => new Date(c.created_at))))
        : null;
      const earliestCatDateFormatted = earliestDate
        ? earliestDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '—';

      // Calculate cats added this calendar month
      const nowMonth = new Date();
      const addedThisMonth = cats.filter(c => {
        const catDate = new Date(c.created_at);
        return catDate.getMonth() === nowMonth.getMonth() && catDate.getFullYear() === nowMonth.getFullYear();
      }).length;

      // Calculate urgent / injured cats count
      const urgentCats = cats.filter(c => c.priority === 'Urgent').length;

      setStats({
        knownCats,
        newThisWeek,
        needTrapping,
        reporters: reportersCount,
        neuteredTotal,
        earliestCatDate: earliestCatDateFormatted,
        addedThisMonth,
        urgentCats,
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

  const handleExportReport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const htmlContent = `
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                color: #1a1a1a;
                padding: 40px;
                line-height: 1.6;
                background-color: #ffffff;
              }
              .header {
                border-bottom: 1px solid #1a1a1a;
                padding-bottom: 20px;
                margin-bottom: 30px;
              }
              .title {
                font-size: 26px;
                font-weight: 700;
                letter-spacing: -0.5px;
                color: #1a1a1a;
                text-transform: uppercase;
                margin: 0;
              }
              .subtitle {
                font-size: 13px;
                color: #555;
                margin-top: 8px;
                font-weight: 500;
              }
              .period {
                font-size: 12px;
                color: #666;
                margin-top: 4px;
                font-style: italic;
              }
              .grid {
                display: flex;
                flex-wrap: wrap;
                justify-content: space-between;
                margin-bottom: 30px;
              }
              .card {
                background-color: #f5f5f5;
                border: 1px solid #e5e5e5;
                border-radius: 4px;
                padding: 20px;
                width: 48%;
                margin-bottom: 15px;
                box-sizing: border-box;
              }
              .card-value {
                font-size: 28px;
                font-weight: 700;
                color: #1a1a1a;
              }
              .card-label {
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: #555;
                margin-top: 4px;
              }
              .section-title {
                font-size: 18px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: #1a1a1a;
                margin-top: 30px;
                margin-bottom: 20px;
                border-left: 3px solid #6B21A8;
                padding-left: 12px;
              }
              .progress-container {
                background-color: #e5e5e5;
                border-radius: 2px;
                height: 12px;
                width: 100%;
                overflow: hidden;
                margin-bottom: 8px;
              }
              .progress-bar {
                background-color: #374151;
                height: 100%;
              }
              .progress-text {
                font-size: 13px;
                color: #444;
                margin-bottom: 30px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 15px;
                margin-bottom: 30px;
              }
              th, td {
                padding: 10px 12px;
                text-align: left;
                border-bottom: 1px solid #e5e5e5;
                font-size: 13px;
              }
              th {
                background-color: #1a1a1a;
                color: #ffffff;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              tr:nth-child(even) {
                background-color: #f9f9f9;
              }
              .rate-cell {
                font-weight: 700;
                color: #1a1a1a;
              }
              .summary-line {
                font-size: 12px;
                color: #444;
                margin-top: 40px;
                padding: 15px;
                background-color: #f9f9f9;
                border-left: 3px solid #374151;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 class="title">FeraMap Progress Report</h1>
              <div class="subtitle">Colony Location: ${colonyName} &middot; Generated on ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
              <div class="period">Period: ${stats.earliestCatDate} to ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
            </div>

            <div class="grid">
              <div class="card">
                <div class="card-value">${stats.knownCats}</div>
                <div class="card-label">Total Known Cats</div>
              </div>
              <div class="card">
                <div class="card-value">${stats.neuteredTotal}</div>
                <div class="card-label">Neutered Cats</div>
              </div>
              <div class="card">
                <div class="card-value">${stats.needTrapping}</div>
                <div class="card-label">Trapping Needed</div>
              </div>
              <div class="card">
                <div class="card-value">${stats.reporters}</div>
                <div class="card-label">Community Reporters</div>
              </div>
              <div class="card">
                <div class="card-value">${stats.addedThisMonth}</div>
                <div class="card-label">Cats Added This Month</div>
              </div>
              <div class="card">
                <div class="card-value">${stats.urgentCats}</div>
                <div class="card-label">Urgent / Injured Cats</div>
              </div>
            </div>

            <h2 class="section-title">Overall Neuter Rate</h2>
            <div class="progress-container">
              <div class="progress-bar" style="width: ${stats.knownCats > 0 ? (stats.neuteredTotal / stats.knownCats * 100) : 0}%"></div>
            </div>
            <div class="progress-text">
              The overall neuter rate is ${stats.knownCats > 0 ? Math.round(stats.neuteredTotal / stats.knownCats * 100) : 0}% (${stats.neuteredTotal} of ${stats.knownCats} community cats are neutered).
            </div>

            <h2 class="section-title">Breakdown by Neighborhood Zone</h2>
            <table>
              <thead>
                <tr>
                  <th>Zone Name</th>
                  <th>Neutered</th>
                  <th>Total Cats</th>
                  <th>Neuter Rate</th>
                </tr>
              </thead>
              <tbody>
                ${zones.map(z => `
                  <tr>
                    <td><strong>${z.name}</strong></td>
                    <td>${z.neutered}</td>
                    <td>${z.total}</td>
                    <td class="rate-cell">${z.total > 0 ? Math.round(z.neutered / z.total * 100) : 0}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="summary-line">
              This report was generated by FeraMap, a community-driven TNR tracking platform for Ciudad Lerdo.
            </div>
          </body>
        </html>
      `;

      const { uri: tempUri } = await Print.printToFileAsync({ html: htmlContent });

      // Create a friendly filename
      const cleanColonyName = colonyName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
      const friendlyName = `FeraMap_Progress_Report_${cleanColonyName}.pdf`;
      const targetUri = `${FileSystem.documentDirectory}${friendlyName}`;

      // Copy the PDF to the document directory with the friendly name
      await FileSystem.copyAsync({
        from: tempUri,
        to: targetUri,
      });

      await Sharing.shareAsync(targetUri, {
        mimeType: 'application/pdf',
        dialogTitle: `FeraMap Progress Report - ${colonyName}`,
        UTI: 'com.adobe.pdf',
      });
    } catch (err) {
      console.error('Error exporting PDF:', err);
      Alert.alert('Error', 'Failed to generate and share the PDF report.');
    } finally {
      setExporting(false);
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
      <TouchableOpacity 
        style={[styles.exportButton, exporting && { opacity: 0.6 }]}
        onPress={handleExportReport}
        disabled={exporting}
      >
        {exporting ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Text style={styles.exportIcon}>📄</Text>
            <Text style={styles.exportText}>Export progress report</Text>
          </>
        )}
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
