import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useAuthStore } from '../stores/authStore';
import { getFarmerAnalytics, type FarmerAnalytics } from '../lib/api/ai';

export default function AIInsightsScreen() {
  const { token, user } = useAuthStore();
  const [analytics, setAnalytics] = useState<FarmerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token && user?.role === 'FARMER') {
      loadAnalytics();
    }
  }, [token, user]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await getFarmerAnalytics(token!);
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!analytics) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to load analytics</Text>
      </View>
    );
  }

  // Prepare chart data
  const chartData = {
    labels: analytics.revenueTrend.map((item) => item.month.slice(5)), // Get MM from YYYY-MM
    datasets: [
      {
        data: analytics.revenueTrend.map((item) => item.revenue),
        color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Insights</Text>
        <Text style={styles.subtitle}>Your performance at a glance</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.greenCard]}>
          <Text style={styles.statLabel}>Total Revenue</Text>
          <Text style={styles.statValue}>₹{analytics.totalRevenue.toLocaleString()}</Text>
        </View>

        <View style={[styles.statCard, styles.blueCard]}>
          <Text style={styles.statLabel}>Total Orders</Text>
          <Text style={styles.statValue}>{analytics.totalOrders}</Text>
        </View>

        <View style={[styles.statCard, styles.purpleCard]}>
          <Text style={styles.statLabel}>Products</Text>
          <Text style={styles.statValue}>{analytics.totalProducts}</Text>
        </View>

        <View style={[styles.statCard, styles.yellowCard]}>
          <Text style={styles.statLabel}>Avg Rating</Text>
          <Text style={styles.statValue}>{analytics.averageRating.toFixed(1)} ⭐</Text>
        </View>
      </View>

      {/* Revenue Trend Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Revenue Trend</Text>
        <Text style={styles.chartSubtitle}>Last 6 months</Text>
        {analytics.revenueTrend.length > 0 ? (
          <LineChart
            data={chartData}
            width={Dimensions.get('window').width - 48}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: '#10b981',
              },
            }}
            bezier
            style={styles.chart}
          />
        ) : (
          <Text style={styles.noDataText}>No data available</Text>
        )}
      </View>

      {/* AI Tools Info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>🤖 AI-Powered Features</Text>
        <Text style={styles.infoText}>
          • Smart price recommendations{'\n'}
          • Sales forecasting{'\n'}
          • Demand prediction{'\n'}
          • Performance analytics
        </Text>
      </View>

      <TouchableOpacity style={styles.refreshButton} onPress={loadAnalytics}>
        <Text style={styles.refreshButtonText}>Refresh Data</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  header: {
    padding: 24,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  greenCard: {
    backgroundColor: '#d1fae5',
  },
  blueCard: {
    backgroundColor: '#dbeafe',
  },
  purpleCard: {
    backgroundColor: '#e9d5ff',
  },
  yellowCard: {
    backgroundColor: '#fef3c7',
  },
  statLabel: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  chartCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  noDataText: {
    textAlign: 'center',
    color: '#6b7280',
    padding: 20,
  },
  infoCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1e3a8a',
    lineHeight: 22,
  },
  refreshButton: {
    margin: 16,
    marginBottom: 32,
    padding: 16,
    backgroundColor: '#10b981',
    borderRadius: 12,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
  },
});
