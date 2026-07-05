import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import MapScreen from '../screens/MapScreen';
import CatsScreen from '../screens/CatsScreen';
import ColonyScreen from '../screens/ColonyScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#f0e0f0',
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#B85CE8',
        tabBarInactiveTintColor: '#ccc',
      }}
    >
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Cats"
        component={CatsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="paw" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Colony"
        component={ColonyScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}