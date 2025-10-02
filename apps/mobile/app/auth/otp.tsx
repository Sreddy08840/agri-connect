import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { verify2FA } from '../../services/auth';
import { setToken, setUserRole } from '../../utils/storage';
import Loader from '../../components/Loader';

export default function OTPVerifyScreen() {
  const router = useRouter();
  const { pendingSessionId } = useLocalSearchParams<{ pendingSessionId: string }>();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onVerify = async () => {
    if (!pendingSessionId) {
      setError('Missing session. Please login again.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await verify2FA({ pendingSessionId: String(pendingSessionId), code });
      await setToken(res.accessToken);
      const role = (res.user.role === 'FARMER' ? 'farmer' : 'customer') as 'farmer' | 'customer';
      await setUserRole(role);
      router.replace(role === 'farmer' ? '/farmer' : '/customer');
    } catch (e: any) {
      setError(e?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter OTP</Text>
      <TextInput
        placeholder="6-digit code"
        keyboardType="number-pad"
        maxLength={6}
        value={code}
        onChangeText={setCode}
        style={styles.input}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={onVerify} disabled={loading || code.length !== 6}>
        <Text style={styles.buttonText}>{loading ? 'Verifying...' : 'Verify'}</Text>
      </TouchableOpacity>
      <Loader visible={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 16, textAlign: 'center', color: '#1b5e20' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12 },
  button: { backgroundColor: '#2e7d32', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 4 },
  buttonText: { color: '#fff', fontWeight: '700' },
  error: { color: '#b91c1c', marginBottom: 8, textAlign: 'center' },
});
