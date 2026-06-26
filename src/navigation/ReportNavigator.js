import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text } from 'react-native';
import LocationScreen from '../screens/report/LocationScreen';
import IdentifyScreen from '../screens/report/IdentifyScreen';
import CameraScreen from '../screens/report/CameraScreen';
import DetailsScreen from '../screens/report/DetailsScreen';
function SuccessScreen() {
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text>Success</Text></View>;
}

const Stack = createNativeStackNavigator();

export default function ReportNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Location" component={LocationScreen} />
      <Stack.Screen name="Identify" component={IdentifyScreen} />
      <Stack.Screen name="Camera" component={CameraScreen} />
      <Stack.Screen name="Details" component={DetailsScreen} />
      <Stack.Screen name="Success" component={SuccessScreen} />
    </Stack.Navigator>
  );
}
