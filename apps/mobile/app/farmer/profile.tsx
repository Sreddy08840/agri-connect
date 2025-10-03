import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Button from '../../components/Button';
import { clearAuth } from '../../utils/storage';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { getCurrentUser, updateProfile } from '../../services/user';

export default function FarmerProfile() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: ['current-user'],
    queryFn: getCurrentUser,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

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
            // Navigate first to prevent API calls
            router.replace('/');
            // Small delay to ensure navigation completes
            setTimeout(async () => {
              await clearAuth();
              queryClient.clear(); // Clear all cached queries
              setLoading(false);
            }, 100);
          },
        },
      ]
    );
  };

  const editName = () => {
    Alert.prompt(
      'Edit Name',
      'Enter your new name:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async (newName) => {
            if (newName && newName.trim()) {
              try {
                await updateProfile({ name: newName.trim() });
                queryClient.invalidateQueries({ queryKey: ['current-user'] });
                Alert.alert('Success', 'Name updated successfully!');
              } catch (error: any) {
                Alert.alert('Error', error?.message || 'Failed to update name');
              }
            }
          }
        }
      ],
      'plain-text',
      user?.name || ''
    );
  };

  const editEmail = () => {
    Alert.prompt(
      'Edit Email',
      'Enter your new email address:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async (newEmail) => {
            if (newEmail && newEmail.trim()) {
              // Basic email validation
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(newEmail.trim())) {
                Alert.alert('Error', 'Please enter a valid email address');
                return;
              }
              try {
                await updateProfile({ email: newEmail.trim() });
                queryClient.invalidateQueries({ queryKey: ['current-user'] });
                Alert.alert('Success', 'Email updated successfully!');
              } catch (error: any) {
                Alert.alert('Error', error?.message || 'Failed to update email');
              }
            }
          }
        }
      ],
      'plain-text',
      user?.email || ''
    );
  };

  const addProduct = () => {
    router.push('/farmer/product-add');
  };

  const viewProducts = () => {
    router.push('/farmer/products');
  };

  const viewOrders = () => {
    Alert.alert('Orders', 'Order management coming soon!\n\nYou will be able to:\n• View incoming orders\n• Accept/reject orders\n• Track order status\n• Manage deliveries');
  };

  const viewEarnings = () => {
    Alert.alert('Earnings', 'Earnings dashboard coming soon!\n\nYou will see:\n• Total earnings\n• Monthly reports\n• Payment history\n• Tax information');
  };

  const showBusinessDetails = () => {
    const businessInfo = user?.farmerProfile;
    const details = [
      `Business Name: ${businessInfo?.businessName || 'Not set'}`,
      `Description: ${businessInfo?.description || 'Not set'}`,
      `Address: ${businessInfo?.address || 'Not set'}`,
      `Rating: ${businessInfo?.ratingAvg ? businessInfo.ratingAvg.toFixed(1) : 'No ratings yet'}`
    ].join('\n\n');
    
    Alert.alert('Business Details', details);
  };

  const showHelp = () => {
    Alert.alert(
      'Help & Support',
      'Need help? Contact us:\n\n📧 Email: support@agriconnect.com\n📞 Phone: +91-1234567890\n\n🌐 Visit our website for more information',
      [
        { text: 'OK', style: 'default' },
        { text: 'Call Support', onPress: () => Alert.alert('Calling', 'This would open the phone dialer') }
      ]
    );
  };

  const businessOptions = [
    { 
      icon: 'add-circle', 
      title: 'Add Product', 
      subtitle: 'Add new products to sell', 
      onPress: addProduct
    },
    { 
      icon: 'inventory', 
      title: 'My Products', 
      subtitle: 'View and manage products', 
      onPress: viewProducts
    },
    { 
      icon: 'receipt', 
      title: 'Orders & Deliveries', 
      subtitle: 'Manage incoming orders', 
      onPress: viewOrders
    },
    { 
      icon: 'dashboard', 
      title: 'Inventory Dashboard', 
      subtitle: 'Track stock levels', 
      onPress: () => Alert.alert('Coming Soon', 'Inventory dashboard will be available soon')
    },
  ];

  const financialOptions = [
    { 
      icon: 'account-balance-wallet', 
      title: 'Payments & Earnings', 
      subtitle: 'View earnings and reports', 
      onPress: viewEarnings
    },
    { 
      icon: 'analytics', 
      title: 'Analytics & Insights', 
      subtitle: 'Business performance', 
      onPress: () => Alert.alert('Coming Soon', 'Analytics will be available soon')
    },
  ];

  const showSettings = () => {
    Alert.alert(
      'App Settings',
      'Choose a setting to configure:',
      [
        { text: 'Notifications', onPress: () => Alert.alert('Notifications', 'Notification settings coming soon') },
        { text: 'Language', onPress: () => Alert.alert('Language', 'Language settings coming soon') },
        { text: 'Theme', onPress: () => Alert.alert('Theme', 'Theme settings coming soon') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const showSecuritySettings = () => {
    Alert.alert(
      'Security Settings',
      'Manage your account security:',
      [
        { text: 'Change Password', onPress: () => Alert.alert('Change Password', 'Password change feature coming soon') },
        { text: 'Two-Factor Auth', onPress: () => Alert.alert('2FA', 'Two-factor authentication coming soon') },
        { text: 'Login History', onPress: () => Alert.alert('Login History', 'Login history coming soon') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const supportOptions = [
    {
      icon: 'settings',
      title: 'Settings',
      subtitle: 'App preferences',
      onPress: showSettings
    },
    {
      icon: 'help',
      title: 'Support & Help',
      subtitle: 'Get help and contact us',
      onPress: showHelp
    },
    {
      icon: 'security',
      title: 'Security',
      subtitle: 'Password and security',
      onPress: showSecuritySettings
    },
  ];

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (error) {
    const isAuthError = error?.message?.includes('401') || error?.message?.includes('Unauthorized');
    
    if (isAuthError) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Authentication Required</Text>
          <Text style={styles.errorSubtext}>Please login again to continue</Text>
          <Button 
            title="Go to Login" 
            onPress={async () => {
              await clearAuth();
              router.replace('/login');
            }} 
          />
        </View>
      );
    }
    
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to load profile</Text>
        <Text style={styles.errorSubtext}>Please check your connection</Text>
        <Button title="Retry" onPress={() => refetch()} />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <MaterialIcons name="person" size={60} color="#fff" />
        </View>
        <Text style={styles.name}>{user?.name ? String(user.name) : 'Farmer'}</Text>
        <Text style={styles.phone}>{user?.phone ? String(user.phone) : 'No phone'}</Text>
        {user?.email ? <Text style={styles.email}>{String(user.email)}</Text> : null}
        
        <View style={styles.verificationBadge}>
          <MaterialIcons 
            name={user?.verified ? 'verified' : 'pending'} 
            size={16} 
            color={user?.verified ? '#16a34a' : '#f59e0b'} 
          />
          <Text style={[styles.verificationText, { color: user?.verified ? '#16a34a' : '#f59e0b' }]}>
            {user?.verified ? 'Verified Farmer' : 'Pending Verification'}
          </Text>
        </View>
      </View>

      {/* Personal Information Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialIcons name="person" size={20} color="#6b7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Full Name</Text>
              <Text style={styles.infoValue}>{user?.name ? String(user.name) : 'Not set'}</Text>
            </View>
            <TouchableOpacity onPress={editName}>
              <MaterialIcons name="edit" size={20} color="#2e7d32" />
            </TouchableOpacity>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="phone" size={20} color="#6b7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Phone Number</Text>
              <Text style={styles.infoValue}>{user?.phone ? String(user.phone) : 'Not set'}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="email" size={20} color="#6b7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email Address</Text>
              <Text style={styles.infoValue}>{user?.email ? String(user.email) : 'Not set'}</Text>
            </View>
            <TouchableOpacity onPress={editEmail}>
              <MaterialIcons name="edit" size={20} color="#2e7d32" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Farm Details Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Farm Details</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialIcons name="business" size={20} color="#6b7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Business Name</Text>
              <Text style={styles.infoValue}>
                {user?.farmerProfile?.businessName ? String(user.farmerProfile.businessName) : 'Not set'}
              </Text>
            </View>
            <TouchableOpacity onPress={showBusinessDetails}>
              <MaterialIcons name="edit" size={20} color="#2e7d32" />
            </TouchableOpacity>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="description" size={20} color="#6b7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Farm Description</Text>
              <Text style={styles.infoValue} numberOfLines={2}>
                {user?.farmerProfile?.description ? String(user.farmerProfile.description) : 'Not set'}
              </Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="location-on" size={20} color="#6b7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Farm Address</Text>
              <Text style={styles.infoValue} numberOfLines={2}>
                {user?.farmerProfile?.address ? String(user.farmerProfile.address) : 'Not set'}
              </Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="star" size={20} color="#6b7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Rating</Text>
              <Text style={styles.infoValue}>
                {user?.farmerProfile?.ratingAvg 
                  ? `${user.farmerProfile.ratingAvg.toFixed(1)} ⭐` 
                  : 'No ratings yet'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Business Operations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Business Operations</Text>
        {businessOptions.map((option, index) => (
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

      {/* Financial */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Financial</Text>
        {financialOptions.map((option, index) => (
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

      {/* Support & Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support & Settings</Text>
        {supportOptions.map((option, index) => (
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
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { fontSize: 16, color: '#6b7280' },
  loadingSubtext: { fontSize: 14, color: '#9ca3af', marginTop: 8, textAlign: 'center' },
  errorText: { fontSize: 18, fontWeight: '600', color: '#dc2626', marginBottom: 8 },
  errorSubtext: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 16 },
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
  phone: {
    fontSize: 16,
    color: '#e8f5e9',
    marginBottom: 2,
  },
  email: {
    fontSize: 14,
    color: '#e8f5e9',
    marginBottom: 8,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  verificationText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  businessCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  businessTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  businessName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  businessDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 8,
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
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
});
