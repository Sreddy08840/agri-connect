import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';
import { getCatalog } from '../../services/customer';

export default function FarmerAnalytics() {
  const { data: products } = useQuery({
    queryKey: ['farmer-products'],
    queryFn: getCatalog,
  });

  const productCount = products?.length || 0;

  const stats = [
    {
      icon: 'inventory',
      label: 'Total Products',
      value: productCount.toString(),
      color: '#2e7d32',
      subtitle: 'Active listings',
    },
    {
      icon: 'receipt',
      label: 'Orders',
      value: '0',
      color: '#f57c00',
      subtitle: 'This month',
    },
    {
      icon: 'account-balance-wallet',
      label: 'Earnings',
      value: '₹0',
      color: '#1976d2',
      subtitle: 'Total revenue',
    },
    {
      icon: 'star',
      label: 'Rating',
      value: '4.5',
      color: '#7b1fa2',
      subtitle: 'Average rating',
    },
  ];

  const insights = [
    {
      icon: 'trending-up',
      title: 'Performance',
      description: 'Your products are performing well. Keep up the good work!',
      color: '#4caf50',
    },
    {
      icon: 'inventory',
      title: 'Stock Levels',
      description: 'Monitor your inventory to ensure products are always available.',
      color: '#ff9800',
    },
    {
      icon: 'people',
      title: 'Customer Feedback',
      description: 'Check reviews and ratings to improve your service.',
      color: '#2196f3',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
        <Text style={styles.subtitle}>Track your farm's performance</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
              <MaterialIcons name={stat.icon as any} size={28} color={stat.color} />
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statSubtitle}>{stat.subtitle}</Text>
          </View>
        ))}
      </View>

      {/* Insights */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Insights & Tips</Text>
        {insights.map((insight, index) => (
          <View key={index} style={styles.insightCard}>
            <View style={[styles.insightIcon, { backgroundColor: insight.color + '20' }]}>
              <MaterialIcons name={insight.icon as any} size={24} color={insight.color} />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>{insight.title}</Text>
              <Text style={styles.insightDescription}>{insight.description}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Charts Placeholder */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trends</Text>
        <View style={styles.chartPlaceholder}>
          <MaterialIcons name="bar-chart" size={64} color="#d1d5db" />
          <Text style={styles.chartTitle}>Charts Coming Soon</Text>
          <Text style={styles.chartSubtitle}>
            Detailed analytics and charts will be available in future updates
          </Text>
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
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: { fontSize: 28, fontWeight: '800', color: '#1f2937', marginBottom: 4 },
  statLabel: { fontSize: 14, fontWeight: '600', color: '#1f2937', marginBottom: 2 },
  statSubtitle: { fontSize: 12, color: '#6b7280' },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  insightIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  insightContent: { flex: 1 },
  insightTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 4 },
  insightDescription: { fontSize: 14, color: '#6b7280', lineHeight: 20 },
  chartPlaceholder: {
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
  chartTitle: { fontSize: 18, fontWeight: '600', color: '#1f2937', marginTop: 16, marginBottom: 4 },
  chartSubtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20 },
});