import React, { useState } from 'react';
import { View, FlatList, Text, StyleSheet, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyProducts, deleteProduct } from '../../services/farmer';
import ProductCard from '../../components/ProductCard';
import Button from '../../components/Button';
import { useRouter } from 'expo-router';

export default function FarmerProducts() {
  const router = useRouter();
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  
  const { data = [], isLoading, error, refetch } = useQuery({ 
    queryKey: ['farmer-products'], 
    queryFn: getMyProducts,
    retry: 2,
  });
  
  const del = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['farmer-products'] });
      Alert.alert('Success', 'Product deleted successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.message || 'Failed to delete product');
    }
  });

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const confirmDelete = (item: any) => {
    console.log('🗑️ Delete item:', item);
    
    if (!item.id) {
      Alert.alert('Error', 'Cannot delete product: Invalid product ID');
      return;
    }
    
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          console.log('🗑️ Deleting product with ID:', item.id);
          del.mutate(String(item.id));
        }}
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved': return '#16a34a';
      case 'pending_review': return '#f59e0b';
      case 'rejected': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending_review': return 'Pending Review';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      default: return 'Draft';
    }
  };

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to load products</Text>
        <Text style={styles.errorSubtext}>{error?.message || 'Please check your connection'}</Text>
        <Button title="Retry" onPress={() => refetch()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Products ({data.length})</Text>
        <Button title="+ Add Product" onPress={() => router.push('/farmer/product-add')} />
      </View>
      
      {data.length === 0 && !isLoading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Products Yet</Text>
          <Text style={styles.emptySubtext}>Start by adding your first product to sell</Text>
          <Button title="Add Your First Product" onPress={() => router.push('/farmer/product-add')} />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item: any, index: number) => item.id ? String(item.id) : `item-${index}`}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            // Validate item data
            if (!item || !item.id) {
              console.warn('⚠️ Invalid product item:', item);
              return null;
            }

            return (
              <View style={styles.productContainer}>
                <ProductCard
                  product={{ 
                    id: String(item.id), 
                    name: item.name || 'Unknown Product', 
                    price: item.price || 0, 
                    imageUrl: item.imageUrl || item.images?.[0] 
                  }}
                  action={
                    <View style={styles.actionContainer}>
                      <TouchableOpacity 
                        style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}
                      >
                        <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
                      </TouchableOpacity>
                      <Button 
                        title="Delete" 
                        variant="danger" 
                        onPress={() => confirmDelete(item)}
                        style={styles.deleteButton}
                      />
                    </View>
                  }
                />
                <View style={styles.productDetails}>
                  <Text style={styles.stockText}>Stock: {item.stockQty || 0} {item.unit || 'units'}</Text>
                  <Text style={styles.categoryText}>Category: {item.category?.name || 'N/A'}</Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  title: { fontSize: 20, fontWeight: '700', color: '#111827' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 18, fontWeight: '600', color: '#dc2626', marginBottom: 8 },
  errorSubtext: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#374151', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 24 },
  listContainer: { padding: 12 },
  productContainer: { marginBottom: 16 },
  actionContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  deleteButton: { minWidth: 80 },
  productDetails: { 
    backgroundColor: '#fff', 
    paddingHorizontal: 12, 
    paddingBottom: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6'
  },
  stockText: { fontSize: 12, color: '#6b7280', marginBottom: 2 },
  categoryText: { fontSize: 12, color: '#6b7280' },
});
