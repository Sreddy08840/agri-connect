import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { CustomerStackParamList } from '../../navigation/types';
import { api } from '../../lib/api';
import { useCartStore } from '../../stores/cartStore';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import LoadingScreen from '../../components/ui/LoadingScreen';
import Input from '../../components/ui/Input';

type Props = {
  navigation: NativeStackNavigationProp<CustomerStackParamList, 'ProductDetail'>;
  route: RouteProp<CustomerStackParamList, 'ProductDetail'>;
};

const ProductDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { productId } = route.params;
  const [product, setProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState('1');
  const [loading, setLoading] = useState(true);
  const { addItem } = useCartStore();

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const response = await api.get(`/products/${productId}`);
      setProduct(response.data);
    } catch (error) {
      console.error('Failed to fetch product:', error);
      Alert.alert('Error', 'Failed to load product details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    const qty = parseFloat(quantity);
    if (!qty || qty <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid quantity');
      return;
    }

    await addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: qty,
      unit: product.unit,
      imageUrl: product.images?.[0],
      farmerId: product.farmerId,
      farmerName: product.farmer?.businessName || 'Unknown Farmer',
    });

    Alert.alert('Success', 'Product added to cart!', [
      { text: 'Continue Shopping', onPress: () => navigation.goBack() },
      { text: 'View Cart', onPress: () => navigation.navigate('CustomerTabs', { screen: 'Cart' }) },
    ]);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!product) {
    return null;
  }

  return (
    <ScrollView style={styles.container}>
      <Image
        source={{ uri: product.images?.[0] || 'https://via.placeholder.com/400' }}
        style={styles.image}
        resizeMode="cover"
      />

      <View style={styles.content}>
        <Card style={styles.card}>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.price}>₹{product.price}/{product.unit}</Text>
          
          {product.farmer && (
            <View style={styles.farmerInfo}>
              <Text style={styles.farmerLabel}>Sold by:</Text>
              <Text style={styles.farmerName}>{product.farmer.businessName}</Text>
              {product.farmer.ratingAvg > 0 && (
                <Text style={styles.rating}>⭐ {product.farmer.ratingAvg.toFixed(1)}</Text>
              )}
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.label}>Stock:</Text>
            <Text style={styles.value}>{product.stock} {product.unit}</Text>
          </View>

          {product.category && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Category:</Text>
              <Text style={styles.value}>{product.category.name}</Text>
            </View>
          )}

          {product.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{product.description}</Text>
            </View>
          )}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Add to Cart</Text>
          <Input
            label={`Quantity (${product.unit})`}
            placeholder="Enter quantity"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="decimal-pad"
          />
          <Text style={styles.total}>
            Total: ₹{(parseFloat(quantity) * product.price || 0).toFixed(2)}
          </Text>
          <Button
            title="Add to Cart"
            onPress={handleAddToCart}
            fullWidth
            disabled={product.stock <= 0}
          />
          {product.stock <= 0 && (
            <Text style={styles.outOfStock}>Out of Stock</Text>
          )}
        </Card>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  image: {
    width: '100%',
    height: 300,
    backgroundColor: '#E5E7EB',
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 16,
  },
  farmerInfo: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  farmerLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  farmerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  rating: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  total: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  outOfStock: {
    marginTop: 12,
    textAlign: 'center',
    color: '#EF4444',
    fontWeight: '600',
  },
});

export default ProductDetailScreen;
