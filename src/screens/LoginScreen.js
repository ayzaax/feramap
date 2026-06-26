import { useState } from 'react' ;
import {
     View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native' ;

export default function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    onLogin(); // this switches to the tab bar
  };

    return (
        <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scroll}>
              {/* cat illustration */}
              <View style={styles.catContainer}>
                <Image source={require('../../assets/cat-logo.png')}
                style={styles.catImage}
                />
              </View>

              {/* welcome text */}
              <Text style={styles.title}>Welcome back!</Text>

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

              {/* forgot password */}
                <TouchableOpacity>
                <Text style={styles.forgotText}>I forgot my password</Text>
                </TouchableOpacity>

                {/* sign up link */}
        <View style={styles.signupRow}>
          <Text style={styles.signupText}>Don't have an account? </Text>
          <TouchableOpacity>
            <Text style={styles.signupLink}>Make one</Text>
          </TouchableOpacity>
        </View>

              {/* login button */}
              <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                <Text style={styles.loginButtonText}>Login</Text>
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
  loginButton: {
    width: '100%',
    backgroundColor: '#9B30D9',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 24,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signupRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signupText: {
    color: '#888',
    fontSize: 13,
  },
  signupLink: {
    color: '#9B30D9',
    fontSize: 13,
    fontWeight: '600',
  },
});