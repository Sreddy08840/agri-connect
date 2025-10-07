import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { FarmerStackParamList } from '../../navigation/types';
import { api } from '../../lib/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingScreen from '../../components/ui/LoadingScreen';

type Props = {
  navigation: NativeStackNavigationProp<FarmerStackParamList, 'OrderDetail'>;
  route: RouteProp<FarmerStackParamList, 'OrderDetail'>;
};

const FarmerOrderDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      setOrder(response.data);
    } catch (error) {
      console.error('Failed to fetch order:', error);
      Alert.alert('Error', 'Failed to load order details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (status: string) => {
    Alert.alert(
      'Confirm Status Update',
      `Are you sure you want to mark this order as ${status}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setUpdating(true);
            try {
              await api.patch(`/orders/${orderId}/status`, { status });
              Alert.alert('Success', 'Order status updated successfully');
              fetchOrder();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to update order status');
            } finally {
              setUpdating(false);
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLACED': return '#F59E0B';
      case 'ACCEPTED': return '#3B82F6';
      case 'PACKED': return '#8B5CF6';
      case 'SHIPPED': return '#06B6D4';
      case 'DELIVERED': return '#10B981';
      case 'CANCELLED': return '#EF4444';
      default: return '#6B7280';
    }
  };

  if (loading) return <LoadingScreen />;
  if (!order) return null;

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Text style={styles.orderId}>Order #{order.orderNumber || order.id.slice(0, 8)}</Text>
        <Text style={styles.date}>{new Date(order.createdAt).toLocaleDateString()}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          <Text style={styles.statusText}>{order.status}</Text>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Customer Information</Text>
        <Text style={styles.infoText}>Name: {order.customer?.name || 'N/A'}</Text>
        <Text style={styles.infoText}>Phone: {order.customer?.phone || 'N/A'}</Text>
        {order.customer?.address && (
          <Text style={styles.infoText}>Address: {order.customer.address}</Text>
        )}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Items</Text>
        {order.items?.map((item: any) => (
          <View key={item.id} style={styles.item}>
            <Text style={styles.itemName}>{item.product?.name}</Text>
            <Text style={styles.itemDetails}>
              {item.quantity} {item.product?.unit} × ₹{item.price}
            </Text>
            <Text style={styles.itemTotal}>₹{(item.quantity * item.price).toFixed(2)}</Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalAmount}>₹{order.total?.toFixed(2)}</Text>
        </View>
      </Card>

      {order.addressSnapshot && (
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <Text style={styles.addressText}>{JSON.parse(order.addressSnapshot).street || order.addressSnapshot}</Text>
        </Card>
      )}

      {/* Order Status Actions */}
      {order.status === 'PLACED' && (
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Order Actions</Text>
          <Button
            title="✓ Accept Order"
            onPress={() => updateOrderStatus('ACCEPTED')}
            loading={updating}
            fullWidth
            style={styles.button}
          />
          <Button
            title="✕ Reject Order"
            onPress={() => updateOrderStatus('CANCELLED')}
            loading={updating}
            variant="danger"
            fullWidth
          />
        </Card>
      )}

      {order.status === 'ACCEPTED' && (
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Order Actions</Text>
          <Button
            title="📦 Mark as Packed"
            onPress={() => updateOrderStatus('PACKED')}
            loading={updating}
            fullWidth
            style={styles.button}
          />
          <Button
            title="✕ Cancel Order"
            onPress={() => updateOrderStatus('CANCELLED')}
            loading={updating}
            variant="danger"
            fullWidth
          />
        </Card>
      )}

      {order.status === 'PACKED' && (
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Order Actions</Text>
          <Button
            title="🚚 Mark as Shipped"
            onPress={() => updateOrderStatus('SHIPPED')}
            loading={updating}
            fullWidth
            style={styles.button}
          />
        </Card>
      )}

      {order.status === 'SHIPPED' && (
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Order Actions</Text>
          <Button
            title="✓ Mark as Delivered"
            onPress={() => updateOrderStatus('DELIVERED')}
            loading={updating}
            fullWidth
            style={styles.button}
          />
        </Card>
      )}

      {order.status === 'DELIVERED' && (
        <Card style={styles.card}>
          <View style={styles.deliveredBadge}>
            <Text style={styles.deliveredText}>✓ Order Completed</Text>
          </View>
        </Card>
      )}

      {order.status === 'CANCELLED' && (
        <Card style={styles.card}>
          <View style={styles.cancelledBadge}>
            <Text style={styles.cancelledText}>✕ Order Cancelled</Text>
          </View>
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
  card: { marginBottom: 16 },
  orderId: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 4 },
  date: { fontSize: 14, color: '#6B7280', marginBottom: 12 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, alignSelf: 'flex-start' },
  statusText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 },
  infoText: { fontSize: 14, color: '#374151', marginBottom: 8 },
  item: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  itemName: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
  itemDetails: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  itemTotal: { fontSize: 14, fontWeight: '600', color: '#10B981' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, marginTop: 8, borderTopWidth: 2, borderTopColor: '#E5E7EB' },
  totalLabel: { fontSize: 18, fontWeight: '700', color: '#111827' },
  totalAmount: { fontSize: 20, fontWeight: '700', color: '#10B981' },
  addressText: { fontSize: 14, color: '#374151', marginBottom: 4 },
  button: { marginBottom: 12 },
  deliveredBadge: { padding: 16, backgroundColor: '#D1FAE5', borderRadius: 8, alignItems: 'center' },
  deliveredText: { fontSize: 16, fontWeight: '600', color: '#059669' },
  cancelledBadge: { padding: 16, backgroundColor: '#FEE2E2', borderRadius: 8, alignItems: 'center' },
  cancelledText: { fontSize: 16, fontWeight: '600', color: '#DC2626' },
});

export default FarmerOrderDetailScreen;
