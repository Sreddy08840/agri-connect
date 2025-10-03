import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { getCatalog } from '../../services/customer';

export default function FarmerDashboard() {
  const router = useRouter();

  // Get farmer's products
  const { data: products } = useQuery({
    queryKey: ['farmer-products'],
    queryFn: getCatalog,
  });

  const productCount = products?.length || 0;

  const quickActions = [
    {
      icon: 'add-circle',
      title: 'Add Product',
      subtitle: 'List new products',
      onPress: () => router.push('/farmer/product-add'),
      color: '#2e7d32',
    },
    {
      icon: 'inventory',
      title: 'My Products',
      subtitle: `${productCount} products`,
      onPress: () => router.push('/farmer/products'),
      color: '#1976d2',
    },
    {
      icon: 'receipt',
      title: 'Orders',
      subtitle: 'Manage orders',
      onPress: () => router.push('/farmer/orders'),
      color: '#f57c00',
    },
    {
      icon: 'analytics',
      title: 'Analytics',
      subtitle: 'View insights',
      onPress: () => router.push('/farmer/analytics'),
      color: '#7b1fa2',
    },
  ];

  const stats = [
    {
      icon: 'inventory',
      label: 'Total Products',
      value: productCount.toString(),
      color: '#2e7d32',
    },
    {
      icon: 'receipt',
      label: 'Orders',
      value: '0', // TODO: Get from API
      color: '#f57c00',
    },
    {
      icon: 'account-balance-wallet',
      label: 'Earnings',
      value: '₹0', // TODO: Get from API
      color: '#1976d2',
    },
    {
      icon: 'star',
      label: 'Rating',
      value: '4.5', // TODO: Get from API
      color: '#7b1fa2',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Welcome back, Farmer!</Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
              <MaterialIcons name={stat.icon as any} size={24} color={stat.color} />
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        {quickActions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={styles.actionCard}
            onPress={action.onPress}
          >
            <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
              <MaterialIcons name={action.icon as any} size={24} color={action.color} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#9ca3af" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.emptyCard}>
          <MaterialIcons name="history" size={48} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No recent activity</Text>
          <Text style={styles.emptySubtitle}>Your recent orders and updates will appear here</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { padding: 20, paddingTop: 40, backgroundColor: '#2e7d32' },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#e8f5e9' },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: { fontSize: 24, fontWeight: '800', color: '#1f2937', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#6b7280', textAlign: 'center' },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionContent: { flex: 1 },
  actionTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 2 },
  actionSubtitle: { fontSize: 14, color: '#6b7280' },
  emptyCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginTop: 16, marginBottom: 4 },
  emptySubtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
});
