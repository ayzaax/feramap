import { View, Text, StyleSheet } from 'react-native';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Profile Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF0F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 20,
    color: '#B85CE8',
    fontWeight: '600',
  },
});
