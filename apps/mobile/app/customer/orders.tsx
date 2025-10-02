import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getOrders } from '../../services/customer';
import { MaterialIcons } from '@expo/vector-icons';

export default function Orders() {
  const { data = [], isLoading } = useQuery({ queryKey: ['orders'], queryFn: getOrders });

  const renderOrderItem = ({ item }: any) => (
    <TouchableOpacity style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>Order #{item.id?.substring(0, 8)}</Text>
        <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
          <Text style={styles.statusText}>{item.status || 'Pending'}</Text>
        </View>
      </View>
      
      <View style={styles.orderDetails}>
        <View style={styles.detailRow}>
          <MaterialIcons name="date-range" size={16} color="#6b7280" />
          <Text style={styles.detailText}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <MaterialIcons name="attach-money" size={16} color="#6b7280" />
          <Text style={styles.detailText}>
            ₹{item.total?.toFixed(2) || '0.00'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <MaterialIcons name="shopping-bag" size={16} color="#6b7280" />
          <Text style={styles.detailText}>
            {item.items?.length || 0} items
          </Text>
        </View>
      </View>

      <View style={styles.orderFooter}>
        <TouchableOpacity style={styles.viewButton}>
          <Text style={styles.viewButtonText}>View Details</Text>
          <MaterialIcons name="chevron-right" size={18} color="#2e7d32" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return { backgroundColor: '#d1fae5' };
      case 'processing':
        return { backgroundColor: '#fef3c7' };
      case 'cancelled':
        return { backgroundColor: '#fee2e2' };
      default:
        return { backgroundColor: '#e0e7ff' };
    }
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Loading your orders...</Text>
        </View>
      ) : data.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="receipt-long" size={80} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No Orders Yet</Text>
          <Text style={styles.emptySubtitle}>
            Start shopping to place your first order
          </Text>
        </View>
      ) : (
        <FlatList
          data={data}
          renderItem={renderOrderItem}
          keyExtractor={(item: any) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  listContent: { padding: 16 },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
    textTransform: 'capitalize',
  },
  orderDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
  },
  orderFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2e7d32',
  },
});
