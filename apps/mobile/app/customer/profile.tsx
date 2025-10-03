import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Button from '../../components/Button';
import { clearAuth } from '../../utils/storage';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { getCurrentUser, updateProfile } from '../../services/user';

export default function CustomerProfile() {
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

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      Alert.alert('Success', 'Profile updated successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.message || 'Failed to update profile');
    }
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

  const goToShopping = () => {
    router.push('/customer');
  };

  const viewCart = () => {
    router.push('/customer/cart');
  };

  const goToCheckout = () => {
    Alert.alert(
      'Checkout',
      'Ready to checkout?\n\nThis will take you to your cart where you can review items and proceed with payment.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Go to Cart', onPress: () => router.push('/customer/cart') }
      ]
    );
  };

  const showAddresses = () => {
    Alert.alert(
      'Delivery Addresses',
      user?.address ? `Current Address:\n${user.address}` : 'No address set yet',
      [
        { text: 'OK', style: 'default' },
        { text: 'Add Address', onPress: () => Alert.alert('Add Address', 'Address management coming soon') }
      ]
    );
  };

  const showPaymentMethods = () => {
    Alert.alert(
      'Payment Methods',
      'Manage your payment options:\n\n💳 Credit/Debit Cards\n📱 UPI Payments\n💰 Cash on Delivery\n\nSecure payments powered by Razorpay'
    );
  };

  const showOrderHistory = () => {
    Alert.alert(
      'Order History',
      'Your recent orders will appear here.\n\nCurrently no orders found.\n\nStart shopping to see your order history!'
    );
  };

  const showNotifications = () => {
    Alert.alert(
      'Notification Settings',
      'Manage your notifications:\n\n🔔 Order Updates: ON\n📦 Delivery Alerts: ON\n🎯 Promotions: OFF\n📧 Email Updates: ON',
      [
        { text: 'OK', style: 'default' },
        { text: 'Change Settings', onPress: () => Alert.alert('Settings', 'Notification settings coming soon') }
      ]
    );
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

  const shoppingOptions = [
    { 
      icon: 'storefront', 
      title: 'Browse Products', 
      subtitle: 'Shop fresh produce', 
      onPress: goToShopping
    },
    { 
      icon: 'shopping-cart', 
      title: 'My Cart', 
      subtitle: 'View items in cart', 
      onPress: viewCart
    },
    { 
      icon: 'receipt', 
      title: 'Order History', 
      subtitle: 'View past orders', 
      onPress: showOrderHistory
    },
  ];

  const preferencesOptions = [
    { 
      icon: 'star', 
      title: 'Reviews & Ratings', 
      subtitle: 'Your reviews and ratings', 
      onPress: () => Alert.alert('Coming Soon', 'Reviews will be available soon')
    },
    { 
      icon: 'notifications', 
      title: 'Notifications', 
      subtitle: 'Notification preferences', 
      onPress: showNotifications
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
      title: 'Help & Support',
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
        <Text style={styles.errorSubtext}>{error?.message || 'Please check your connection'}</Text>
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
        <Text style={styles.name}>{user?.name || 'Customer'}</Text>
        <Text style={styles.phone}>{user?.phone || ''}</Text>
        {user?.email && <Text style={styles.email}>{user.email}</Text>}
        
        <View style={styles.verificationBadge}>
          <MaterialIcons 
            name={user?.verified ? 'verified' : 'pending'} 
            size={16} 
            color={user?.verified ? '#16a34a' : '#f59e0b'} 
          />
          <Text style={[styles.verificationText, { color: user?.verified ? '#16a34a' : '#f59e0b' }]}>
            {user?.verified ? 'Verified Customer' : 'Pending Verification'}
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
          <View style={styles.infoRow}>
            <MaterialIcons name="location-on" size={20} color="#6b7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Delivery Address</Text>
              <Text style={styles.infoValue} numberOfLines={2}>
                {user?.address ? String(user.address) : 'Not set'}
              </Text>
            </View>
            <TouchableOpacity onPress={showAddresses}>
              <MaterialIcons name="edit" size={20} color="#2e7d32" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Payment Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialIcons name="credit-card" size={20} color="#6b7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Payment Methods</Text>
              <Text style={styles.infoValue}>Credit/Debit Cards, UPI, COD</Text>
            </View>
            <TouchableOpacity onPress={showPaymentMethods}>
              <MaterialIcons name="chevron-right" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Shopping & Orders */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shopping & Orders</Text>
        {shoppingOptions.map((option, index) => (
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

      {/* Preferences & Reviews */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences & Reviews</Text>
        {preferencesOptions.map((option, index) => (
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
