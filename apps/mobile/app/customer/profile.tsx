import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import Button from '../../components/Button';
import { clearAuth } from '../../utils/storage';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function CustomerProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            await clearAuth();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const profileOptions = [
    { icon: 'person', title: 'Edit Profile', subtitle: 'Update your information', onPress: () => {} },
    { icon: 'location-on', title: 'Addresses', subtitle: 'Manage delivery addresses', onPress: () => {} },
    { icon: 'payment', title: 'Payment Methods', subtitle: 'Manage payment options', onPress: () => {} },
    { icon: 'notifications', title: 'Notifications', subtitle: 'Notification preferences', onPress: () => {} },
    { icon: 'help', title: 'Help & Support', subtitle: 'Get help', onPress: () => {} },
    { icon: 'info', title: 'About', subtitle: 'App version and info', onPress: () => {} },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <MaterialIcons name="person" size={60} color="#fff" />
        </View>
        <Text style={styles.name}>Customer Name</Text>
        <Text style={styles.email}>customer@email.com</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Settings</Text>
        {profileOptions.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={styles.option}
            onPress={option.onPress}
          >
            <View style={styles.optionIcon}>
              <MaterialIcons name={option.icon as any} size={24} color="#2e7d32" />
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>{option.title}</Text>
              <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.logoutContainer}>
        <Button 
          title={loading ? "Logging out..." : "Logout"} 
          variant="danger" 
          onPress={onLogout}
          disabled={loading}
        />
      </View>

      <Text style={styles.version}>Version 1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    backgroundColor: '#2e7d32',
    padding: 24,
    paddingTop: 40,
    paddingBottom: 32,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1b5e20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#e8f5e9',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingVertical: 8,
    letterSpacing: 0.5,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e8f5e9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    flex: 1,
    marginLeft: 12,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  logoutContainer: {
    padding: 16,
    marginTop: 16,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9ca3af',
    paddingVertical: 16,
  },
});
