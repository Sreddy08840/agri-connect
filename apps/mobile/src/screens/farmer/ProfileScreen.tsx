import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useAuthStore } from '../../stores/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const FarmerProfileScreen: React.FC = () => {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0) || '🌾'}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.business}>{user?.farmerProfile?.businessName}</Text>
      </View>
      <Card style={styles.card}>
        <Text style={styles.label}>Phone: {user?.phone}</Text>
        <Text style={styles.label}>Email: {user?.email || 'N/A'}</Text>
      </Card>
      <Button title="Logout" onPress={handleLogout} variant="danger" fullWidth style={styles.btn} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { backgroundColor: '#10B981', padding: 32, paddingTop: 48, alignItems: 'center' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  avatarText: { fontSize: 32, fontWeight: '700', color: '#10B981' },
  name: { fontSize: 24, fontWeight: '700', color: '#FFF', marginBottom: 4 },
  business: { fontSize: 14, color: '#FFF', opacity: 0.9 },
  card: { margin: 16 },
  label: { fontSize: 14, color: '#374151', marginBottom: 8 },
  btn: { margin: 16 },
});

export default FarmerProfileScreen;
