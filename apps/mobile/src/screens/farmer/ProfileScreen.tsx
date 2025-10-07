import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FarmerStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../lib/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ProfilePhotoUpload from '../../components/ProfilePhotoUpload';

const FarmerProfileScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<FarmerStackParamList>>();
  const { user, logout, setUser } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    address: user?.address || '',
    businessName: user?.farmerProfile?.businessName || '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        address: user.address || '',
        businessName: user.farmerProfile?.businessName || '',
      });
    }
  }, [user]);

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData: any = {
        name: formData.name,
      };
      
      // Only include email if it's not empty
      if (formData.email && formData.email.trim()) {
        updateData.email = formData.email.trim();
      }
      
      // Only include address if it's not empty
      if (formData.address && formData.address.trim()) {
        updateData.address = formData.address.trim();
      }
      
      // Only include farmerProfile if businessName is not empty
      if (formData.businessName && formData.businessName.trim()) {
        updateData.farmerProfile = {
          businessName: formData.businessName.trim(),
        };
      }
      
      const response = await api.patch('/users/me', updateData);

      if (response.data.user) {
        setUser({ ...user!, ...response.data.user, farmerProfile: response.data.farmerProfile || user?.farmerProfile });
      }

      Alert.alert('Success', 'Profile updated successfully!');
      setEditing(false);
    } catch (error: any) {
      console.error('Update profile error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      address: user?.address || '',
      businessName: user?.farmerProfile?.businessName || '',
    });
    setEditing(false);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <ProfilePhotoUpload 
          currentAvatarUrl={user?.avatarUrl}
          size="large"
        />
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.business}>{user?.farmerProfile?.businessName || 'Farmer'}</Text>
        {user?.verified && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>✓ Verified</Text>
          </View>
        )}
      </View>

      {/* Personal Information */}
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          {!editing && (
            <TouchableOpacity onPress={() => setEditing(true)}>
              <Text style={styles.editButton}>✏️ Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {editing ? (
          <>
            <Input
              label="Name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Enter your name"
            />
            <Input
              label="Email"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input
              label="Address"
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              placeholder="Enter your address"
              multiline
              numberOfLines={3}
            />
            <View style={styles.editActions}>
              <Button
                title="Cancel"
                onPress={handleCancel}
                variant="outline"
                style={styles.editActionButton}
              />
              <Button
                title="Save"
                onPress={handleSave}
                loading={saving}
                style={styles.editActionButton}
              />
            </View>
          </>
        ) : (
          <>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{user?.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone</Text>
              <TouchableOpacity onPress={() => user?.phone && handleCall(user.phone)}>
                <Text style={[styles.infoValue, styles.linkText]}>📞 {user?.phone}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              {user?.email ? (
                <TouchableOpacity onPress={() => handleEmail(user.email!)}>
                  <Text style={[styles.infoValue, styles.linkText]}>✉️ {user.email}</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.infoValue}>Not provided</Text>
              )}
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>{user?.address || 'Not provided'}</Text>
            </View>
          </>
        )}
      </Card>

      {/* Farm Details */}
      {user?.farmerProfile && (
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Farm Details</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Business Name</Text>
            <Text style={styles.infoValue}>{user.farmerProfile.businessName || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Rating</Text>
            <Text style={styles.infoValue}>⭐ {user.farmerProfile.ratingAvg?.toFixed(1) || 'N/A'}</Text>
          </View>
        </Card>
      )}

      {/* Help & Support */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Help & Support</Text>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('HelpCenter')}>
          <Text style={styles.menuText}>📖 Help Center</Text>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('FAQ')}>
          <Text style={styles.menuText}>❓ FAQ</Text>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('ContactSupport')}>
          <Text style={styles.menuText}>📞 Contact Support</Text>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => Linking.openURL('https://agri-connect.com/privacy')}>
          <Text style={styles.menuText}>🔒 Privacy Policy</Text>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => Linking.openURL('https://agri-connect.com/terms')}>
          <Text style={styles.menuText}>📋 Terms & Conditions</Text>
          <Text style={styles.menuArrow}>→</Text>
        </TouchableOpacity>
      </Card>

      <Button title="Logout" onPress={handleLogout} variant="danger" fullWidth style={styles.btn} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { backgroundColor: '#10B981', padding: 32, paddingTop: 48, alignItems: 'center' },
  name: { fontSize: 24, fontWeight: '700', color: '#FFF', marginBottom: 4, marginTop: 16 },
  business: { fontSize: 14, color: '#FFF', opacity: 0.9, marginBottom: 8 },
  verifiedBadge: { 
    backgroundColor: 'rgba(255, 255, 255, 0.2)', 
    paddingHorizontal: 12, 
    paddingVertical: 4, 
    borderRadius: 12, 
    marginTop: 8 
  },
  verifiedText: { fontSize: 12, fontWeight: '600', color: '#FFF' },
  card: { margin: 16, marginBottom: 12 },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 16 
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  editButton: { fontSize: 14, color: '#10B981', fontWeight: '600' },
  infoRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#E5E7EB' 
  },
  infoLabel: { fontSize: 14, color: '#6B7280', fontWeight: '500', flex: 1 },
  infoValue: { fontSize: 14, color: '#111827', fontWeight: '600', flex: 2, textAlign: 'right' },
  linkText: { color: '#10B981' },
  editActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  editActionButton: { flex: 1 },
  menuItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#E5E7EB' 
  },
  menuText: { fontSize: 16, color: '#111827' },
  menuArrow: { fontSize: 18, color: '#6B7280' },
  label: { fontSize: 14, color: '#374151', marginBottom: 8 },
  btn: { margin: 16, marginTop: 8 },
});

export default FarmerProfileScreen;
