import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getOrder } from '../../../services/customer';
import { MaterialIcons } from '@expo/vector-icons';

export default function OrderDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrder(id as string),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading order...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Order not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return '#d1fae5';
      case 'shipped': return '#dbeafe';
      case 'packed': return '#fef3c7';
      case 'accepted': return '#ecfdf5';
      case 'placed': return '#f3f4f6';
      case 'cancelled': return '#fee2e2';
      default: return '#f3f4f6';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return '#065f46';
      case 'shipped': return '#1e40af';
      case 'packed': return '#92400e';
      case 'accepted': return '#047857';
      case 'placed': return '#374151';
      case 'cancelled': return '#dc2626';
      default: return '#374151';
    }
  };

  const renderOrderItem = ({ item }: any) => (
    <View style={styles.itemCard}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.product?.name || 'Product'}</Text>
        <Text style={styles.itemQty}>Qty: {item.qty}</Text>
        <Text style={styles.itemPrice}>₹{(item.unitPrice * item.qty).toFixed(2)}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#2e7d32" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
      </View>

      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderId}>Order #{order.id?.substring(0, 8)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
            <Text style={[styles.statusText, { color: getStatusTextColor(order.status) }]}>
              {order.status || 'Pending'}
            </Text>
          </View>
        </View>

        <View style={styles.orderDetails}>
          <View style={styles.detailRow}>
            <MaterialIcons name="date-range" size={16} color="#6b7280" />
            <Text style={styles.detailText}>
              {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialIcons name="payment" size={16} color="#6b7280" />
            <Text style={styles.detailText}>{order.paymentMethod || 'COD'}</Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialIcons name="attach-money" size={16} color="#6b7280" />
            <Text style={styles.detailText}>₹{order.total?.toFixed(2) || '0.00'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Items</Text>
        <FlatList
          data={order.items || []}
          renderItem={renderOrderItem}
          keyExtractor={(item: any) => String(item.id)}
          scrollEnabled={false}
        />
      </View>

      {order.customer && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <View style={styles.addressCard}>
            <Text style={styles.customerName}>{order.customer.name}</Text>
            <Text style={styles.customerPhone}>{order.customer.phone}</Text>
            {order.addressSnapshot && (
              <Text style={styles.addressText}>
                {JSON.parse(order.addressSnapshot).street}, {JSON.parse(order.addressSnapshot).city}, {JSON.parse(order.addressSnapshot).state} - {JSON.parse(order.addressSnapshot).pincode}
              </Text>
            )}
          </View>
        </View>
      )}

      {order.farmer && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Farmer Details</Text>
          <View style={styles.farmerCard}>
            <Text style={styles.farmerName}>{order.farmer.businessName || order.farmer.user?.name}</Text>
            <Text style={styles.farmerPhone}>{order.farmer.user?.phone}</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#6b7280' },
  errorText: { fontSize: 18, color: '#ef4444', marginBottom: 16 },
  backText: { fontSize: 16, color: '#2e7d32' },
  header: { padding: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff' },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  orderCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, margin: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  orderId: { fontSize: 18, fontWeight: '700', color: '#111827' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  orderDetails: { gap: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 14, color: '#6b7280' },
  section: { marginHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 12 },
  itemCard: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  itemInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { fontSize: 16, fontWeight: '600', color: '#111827', flex: 1 },
  itemQty: { fontSize: 14, color: '#6b7280' },
  itemPrice: { fontSize: 16, fontWeight: '600', color: '#1b5e20' },
  addressCard: { backgroundColor: '#fff', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  customerName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  customerPhone: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  addressText: { fontSize: 14, color: '#4b5563', marginTop: 4 },
  farmerCard: { backgroundColor: '#fff', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  farmerName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  farmerPhone: { fontSize: 14, color: '#6b7280', marginTop: 4 },
});