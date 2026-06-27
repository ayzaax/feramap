import { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import TabNavigator from './src/navigation/TabNavigator';
import ReportNavigator from './src/navigation/ReportNavigator';
import LoginScreen from './src/screens/LoginScreen';
import CatProfileScreen from './src/screens/CatProfileScreen';

const RootStack = createNativeStackNavigator();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  if (!isLoggedIn) {
    return (
      <SafeAreaProvider>
        <NavigationContainer>
          <LoginScreen onLogin={() => setIsLoggedIn(true)} />
        </NavigationContainer>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          <RootStack.Screen name="Main" component={TabNavigator} />
          <RootStack.Screen
            name="Report"
            component={ReportNavigator}
            options={{ presentation: 'modal' }}
          />
          <RootStack.Screen name="CatProfile" component={CatProfileScreen} />
        </RootStack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
