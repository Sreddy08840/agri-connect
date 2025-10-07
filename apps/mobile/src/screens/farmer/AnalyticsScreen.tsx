import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { api } from '../../lib/api';
import Card from '../../components/ui/Card';
import LoadingScreen from '../../components/ui/LoadingScreen';

const AnalyticsScreen: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/users/farmer/analytics');
      setAnalytics(response.data);
    } catch (error: any) {
      console.error('Failed to fetch analytics:', error);
      // Set default analytics on error
      setAnalytics({
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
    fetchAnalytics();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  if (loading) return <LoadingScreen />;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
        <Text style={styles.subtitle}>Track your business performance</Text>
      </View>

      <View style={styles.content}>
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Revenue</Text>
          <Text style={styles.bigNumber}>₹{analytics?.totalRevenue?.toFixed(2) || '0.00'}</Text>
          <Text style={styles.cardSubtitle}>Total Revenue</Text>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Orders</Text>
          <View style={styles.statsRow}>
            <StatItem label="Total" value={analytics?.totalOrders || 0} />
            <StatItem label="Pending" value={analytics?.pendingOrders || 0} />
            <StatItem label="Completed" value={analytics?.completedOrders || 0} />
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Products</Text>
          <View style={styles.statsRow}>
            <StatItem label="Active" value={analytics?.activeProducts || 0} />
            <StatItem label="Out of Stock" value={analytics?.outOfStockProducts || 0} />
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Customer Rating</Text>
          <Text style={styles.bigNumber}>⭐ {analytics?.avgRating?.toFixed(1) || 'N/A'}</Text>
          <Text style={styles.cardSubtitle}>Average Rating</Text>
        </Card>
      </View>
    </ScrollView>
  );
};

const StatItem = ({ label, value }: { label: string; value: number }) => (
  <View style={styles.statItem}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { backgroundColor: '#10B981', padding: 24, paddingTop: 48 },
  title: { fontSize: 28, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#FFFFFF', opacity: 0.9 },
  content: { padding: 16 },
  card: { marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#6B7280', marginBottom: 12 },
  bigNumber: { fontSize: 36, fontWeight: '700', color: '#111827', marginBottom: 4 },
  cardSubtitle: { fontSize: 14, color: '#6B7280' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: '700', color: '#10B981', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#6B7280' },
});

export default AnalyticsScreen;
