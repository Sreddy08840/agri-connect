import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getProduct, getCatalog } from '../../../services/customer';
import { addToCart } from '../../../services/cart';
import { MaterialIcons } from '@expo/vector-icons';

export default function ProductDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProduct(id as string),
    enabled: !!id,
  });

  const addToCartMutation = useMutation({
    mutationFn: () => addToCart(id as string, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      Alert.alert('Success', 'Product added to cart!');
      router.push('/customer/cart');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to add to cart');
    },
  });

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading product...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Product not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleAddToCart = () => {
    addToCartMutation.mutate();
  };

  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#2e7d32" />
        </TouchableOpacity>
      </View>

      {product.imageUrl ? (
        <Image source={{ uri: product.imageUrl }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.placeholder]} />
      )}

      <View style={styles.content}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.farmer}>by {product.farmerName || 'Farmer'}</Text>
        <Text style={styles.price}>₹{product.price?.toFixed(2) || '0.00'}</Text>

        {product.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>
        )}

        <View style={styles.quantitySection}>
          <Text style={styles.sectionTitle}>Quantity</Text>
          <View style={styles.quantityControls}>
            <TouchableOpacity onPress={decrementQuantity} style={styles.quantityButton}>
              <MaterialIcons name="remove" size={20} color="#2e7d32" />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity onPress={incrementQuantity} style={styles.quantityButton}>
              <MaterialIcons name="add" size={20} color="#2e7d32" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.addToCartButton, addToCartMutation.isPending && styles.disabledButton]}
          onPress={handleAddToCart}
          disabled={addToCartMutation.isPending}
        >
          <Text style={styles.addToCartText}>
            {addToCartMutation.isPending ? 'Adding...' : 'Add to Cart'}
          </Text>
          <MaterialIcons name="shopping-cart" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#6b7280' },
  errorText: { fontSize: 18, color: '#ef4444', marginBottom: 16 },
  backText: { fontSize: 16, color: '#2e7d32' },
  header: { padding: 16 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: 300, backgroundColor: '#f3f4f6' },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16 },
  name: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 4 },
  farmer: { fontSize: 16, color: '#6b7280', marginBottom: 8 },
  price: { fontSize: 28, fontWeight: '800', color: '#1b5e20', marginBottom: 16 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 8 },
  description: { fontSize: 16, color: '#4b5563', lineHeight: 24 },
  quantitySection: { marginBottom: 24 },
  quantityControls: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  quantityButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' },
  quantityText: { fontSize: 18, fontWeight: '600', minWidth: 40, textAlign: 'center' },
  addToCartButton: {
    backgroundColor: '#2e7d32',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  disabledButton: { opacity: 0.6 },
  addToCartText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});