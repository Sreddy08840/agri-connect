import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { CustomerStackParamList } from '../../navigation/types';
import { api } from '../../lib/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingScreen from '../../components/ui/LoadingScreen';

type Props = {
  navigation: NativeStackNavigationProp<CustomerStackParamList, 'OrderDetail'>;
  route: RouteProp<CustomerStackParamList, 'OrderDetail'>;
};

const OrderDetailScreen: React.FC<Props> = ({ route }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      setOrder(response.data);
    } catch (error) {
      console.error('Failed to fetch order:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const cancelOrder = async () => {
    Alert.alert(
      "Cancel Order",
      "Are you sure you want to cancel this order?",
      [
        { text: "No", style: "cancel" },
        { 
          text: "Yes", 
          onPress: async () => {
            try {
              setCancelling(true);
              await api.post(`/orders/${orderId}/cancel`);
              Alert.alert("Success", "Order cancelled successfully");
              fetchOrder(); // Refresh order data
            } catch (error: any) {
              const errorMessage = error.response?.data?.message || 'Failed to cancel order';
              Alert.alert("Error", errorMessage);
            } finally {
              setCancelling(false);
            }
          }
        }
      ]
    );
  };

  if (loading) return <LoadingScreen />;
  if (!order) return null;

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Text style={styles.orderId}>Order #{order.id.slice(0, 8)}</Text>
        <Text style={styles.date}>{new Date(order.createdAt).toLocaleDateString()}</Text>
        <View style={[styles.statusBadge, { backgroundColor: '#10B981' }]}>
          <Text style={styles.statusText}>{order.status}</Text>
        </View>
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

      {order.deliveryAddress && (
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <Text style={styles.addressText}>{order.deliveryAddress.street}</Text>
          <Text style={styles.addressText}>
            {order.deliveryAddress.city}, {order.deliveryAddress.state}
          </Text>
          <Text style={styles.addressText}>{order.deliveryAddress.pincode}</Text>
        </Card>
      )}

      {/* Cancel Order Button - Only show for orders that are not shipped or delivered */}
      {!['SHIPPED', 'DELIVERED', 'CANCELLED'].includes(order.status.toUpperCase()) && (
        <Card style={styles.card}>
          <Button 
            title={cancelling ? "Cancelling..." : "Cancel Order"} 
            onPress={cancelOrder}
            disabled={cancelling}
            style={styles.cancelButton}
            textStyle={styles.cancelButtonText}
          />
          <Text style={styles.cancelNote}>
            Note: Orders cannot be cancelled after they have been shipped
          </Text>
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
  item: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  itemName: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
  itemDetails: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  itemTotal: { fontSize: 14, fontWeight: '600', color: '#10B981' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, marginTop: 8, borderTopWidth: 2, borderTopColor: '#E5E7EB' },
  totalLabel: { fontSize: 18, fontWeight: '700', color: '#111827' },
  totalAmount: { fontSize: 20, fontWeight: '700', color: '#10B981' },
  addressText: { fontSize: 14, color: '#374151', marginBottom: 4 },
  cancelButton: { backgroundColor: '#EF4444', marginBottom: 8 },
  cancelButtonText: { color: '#FFFFFF', fontWeight: '600' },
  cancelNote: { fontSize: 12, color: '#6B7280', textAlign: 'center', fontStyle: 'italic' },
});

export default OrderDetailScreen;
