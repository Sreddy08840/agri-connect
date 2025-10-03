import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';
import { getFarmerOrders } from '../../services/farmer';

const statuses = ['ACCEPTED', 'REJECTED', 'PACKED', 'SHIPPED', 'DELIVERED'] as const;

export default function FarmerOrders() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['farmer-orders'],
    queryFn: getFarmerOrders
  });

  const [localStatuses, setLocalStatuses] = useState<Record<string, string>>({});


  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'accepted': return '#d1fae5';
      case 'packed': return '#fef3c7';
      case 'shipped': return '#dbeafe';
      case 'delivered': return '#d1fae5';
      case 'rejected': return '#fee2e2';
      default: return '#f3f4f6';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'accepted': return '#065f46';
      case 'packed': return '#92400e';
      case 'shipped': return '#1e40af';
      case 'delivered': return '#065f46';
      case 'rejected': return '#dc2626';
      default: return '#374151';
    }
  };

  const renderOrder = ({ item }: { item: any }) => {
    const currentStatus = localStatuses[item.id] || item.status;

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderId}>#{item.id?.slice(-6)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={[styles.statusText, { color: getStatusTextColor(item.status) }]}>
              {item.status?.toLowerCase()}
            </Text>
          </View>
        </View>

        <View style={styles.orderDetails}>
          <View style={styles.detailRow}>
            <MaterialIcons name="person" size={16} color="#6b7280" />
            <Text style={styles.detailText}>{item.customer?.name || 'Customer'}</Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialIcons name="phone" size={16} color="#6b7280" />
            <Text style={styles.detailText}>{item.customer?.phone || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialIcons name="date-range" size={16} color="#6b7280" />
            <Text style={styles.detailText}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialIcons name="attach-money" size={16} color="#6b7280" />
            <Text style={styles.detailText}>₹{item.total}</Text>
          </View>
        </View>

        <View style={styles.itemsSection}>
          <Text style={styles.itemsTitle}>Items:</Text>
          {item.items?.map((orderItem: any, idx: number) => (
            <Text key={idx} style={styles.itemText}>
              {orderItem.qty} x {orderItem.product?.name}
            </Text>
          ))}
        </View>

        <View style={styles.actionsSection}>
          <Text style={styles.actionsTitle}>Update Status:</Text>
          <View style={styles.statusSelector}>
            <TouchableOpacity
              style={styles.statusButton}
              onPress={() => {
                const currentIndex = statuses.findIndex(s => s === currentStatus);
                const nextIndex = (currentIndex + 1) % statuses.length;
                setLocalStatuses(prev => ({ ...prev, [item.id]: statuses[nextIndex] }));
              }}
            >
              <Text style={styles.statusButtonText}>
                {currentStatus?.toLowerCase()}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={20} color="#2e7d32" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.updateButton}
              onPress={() => Alert.alert('Coming Soon', 'Order status update will be available soon')}
            >
              <Text style={styles.updateButtonText}>Update</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text>Loading orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Orders</Text>
      {orders.length === 0 ? (
        <View style={styles.empty}>
          <MaterialIcons name="receipt" size={64} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptySubtitle}>Orders from customers will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 16, color: '#1f2937' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1f2937', marginTop: 16, marginBottom: 4 },
  emptySubtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  list: { paddingBottom: 20 },
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
  },
  orderId: { fontSize: 18, fontWeight: '700', color: '#1f2937' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  orderDetails: { marginBottom: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  detailText: { fontSize: 14, color: '#6b7280', marginLeft: 8 },
  itemsSection: { marginBottom: 12 },
  itemsTitle: { fontSize: 14, fontWeight: '600', color: '#1f2937', marginBottom: 4 },
  itemText: { fontSize: 14, color: '#4b5563', marginLeft: 8 },
  actionsSection: { borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 12 },
  actionsTitle: { fontSize: 14, fontWeight: '600', color: '#1f2937', marginBottom: 8 },
  statusSelector: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#f9fafb',
  },
  statusButtonText: { fontSize: 14, color: '#2e7d32', marginRight: 4 },
  updateButton: {
    backgroundColor: '#2e7d32',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  disabledButton: { opacity: 0.6 },
  updateButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
