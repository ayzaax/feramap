import { useState, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import TabNavigator from './src/navigation/TabNavigator';
import ReportNavigator from './src/navigation/ReportNavigator';
import LoginScreen from './src/screens/LoginScreen';
import CatProfileScreen from './src/screens/CatProfileScreen';
import TrapQueueScreen from './src/screens/TrapQueueScreen';
import { supabase } from './src/lib/supabase';

const RootStack = createNativeStackNavigator();

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Get initial session on startup
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFD9E2', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#9B30D9" />
      </View>
    );
  }

  if (!session) {
    return (
      <SafeAreaProvider>
        <NavigationContainer>
          <LoginScreen onLogin={() => {}} />
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
          <RootStack.Screen name="TrapQueue" component={TrapQueueScreen} />
        </RootStack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
