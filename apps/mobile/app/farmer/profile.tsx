import React from 'react';
import { View } from 'react-native';
import Button from '../../components/Button';
import { clearAuth } from '../../utils/storage';
import { useRouter } from 'expo-router';

export default function FarmerProfile() {
  const router = useRouter();
  const onLogout = async () => {
    await clearAuth();
    router.replace('/login');
  };
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Button title="Logout" variant="danger" onPress={onLogout} />
    </View>
  );
}
