import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
} from 'react-native';
import { supabase } from '../lib/supabase';

export default function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const switchMode = (next) => {
    setMode(next);
    setError('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      onLogin(data?.session);
    }
  };

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      onLogin(data?.session);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Email Required', 'Please enter your email address first.');
      return;
    }
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (error) {
      setError(error.message);
      Alert.alert('Error', error.message);
      setLoading(false);
    } else {
      Alert.alert('Success', 'Password reset email sent! Check your inbox.');
      setLoading(false);
    }
  };

  const isLogin = mode === 'login';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* cat illustration */}
        <View style={styles.catContainer}>
          <Image
            source={require('../../assets/cat-logo.png')}
            style={styles.catImage}
          />
        </View>

        {/* title */}
        <Text style={styles.title}>
          {isLogin ? 'Welcome back!' : 'Create an account'}
        </Text>

        {/* email input */}
        <TextInput
          style={styles.input}
          placeholder="email@example.com"
          placeholderTextColor="#ccc"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {/* password input */}
        <TextInput
          style={styles.input}
          placeholder="password"
          placeholderTextColor="#ccc"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {/* confirm password — signup only */}
        {!isLogin && (
          <TextInput
            style={styles.input}
            placeholder="confirm password"
            placeholderTextColor="#ccc"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        )}

        {/* forgot password — login only */}
        {isLogin && (
          <TouchableOpacity onPress={handleForgotPassword} disabled={loading}>
            <Text style={styles.forgotText}>I forgot my password</Text>
          </TouchableOpacity>
        )}

        {/* mode toggle */}
        <View style={styles.toggleRow}>
          {isLogin ? (
            <>
              <Text style={styles.toggleText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => switchMode('signup')}>
                <Text style={styles.toggleLink}>Make one</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.toggleText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => switchMode('login')}>
                <Text style={styles.toggleLink}>Log in</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* error message */}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* submit button */}
        <TouchableOpacity
          style={[styles.loginButton, loading && styles.loginButtonDisabled]}
          onPress={isLogin ? handleLogin : handleSignup}
          disabled={loading}
        >
          <Text style={styles.loginButtonText}>
            {loading
              ? isLogin ? 'Logging in...' : 'Creating account...'
              : isLogin ? 'Login' : 'Create account'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFD9E2',
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  catContainer: {
    marginBottom: 24,
  },
  catImage: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 32,
  },
  input: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    marginBottom: 12,
    color: '#333',
  },
  forgotText: {
    color: '#888',
    fontSize: 13,
    marginBottom: 24,
    marginTop: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  toggleText: {
    color: '#888',
    fontSize: 13,
  },
  toggleLink: {
    color: '#9B30D9',
    fontSize: 13,
    fontWeight: '600',
  },
  errorText: {
    color: '#c0392b',
    fontSize: 13,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  loginButton: {
    width: '100%',
    backgroundColor: '#9B30D9',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 24,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
