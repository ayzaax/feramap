import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function CameraScreen({ navigation, route }) {
  const { catId, catName, location } = route.params ?? {};

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled) {
      navigation.navigate('Details', { 
        photoUri: result.assets[0].uri,
        catId,
        catName,
        location,
      });
    }
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled) {
      navigation.navigate('Details', { 
        photoUri: result.assets[0].uri,
        catId,
        catName,
        location,
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Take a pic!</Text>
      <TouchableOpacity style={styles.button} onPress={takePhoto}>
        <Text style={styles.buttonText}>Open camera</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryButton} onPress={pickFromGallery}>
        <Text style={styles.secondaryButtonText}>Pick from gallery</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#9B30D9',
    borderRadius: 16,
    padding: 18,
    paddingHorizontal: 48,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: 12,
    padding: 18,
    paddingHorizontal: 48,
  },
  secondaryButtonText: {
    color: '#9B30D9',
    fontSize: 16,
    fontWeight: '600',
  },
});
