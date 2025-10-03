import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Button from '../../components/Button';
import { useRouter } from 'expo-router';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart as clearCartApi,
  checkout as checkoutApi,
  type CartItem,
} from '../../services/cart';
import { getToken } from '../../utils/storage';

export default function Cart() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await getToken();
      setHasToken(!!token);
    };
    checkAuth();
  }, []);

  const { data: cart, isLoading, isRefetching } = useQuery({
    queryKey: ['cart'],
    queryFn: getCart,
    enabled: hasToken === true
  });

  const updateQty = useMutation({
    mutationFn: ({ id, qty }: { id: string; qty: number }) => updateCartItem(id, qty),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
    onError: (err: any) => Alert.alert('Update Failed', err?.message || 'Could not update quantity'),
  });

  const removeItem = useMutation({
    mutationFn: (id: string) => removeCartItem(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
    onError: (err: any) => Alert.alert('Remove Failed', err?.message || 'Could not remove item'),
  });

  const clearCart = useMutation({
    mutationFn: () => clearCartApi(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
    onError: (err: any) => Alert.alert('Clear Failed', err?.message || 'Could not clear cart'),
  });

  const checkout = useMutation({
    mutationFn: async () => {
      const items = (cart?.items || []).map((i) => ({ productId: i.productId, qty: i.qty }));
      return checkoutApi(items, { paymentMethod: 'COD' });
    },
    onSuccess: () => {
      Alert.alert('Order Placed', 'Your order has been placed successfully!', [
        { text: 'View Orders', onPress: () => router.push('/customer/orders') },
      ]);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (err: any) => Alert.alert('Checkout Failed', err?.message || 'Could not place order'),
  });

  const total = useMemo(() => {
    return (cart?.items || []).reduce((sum, item) => sum + item.qty * (item.unitPriceSnapshot || 0), 0);
  }, [cart]);

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={styles.item}>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemTitle} numberOfLines={1}>
          {item.product?.name || 'Product'}
        </Text>
        <Text style={styles.price}>₹{(item.unitPriceSnapshot || 0).toFixed(2)}</Text>
      </View>

      <View style={styles.qtyRow}>
        <TouchableOpacity
          style={[styles.qtyButton, item.qty <= 1 && styles.qtyButtonDisabled]}
          onPress={() => item.qty > 1 && updateQty.mutate({ id: item.id, qty: item.qty - 1 })}
          disabled={updateQty.isPending || item.qty <= 1}
          activeOpacity={0.7}
        >
          <Text style={styles.qtyButtonText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.qty}>{item.qty}</Text>
        <TouchableOpacity
          style={styles.qtyButton}
          onPress={() => updateQty.mutate({ id: item.id, qty: item.qty + 1 })}
          disabled={updateQty.isPending}
          activeOpacity={0.7}
        >
          <Text style={styles.qtyButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeItem.mutate(item.id)}
        disabled={removeItem.isPending}
        activeOpacity={0.7}
      >
        <Text style={styles.removeText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading && !cart) {
    return (
      <View style={styles.center}> 
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={{ marginTop: 8, color: '#6b7280' }}>Loading cart...</Text>
      </View>
    );
  }

  const isEmpty = (cart?.items || []).length === 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cart</Text>

      {isRefetching ? (
        <View style={styles.center}><ActivityIndicator color="#2e7d32" /></View>
      ) : isEmpty ? (
        <View style={styles.empty}> 
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySub}>Browse products and add items to your cart</Text>
          <Button title="Browse Products" onPress={() => router.push('/customer/catalog')} style={{ marginTop: 16 }} />
        </View>
      ) : (
        <>
          <FlatList
            data={cart?.items || []}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            contentContainerStyle={{ paddingBottom: 16 }}
          />

          <View style={styles.footer}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Button
                title={clearCart.isPending ? 'Clearing...' : 'Clear Cart'}
                onPress={() => {
                  Alert.alert('Clear Cart', 'Remove all items from your cart?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Clear', style: 'destructive', onPress: () => clearCart.mutate() },
                  ]);
                }}
                variant="secondary"
                disabled={clearCart.isPending || checkout.isPending}
                style={{ flex: 1 }}
              />
              <Button
                title={checkout.isPending ? 'Placing Order...' : 'Checkout'}
                onPress={() => checkout.mutate()}
                disabled={checkout.isPending}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937' },
  emptySub: { marginTop: 4, color: '#6b7280' },
  item: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  price: { color: '#1b5e20', fontWeight: '700', marginTop: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qty: { minWidth: 24, textAlign: 'center', fontWeight: '700', color: '#111827' },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8f5e9',
  },
  qtyButtonDisabled: { backgroundColor: '#f3f4f6' },
  qtyButtonText: { color: '#2e7d32', fontWeight: '800', fontSize: 16 },
  removeButton: { paddingHorizontal: 8, paddingVertical: 6 },
  removeText: { color: '#b91c1c', fontWeight: '600' },
  footer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
  },
  totalLabel: { fontSize: 16, fontWeight: '600', color: '#111827' },
  totalValue: { fontSize: 18, fontWeight: '700', color: '#1b5e20' },
});
