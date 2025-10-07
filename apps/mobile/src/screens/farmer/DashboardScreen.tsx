import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { api } from '../../lib/api';
import Card from '../../components/ui/Card';
import LoadingScreen from '../../components/ui/LoadingScreen';

const DashboardScreen: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await api.get('/users/farmer/analytics');
      setStats(response.data);
    } catch (error: any) {
      console.error('Failed to fetch stats:', error);
      // Set default stats on error
      setStats({
        totalRevenue: 0,
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        activeProducts: 0,
        outOfStockProducts: 0,
        avgRating: 0
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading) return <LoadingScreen />;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.header}>
        <Text style={styles.title}>Farmer Dashboard</Text>
        <Text style={styles.subtitle}>Overview of your farm business</Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard title="Total Revenue" value={`₹${stats?.totalRevenue?.toFixed(2) || '0.00'}`} icon="💰" color="#10B981" />
        <StatCard title="Total Orders" value={stats?.totalOrders || '0'} icon="📦" color="#3B82F6" />
        <StatCard title="Active Products" value={stats?.activeProducts || '0'} icon="🌾" color="#F59E0B" />
        <StatCard title="Avg Rating" value={stats?.avgRating?.toFixed(1) || 'N/A'} icon="⭐" color="#8B5CF6" />
      </View>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Recent Orders</Text>
        {stats?.recentOrders?.length > 0 ? (
          stats.recentOrders.map((order: any) => (
            <View key={order.id} style={styles.orderItem}>
              <Text style={styles.orderText}>Order #{order.id.slice(0, 8)}</Text>
              <Text style={styles.orderAmount}>₹{order.total?.toFixed(2)}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No recent orders</Text>
        )}
      </Card>
    </ScrollView>
  );
};

const StatCard = ({ title, value, icon, color }: any) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { backgroundColor: '#10B981', padding: 24, paddingTop: 48 },
  title: { fontSize: 28, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#FFFFFF', opacity: 0.9 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12 },
  statCard: { 
    width: '48%', 
    padding: 16, 
    borderLeftWidth: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statIcon: { fontSize: 32, marginBottom: 8 },
  statValue: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 4 },
  statTitle: { fontSize: 12, color: '#6B7280' },
  card: { margin: 16, marginTop: 0 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 },
  orderItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  orderText: { fontSize: 14, color: '#374151' },
  orderAmount: { fontSize: 14, fontWeight: '600', color: '#10B981' },
  emptyText: { fontSize: 14, color: '#6B7280', textAlign: 'center', paddingVertical: 16 },
});

export default DashboardScreen;
