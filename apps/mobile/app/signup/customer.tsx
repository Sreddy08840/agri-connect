import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { signupCustomer } from '../../services/auth';
import { useRouter } from 'expo-router';

export default function CustomerSignup() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setLoading(true);
    try {
      const res = await signupCustomer({ name, phone, password });
      router.push({ pathname: '/auth/otp', params: { pendingSessionId: res.pendingSessionId } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Input label="Name" value={name} onChangeText={setName} />
      <Input label="Phone (e.g., +14155551234)" value={phone} onChangeText={setPhone} autoCapitalize="none" />
      <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <Button title={loading ? 'Sending OTP...' : 'Create account'} onPress={onSubmit} disabled={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
});
