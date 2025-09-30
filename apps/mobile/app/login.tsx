import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { login } from '../services/auth';
import { setToken, setUserRole } from '../utils/storage';
import Loader from '../components/Loader';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await login({ email, password });
      await setToken(res.token);
      await setUserRole(res.role);
      if (res.role === 'farmer') router.replace('/farmer');
      else router.replace('/customer');
    } catch (e: any) {
      setError(e?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const goSignup = () => router.push('/signup');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AgriConnect</Text>
      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={onLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Signing in...' : 'Login'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={goSignup}>
        <Text style={styles.link}>Create an account</Text>
      </TouchableOpacity>
      <Loader visible={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 16, textAlign: 'center', color: '#1b5e20' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12 },
  button: { backgroundColor: '#2e7d32', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 4 },
  buttonText: { color: '#fff', fontWeight: '700' },
  link: { color: '#2e7d32', textAlign: 'center', marginTop: 12, fontWeight: '600' },
  error: { color: '#b91c1c', marginBottom: 8, textAlign: 'center' },
});
