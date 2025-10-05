import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { FarmerStackParamList, FarmerTabParamList } from '../../navigation/types';
import { api } from '../../lib/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingScreen from '../../components/ui/LoadingScreen';

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<FarmerTabParamList, 'Products'>,
  NativeStackNavigationProp<FarmerStackParamList>
>;

type Props = {
  navigation: NavigationProp;
};

const FarmerProductsScreen: React.FC<Props> = ({ navigation }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products/farmer/my-products');
      setProducts(response.data || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const handleDelete = async (productId: string) => {
    Alert.alert('Delete Product', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/products/${productId}`);
            fetchProducts();
          } catch (error: any) {
            Alert.alert('Error', 'Failed to delete product');
          }
        },
      },
    ]);
  };

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Products</Text>
        <Button title="+ Add Product" onPress={() => navigation.navigate('AddProduct')} size="small" />
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.productCard}>
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.productPrice}>₹{item.price}/{item.unit}</Text>
            <Text style={styles.productStock}>Stock: {item.stock} {item.unit}</Text>
            <View style={styles.actions}>
              <Button title="Edit" onPress={() => navigation.navigate('EditProduct', { productId: item.id })} variant="outline" size="small" style={styles.actionButton} />
              <Button title="Delete" onPress={() => handleDelete(item.id)} variant="danger" size="small" style={styles.actionButton} />
            </View>
          </Card>
        )}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { backgroundColor: '#10B981', padding: 16, paddingTop: 48, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
  list: { padding: 16 },
  productCard: { marginBottom: 12 },
  productName: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 4 },
  productPrice: { fontSize: 16, fontWeight: '700', color: '#10B981', marginBottom: 4 },
  productStock: { fontSize: 14, color: '#6B7280', marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 8 },
  actionButton: { flex: 1 },
});

export default FarmerProductsScreen;
