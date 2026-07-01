import { useState, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import TabNavigator from './src/navigation/TabNavigator';
import ReportNavigator from './src/navigation/ReportNavigator';
import LoginScreen from './src/screens/LoginScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import CatProfileScreen from './src/screens/CatProfileScreen';
import TrapQueueScreen from './src/screens/TrapQueueScreen';
import { supabase } from './src/lib/supabase';

const RootStack = createNativeStackNavigator();

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);

  const checkProfileCompletion = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', userId)
        .maybeSingle();

      if (data?.display_name) {
        setProfileComplete(true);
      } else {
        setProfileComplete(false);
      }
    } catch (err) {
      console.error('Error checking profile:', err);
      setProfileComplete(false);
    } finally {
      setCheckingProfile(false);
    }
  };

  useEffect(() => {
    // 1. Get initial session on startup
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session) {
        await checkProfileCompletion(session.user.id);
      } else {
        setCheckingProfile(false);
      }
      setLoading(false);
    });

    // 2. Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        setCheckingProfile(true);
        await checkProfileCompletion(session.user.id);
      } else {
        setProfileComplete(false);
        setCheckingProfile(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading || checkingProfile) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFF0F3', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#9B30D9" />
      </View>
    );
  }

  if (!session) {
    return (
      <SafeAreaProvider>
        <NavigationContainer>
          <LoginScreen onLogin={(sess) => {
            setSession(sess);
            if (sess) {
              setCheckingProfile(true);
              checkProfileCompletion(sess.user.id);
            }
          }} />
        </NavigationContainer>
      </SafeAreaProvider>
    );
  }

  if (!profileComplete) {
    return (
      <SafeAreaProvider>
        <OnboardingScreen onComplete={() => setProfileComplete(true)} />
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
