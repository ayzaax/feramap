import { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Animated, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';

const POLAROID_TRANSFORMS = [
  { rotate: '-6deg', top: 12, left: 8 },
  { rotate: '4deg',  top: 6,  left: 4 },
  { rotate: '-1deg', top: 0,  left: 0 },
];

const STATUS_COLORS = {
  spotted: '#EF9F27',
  trapped: '#E8725A',
  neutered: '#7F77DD',
  returned: '#1D9E75',
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatLastSeen(iso) {
  if (!iso) return '—';
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMins = Math.max(0, Math.floor(diffMs / 60000));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo ago`;

  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears}y ago`;
}

export default function CatProfileScreen({ navigation, route }) {
  const [cat, setCat] = useState(null);
  const [sightings, setSightings] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(null); // 'up' | 'down' | null
  const [isFollowing, setIsFollowing] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [contributors, setContributors] = useState(1);
  const [lastSeen, setLastSeen] = useState('—');

  const swipeAnim = useRef(new Animated.ValueXY()).current;

  const fetchProfile = async () => {
    let catId = route?.params?.catId;

    if (!catId) {
      const { data: first } = await supabase
        .rpc('get_cats_with_locations')
        .limit(1)
        .single();
      catId = first?.id;
    }

    if (!catId) {
      setLoading(false);
      return;
    }

    // Fetch the current user to check follows securely
    const { data: { user } } = await supabase.auth.getUser();

    const [
      { data: profileData, error: profileError },
      { data: sightingData },
      { data: photoData },
      { data: followData },
      { data: catSummaryData }
    ] = await Promise.all([
      supabase.rpc('get_cat_profile', { cat_id: catId }),
      supabase.rpc('get_cat_sightings', { cat_id: catId }),
      supabase.from('cat_photos').select('photo_url').eq('cat_id', catId).order('created_at', { ascending: false }),
      user 
        ? supabase.from('user_follows').select('*').eq('cat_id', catId).eq('user_id', user.id).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase.from('cats').select('summary, colonies(name)').eq('id', catId).maybeSingle()
    ]);

    console.log('catId from params:', route.params?.catId);
    console.log('profile data:', JSON.stringify(profileData, null, 2));
    console.log('profile error:', profileError);

    if (profileData?.[0]) {
      setCat({
        ...profileData[0],
        summary: catSummaryData?.summary || null,
        colony_name: catSummaryData?.colonies?.name || null
      });
    }
    if (sightingData) {
      setSightings(sightingData);
      // Calculate unique contributors
      const uniqueReporters = new Set(sightingData.map(s => s.reporter_id).filter(Boolean));
      setContributors(Math.max(1, uniqueReporters.size));

      // Calculate last seen dynamically from the latest sighting
      if (sightingData.length > 0) {
        const latest = sightingData.reduce((latest, current) => {
          return new Date(current.created_at) > new Date(latest.created_at) ? current : latest;
        });
        setLastSeen(formatLastSeen(latest.created_at));
      } else {
        setLastSeen('—');
      }
    }
    if (photoData?.length > 0) setPhotos(photoData.map(p => p.photo_url));
    if (followData) setIsFollowing(true);
    setLoading(false);
  };

  const handleGenerateSummary = async () => {
    if (!cat) return;
    setGeneratingSummary(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-cat-summary', {
        body: { catId: cat.id }
      });

      if (error) throw error;
      if (data?.summary) {
        setCat(prev => ({ ...prev, summary: data.summary }));
        Alert.alert('Success', 'AI summary generated and saved successfully!');
      } else {
        throw new Error('No summary returned');
      }
    } catch (err) {
      console.error('Error generating AI summary:', err);
      Alert.alert('Error', 'Failed to generate AI summary. Make sure your Edge Function is deployed and the GEMINI_API_KEY is configured.');
    } finally {
      setGeneratingSummary(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [route?.params?.catId])
  );

  const handlePressPhoto = () => {
    if (photos.length <= 1 || isAnimating) return;

    setIsAnimating(true);
    setAnimationPhase('up');

    // Phase 1: Slide the top card up and out
    Animated.timing(swipeAnim, {
      toValue: { x: 15, y: -230 },
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      // Phase 2: Set phase to 'down' and cycle the array so the top card goes to the bottom
      setAnimationPhase('down');
      setPhotos(prev => {
        const last = prev[prev.length - 1];
        const rest = prev.slice(0, prev.length - 1);
        return [last, ...rest];
      });

      // Slide the card (now at the bottom) back down into the stack
      Animated.timing(swipeAnim, {
        toValue: { x: 0, y: 0 },
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setAnimationPhase(null);
        setIsAnimating(false);
      });
    });
  };

  const handleToggleFollow = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please log in to follow cats.');
        return;
      }

      if (isFollowing) {
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('user_id', user.id)
          .eq('cat_id', cat.id);

        if (error) throw error;
        setIsFollowing(false);
      } else {
        const { error } = await supabase
          .from('user_follows')
          .insert({
            user_id: user.id,
            cat_id: cat.id,
          });

        if (error) throw error;
        setIsFollowing(true);
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#B85CE8" size="large" />
      </View>
    );
  }

  if (!cat) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: '#888' }}>Cat not found.</Text>
      </View>
    );
  }

  // Interpolate Y position to add dynamic rotation during the swipe
  const rotateSwipe = swipeAnim.y.interpolate({
    inputRange: [-230, 0],
    outputRange: ['-12deg', '0deg'],
    extrapolate: 'clamp',
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>

      {/* back button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>

      {/* polaroid stack */}
      <TouchableOpacity style={styles.photoStack} onPress={handlePressPhoto} activeOpacity={0.95}>
        {photos.length === 0 ? (
          <View style={[styles.polaroid, { top: 0, left: 0 }]}>
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoPlaceholderEmoji}>🐱</Text>
            </View>
          </View>
        ) : (
          photos.slice(0, 3).map((uri, i) => {
            const isTopCard = i === Math.min(photos.length, 3) - 1;
            const isBottomCard = i === 0;
            const transform = [
              { rotate: POLAROID_TRANSFORMS[i].rotate },
            ];

            // Apply translation and rotation based on the active animation phase
            if (animationPhase === 'up' && isTopCard) {
              transform.push(...swipeAnim.getTranslateTransform());
              transform.push({ rotate: rotateSwipe });
            } else if (animationPhase === 'down' && isBottomCard) {
              transform.push(...swipeAnim.getTranslateTransform());
              transform.push({ rotate: rotateSwipe });
            }

            return (
              <Animated.View
                key={uri}
                style={[
                  styles.polaroid,
                  {
                    transform,
                    top: POLAROID_TRANSFORMS[i].top,
                    left: POLAROID_TRANSFORMS[i].left,
                    zIndex: i,
                  },
                ]}
              >
                <Image source={{ uri }} style={styles.photo} />
              </Animated.View>
            );
          })
        )}
      </TouchableOpacity>

      {photos.length > 1 && (
        <Text style={styles.tapHint}>📸 Tap stack to cycle photos</Text>
      )}

      {/* name + location */}
      <Text style={styles.name}>{cat.name}</Text>
      <Text style={styles.location}>📍 {cat.zone_name || cat.colony_name || '—'} · since {formatDate(cat.created_at)}</Text>

      {/* stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{cat.sighting_count ?? 0}</Text>
          <Text style={styles.statLabel}>Sightings</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{contributors}</Text>
          <Text style={styles.statLabel}>Contributors</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{lastSeen}</Text>
          <Text style={styles.statLabel}>Last seen</Text>
        </View>
      </View>

      {/* community summary */}
      {!cat.summary ? (
        <TouchableOpacity 
          style={styles.summaryBox} 
          onPress={handleGenerateSummary}
          disabled={generatingSummary}
          activeOpacity={0.8}
        >
          <View style={styles.summaryHeaderRow}>
            <Text style={styles.summaryTitle}>✦  Community summary</Text>
            {generatingSummary && <ActivityIndicator size="small" color="#9B30D9" />}
          </View>
          <Text style={styles.summaryText}>
            {generatingSummary 
              ? 'Generating AI summary...' 
              : 'No summary yet. Tap here to generate one!'}
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.summaryBox}>
          <View style={styles.summaryHeaderRow}>
            <Text style={styles.summaryTitle}>✦  Community summary</Text>
            {generatingSummary ? (
              <ActivityIndicator size="small" color="#9B30D9" />
            ) : (
              <TouchableOpacity onPress={handleGenerateSummary} style={styles.refreshButton}>
                <Text style={styles.refreshIcon}>↻</Text>
              </TouchableOpacity>
            )}
          </View>
          {generatingSummary ? (
            <Text style={styles.summaryTextGenerating}>Generating AI summary...</Text>
          ) : (
            <Text style={styles.summaryText}>{cat.summary}</Text>
          )}
        </View>
      )}

      {/* sighting history */}
      <Text style={styles.historyLabel}>Sighting history</Text>
      <View style={styles.timeline}>
        {sightings.length === 0 ? (
          <Text style={styles.empty}>No sightings recorded yet.</Text>
        ) : (
          sightings.map((s, i) => (
            <View key={s.id ?? i} style={styles.timelineRow}>
              <View style={styles.timelineLeft}>
                <View style={[styles.dot, { backgroundColor: STATUS_COLORS[s.condition] ?? '#9B30D9' }]} />
                {i < sightings.length - 1 && <View style={styles.line} />}
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.sightingTitle}>{s.condition ?? 'Sighting'}</Text>
                {s.notes ? <Text style={styles.sightingQuote}>"{s.notes}"</Text> : null}
                <Text style={styles.sightingMeta}>{formatDate(s.created_at)}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* bottom buttons */}
      <View style={styles.buttonsRow}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Report', {
            screen: 'Location',
            params: { catId: cat.id, catName: cat.name }
          })}
        >
          <Text style={styles.actionButtonText}>Log{'\n'}Sighting</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Main', {
            screen: 'Map',
            params: {
              centerOnCat: {
                id: cat.id,
                latitude: cat.latitude,
                longitude: cat.longitude,
              }
            }
          })}
        >
          <Text style={styles.actionButtonText}>See on{'\n'}map</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, isFollowing && styles.followingButton]}
          onPress={handleToggleFollow}
        >
          <Text style={[styles.actionButtonText, isFollowing && styles.followingButtonText]}>
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  photoStack: {
    width: 180,
    height: 210,
    marginBottom: 24,
  },
  polaroid: {
    position: 'absolute',
    width: 160,
    height: 180,
    backgroundColor: '#FFD9E2',
    borderWidth: 4,
    borderColor: '#FFD9E2',
    padding: 6,
    paddingBottom: 24,
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD9E2',
  },
  photoPlaceholderEmoji: {
    fontSize: 48,
  },
  name: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  location: {
    fontSize: 14,
    color: '#888',
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
    paddingVertical: 16,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#eee',
  },
  summaryBox: {
    alignSelf: 'stretch',
    backgroundColor: '#EDD9F5',
    borderRadius: 16,
    padding: 16,
    marginBottom: 28,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 21,
  },
  historyLabel: {
    alignSelf: 'stretch',
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  timeline: {
    alignSelf: 'stretch',
    marginBottom: 32,
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  timelineLeft: {
    width: 24,
    alignItems: 'center',
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 3,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: '#eee',
    marginTop: 4,
    marginBottom: -4,
  },
  timelineContent: {
    flex: 1,
    paddingLeft: 10,
    paddingBottom: 20,
  },
  sightingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  sightingQuote: {
    fontSize: 13,
    color: '#555',
    fontStyle: 'italic',
    marginTop: 2,
  },
  sightingMeta: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  buttonsRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#9B30D9',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
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
  empty: {
    color: '#aaa',
    fontSize: 14,
  },
  tapHint: {
    fontSize: 12,
    color: '#B85CE8',
    marginTop: -8,
    marginBottom: 16,
    fontWeight: '600',
  },
  followingButton: {
    backgroundColor: '#FFD9E2',
    borderWidth: 1,
    borderColor: '#9B30D9',
  },
  followingButtonText: {
    color: '#9B30D9',
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  refreshButton: {
    padding: 4,
  },
  refreshIcon: {
    fontSize: 16,
  },
  summaryTextGenerating: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
    lineHeight: 21,
  },
  summaryTextPlaceholder: {
    fontSize: 14,
    color: '#9B30D9',
    fontStyle: 'italic',
    lineHeight: 21,
    textAlign: 'center',
    paddingVertical: 12,
  },
});
