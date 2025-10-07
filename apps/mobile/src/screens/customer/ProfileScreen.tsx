import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CustomerStackParamList, CustomerTabParamList } from '../../navigation/types';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../lib/api';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import ProfilePhotoUpload from '../../components/ProfilePhotoUpload';

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<CustomerTabParamList, 'Profile'>,
  NativeStackNavigationProp<CustomerStackParamList>
>;

type Props = {
  navigation: NavigationProp;
};

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { user, logout, setUser } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      const updateData: any = {
        name: formData.name,
      };
      
      // Only include email if it's not empty
      if (formData.email && formData.email.trim()) {
        updateData.email = formData.email.trim();
      }
      
      const response = await api.patch('/users/me', updateData);
      
      if (response.data.user) {
        setUser({ ...user!, ...response.data.user });
      }
      
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      console.error('Update profile error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => await logout() },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <ProfilePhotoUpload 
          currentAvatarUrl={user?.avatarUrl}
          size="large"
        />
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.role}>Customer</Text>
      </View>

      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          {!editing && (
            <TouchableOpacity onPress={() => setEditing(true)}>
              <Text style={styles.editButton}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {editing ? (
          <>
            <Input label="Name" value={formData.name} onChangeText={(text) => setFormData({ ...formData, name: text })} />
            <Input label="Email" value={formData.email} onChangeText={(text) => setFormData({ ...formData, email: text })} keyboardType="email-address" />
            <Input label="Phone" value={formData.phone} onChangeText={(text) => setFormData({ ...formData, phone: text })} keyboardType="phone-pad" editable={false} />
            <View style={styles.actions}>
              <Button title="Cancel" onPress={() => setEditing(false)} variant="outline" style={styles.actionButton} />
              <Button title="Save" onPress={handleSave} loading={loading} style={styles.actionButton} />
            </View>
          </>
        ) : (
          <>
            <InfoRow label="Name" value={user?.name} />
            <InfoRow label="Email" value={user?.email || 'Not provided'} />
            <InfoRow label="Phone" value={user?.phone} />
          </>
        )}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Help & Support</Text>
        <MenuItem title="Help Center" onPress={() => navigation.navigate('HelpCenter')} />
        <MenuItem title="FAQ" onPress={() => navigation.navigate('FAQ')} />
        <MenuItem title="Contact Support" onPress={() => navigation.navigate('ContactSupport')} />
        <MenuItem title="Privacy Policy" onPress={() => navigation.navigate('PrivacyPolicy')} />
        <MenuItem title="Terms & Conditions" onPress={() => navigation.navigate('TermsConditions')} />
      </Card>

      <Button title="Logout" onPress={handleLogout} variant="danger" fullWidth style={styles.logoutButton} />
    </ScrollView>
  );
};

const InfoRow = ({ label, value }: { label: string; value?: string }) => (
  <View style={styles.infoRow}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const MenuItem = ({ title, onPress }: { title: string; onPress: () => void }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <Text style={styles.menuText}>{title}</Text>
    <Text style={styles.menuArrow}>→</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { backgroundColor: '#10B981', padding: 32, paddingTop: 48, alignItems: 'center' },
  name: { fontSize: 24, fontWeight: '700', color: '#FFFFFF', marginBottom: 4, marginTop: 16 },
  role: { fontSize: 14, color: '#FFFFFF', opacity: 0.9 },
  card: { margin: 16, marginBottom: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  editButton: { fontSize: 14, color: '#10B981', fontWeight: '600' },
  infoRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  label: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  value: { fontSize: 16, color: '#111827', fontWeight: '500' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  actionButton: { flex: 1 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  menuText: { fontSize: 16, color: '#111827' },
  menuArrow: { fontSize: 18, color: '#6B7280' },
  logoutButton: { margin: 16, marginTop: 8, marginBottom: 32 },
});

export default ProfileScreen;
