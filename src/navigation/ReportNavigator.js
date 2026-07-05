import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LocationScreen from '../screens/report/LocationScreen';
import IdentifyScreen from '../screens/report/IdentifyScreen';
import CameraScreen from '../screens/report/CameraScreen';
import DetailsScreen from '../screens/report/DetailsScreen';
import SuccessScreen from '../screens/report/SuccessScreen';

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
