import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function IdentifyScreen({ navigation, route }) {
  const { location } = route.params ?? {};
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState('new');

  useEffect(() => {
    const fetchNearbyCats = async () => {
      try {
        const { data, error } = await supabase
          .from('cats')
          .select(`
            id,
            name,
            status,
            cat_photos (
              photo_url
            )
          `)
          .limit(2);

        if (error) throw error;
        setCats(data || []);
      } catch (err) {
        console.error('Error fetching nearby cats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNearbyCats();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#B85CE8" />
      </View>
    );
  }

  const listData = [
    ...cats.map(c => ({
      id: c.id,
      name: c.name || 'Unknown cat',
      detail: `Spotted nearby · ${c.status}`,
      photo_url: c.cat_photos?.[0]?.photo_url || null,
    })),
    { id: 'new', name: 'This is a new cat!', detail: 'Never been spotted', photo_url: null },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Seen this cat before?</Text>
      <Text style={styles.subtitle}>{cats.length} cat{cats.length !== 1 ? 's' : ''} known nearby.{'\n'}Is this one of them?</Text>

      {listData.map((cat) => (
        <TouchableOpacity
          key={cat.id}
          style={styles.row}
          onPress={() => setSelected(cat.id)}
        >
          {cat.id !== 'new' && (
            <View style={styles.catAvatar}>
              {cat.photo_url ? (
                <Image source={{ uri: cat.photo_url }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.catEmoji}>🐱</Text>
              )}
            </View>
          )}
          <View style={styles.catInfo}>
            <Text style={styles.catName}>{cat.name}</Text>
            <Text style={styles.catDetail}>{cat.detail}</Text>
          </View>
          <View style={styles.radio}>
            {selected === cat.id && <View style={styles.radioFilled} />}
          </View>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          if (selected === 'new') {
            navigation.navigate('Camera', { location });
          } else {
            const matchedCat = cats.find(c => c.id === selected);
            navigation.navigate('Camera', { catId: selected, catName: matchedCat?.name, location });
          }
        }}
      >
        <Text style={styles.buttonText}>Continue  →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    marginTop: 50,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    lineHeight: 22,
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD9E2',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  catAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  catEmoji: {
    fontSize: 24,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
    resizeMode: 'cover',
  },
  catInfo: {
    flex: 1,
  },
  catName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  catDetail: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  radio: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#9B30D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioFilled: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#9B30D9',
  },
  button: {
    backgroundColor: '#9B30D9',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
});
