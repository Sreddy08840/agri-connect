import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CustomerStackParamList } from '../../navigation/types';
import { useCartStore } from '../../stores/cartStore';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../lib/api';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';

type Props = {
  navigation: NativeStackNavigationProp<CustomerStackParamList, 'Checkout'>;
};

const CheckoutScreen: React.FC<Props> = ({ navigation }) => {
  const { items, getTotal, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState({
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    pincode: user?.address?.pincode || '',
  });
  const [errors, setErrors] = useState<any>({});

  const handlePlaceOrder = async () => {
    setErrors({});

    // Validation
    const newErrors: any = {};
    if (!address.street) newErrors.street = 'Street address is required';
    if (!address.city) newErrors.city = 'City is required';
    if (!address.state) newErrors.state = 'State is required';
    if (!address.pincode) newErrors.pincode = 'Pincode is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      // Group items by farmer
      const ordersByFarmer: any = {};
      items.forEach((item) => {
        if (!ordersByFarmer[item.farmerId]) {
          ordersByFarmer[item.farmerId] = [];
        }
        ordersByFarmer[item.farmerId].push({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        });
      });

      // Create orders for each farmer
      const orderPromises = Object.entries(ordersByFarmer).map(([farmerId, orderItems]) =>
        api.post('/orders', {
          items: orderItems,
          deliveryAddress: address,
        })
      );

      const responses = await Promise.all(orderPromises);
      const firstOrderId = responses[0]?.data?.id;

      await clearCart();

      Alert.alert('Success', 'Order placed successfully!', [
        {
          text: 'OK',
          onPress: () => {
            if (firstOrderId) {
              navigation.replace('OrderConfirmation', { orderId: firstOrderId });
            } else {
              navigation.navigate('CustomerTabs', { screen: 'Orders' });
            }
          },
        },
      ]);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to place order';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const total = getTotal();

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        {items.map((item) => (
          <View key={item.id} style={styles.orderItem}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemDetails}>
              {item.quantity} {item.unit} × ₹{item.price}
            </Text>
            <Text style={styles.itemTotal}>₹{(item.quantity * item.price).toFixed(2)}</Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalAmount}>₹{total.toFixed(2)}</Text>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Delivery Address</Text>
        <Input
          label="Street Address"
          placeholder="Enter street address"
          value={address.street}
          onChangeText={(text) => setAddress({ ...address, street: text })}
          error={errors.street}
        />
        <Input
          label="City"
          placeholder="Enter city"
          value={address.city}
          onChangeText={(text) => setAddress({ ...address, city: text })}
          error={errors.city}
        />
        <Input
          label="State"
          placeholder="Enter state"
          value={address.state}
          onChangeText={(text) => setAddress({ ...address, state: text })}
          error={errors.state}
        />
        <Input
          label="Pincode"
          placeholder="Enter pincode"
          value={address.pincode}
          onChangeText={(text) => setAddress({ ...address, pincode: text })}
          keyboardType="number-pad"
          error={errors.pincode}
        />
      </Card>

      <View style={styles.footer}>
        <Button
          title={`Place Order - ₹${total.toFixed(2)}`}
          onPress={handlePlaceOrder}
          loading={loading}
          fullWidth
          size="large"
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  orderItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10B981',
  },
  footer: {
    marginBottom: 32,
  },
});

export default CheckoutScreen;
