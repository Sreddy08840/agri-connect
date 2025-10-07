import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { FarmerStackParamList } from '../../navigation/types';
import { api } from '../../lib/api';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import LoadingScreen from '../../components/ui/LoadingScreen';
import * as ImagePicker from 'expo-image-picker';

type Props = {
  navigation: NativeStackNavigationProp<FarmerStackParamList, 'EditProduct'>;
  route: RouteProp<FarmerStackParamList, 'EditProduct'>;
};

const EditProductScreen: React.FC<Props> = ({ navigation, route }) => {
  const { productId } = route.params;
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    unit: '',
    categoryId: '',
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchProduct();
    fetchCategories();
  }, [productId]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchProduct = async () => {
    try {
      const response = await api.get(`/products/${productId}`);
      const product = response.data;
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price.toString(),
        stock: (product.stockQty || product.stock || 0).toString(),
        unit: product.unit,
        categoryId: product.categoryId || '',
      });
      
      // Load existing images
      if (product.images) {
        let productImages = [];
        if (Array.isArray(product.images)) {
          productImages = product.images;
        } else if (typeof product.images === 'string') {
          try {
            productImages = JSON.parse(product.images);
          } catch {
            productImages = product.images.split(',').map((s: string) => s.trim()).filter(Boolean);
          }
        }
        setImages(productImages);
      }
    } catch (error: any) {
      console.error('Failed to load product:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to load product');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    if (images.length >= 5) {
      Alert.alert('Limit Reached', 'You can only add up to 5 images');
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to upload images');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    if (images.length >= 5) {
      Alert.alert('Limit Reached', 'You can only add up to 5 images');
      return;
    }

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera permissions to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const uploadImage = async (asset: any) => {
    setUploadingImage(true);
    try {
      if (asset.base64) {
        const sizeInBytes = (asset.base64.length * 3) / 4;
        if (sizeInBytes > 10 * 1024 * 1024) {
          Alert.alert('Error', 'Image size must be less than 10MB');
          return;
        }
      }

      const uriParts = asset.uri.split('.');
      const fileType = uriParts[uriParts.length - 1].toLowerCase();
      const dataUrl = `data:image/${fileType};base64,${asset.base64}`;

      const response = await api.post('/upload/product-image', { image: dataUrl });
      
      if (response.data.imageUrl) {
        setImages(prev => [...prev, response.data.imageUrl]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const showImageOptions = () => {
    Alert.alert(
      'Add Product Image',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Gallery', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSubmit = async () => {
    setErrors({});
    const newErrors: any = {};
    
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.price) newErrors.price = 'Price is required';
    if (!formData.stock) newErrors.stock = 'Stock is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    try {
      await api.patch(`/products/${productId}`, {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        unit: formData.unit,
        stockQty: parseFloat(formData.stock),
        categoryId: formData.categoryId,
        images: images,
      });
      Alert.alert('Success', 'Product updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      console.error('Update error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingScreen />;

  const apiBaseUrl = api.defaults.baseURL?.replace('/api', '') || 'http://localhost:3001';

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Text style={styles.title}>Edit Product</Text>
        
        {/* Product Images Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Images (Max 5)</Text>
          <Text style={styles.sectionSubtitle}>Edit or add product photos</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
            {images.map((imageUrl, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image 
                  source={{ uri: imageUrl.startsWith('http') ? imageUrl : `${apiBaseUrl}${imageUrl}` }} 
                  style={styles.productImage}
                />
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <Text style={styles.removeImageText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            
            {images.length < 5 && (
              <TouchableOpacity 
                style={styles.addImageButton}
                onPress={showImageOptions}
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <ActivityIndicator size="large" color="#10B981" />
                ) : (
                  <>
                    <Text style={styles.addImageIcon}>📷</Text>
                    <Text style={styles.addImageText}>Add Image</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        <Input
          label="Product Name"
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          error={errors.name}
        />

        {/* Category Selector */}
        <View style={styles.section}>
          <Text style={styles.inputLabel}>Category *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  formData.categoryId === category.id && styles.categoryChipSelected
                ]}
                onPress={() => setFormData({ ...formData, categoryId: category.id })}
              >
                <Text style={[
                  styles.categoryChipText,
                  formData.categoryId === category.id && styles.categoryChipTextSelected
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <Input
          label="Description"
          value={formData.description}
          onChangeText={(text) => setFormData({ ...formData, description: text })}
          multiline
          numberOfLines={4}
        />

        <Input
          label="Price (₹)"
          value={formData.price}
          onChangeText={(text) => setFormData({ ...formData, price: text })}
          keyboardType="decimal-pad"
          error={errors.price}
        />

        <Input
          label="Stock Quantity"
          value={formData.stock}
          onChangeText={(text) => setFormData({ ...formData, stock: text })}
          keyboardType="decimal-pad"
          error={errors.stock}
        />

        <Input
          label="Unit"
          value={formData.unit}
          onChangeText={(text) => setFormData({ ...formData, unit: text })}
          placeholder="kg, liter, piece, etc."
        />

        <Button
          title="Update Product"
          onPress={handleSubmit}
          loading={saving}
          fullWidth
          style={styles.button}
        />
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
  card: { marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 16 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
  sectionSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 12 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  categoryScroll: { marginBottom: 8 },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  categoryChipSelected: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  categoryChipTextSelected: {
    color: '#059669',
  },
  imagesScroll: { marginBottom: 8 },
  imageContainer: { 
    marginRight: 12, 
    position: 'relative',
    width: 120,
    height: 120,
  },
  productImage: { 
    width: 120, 
    height: 120, 
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  addImageButton: {
    width: 120,
    height: 120,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#10B981',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
  },
  addImageIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  addImageText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  button: { marginTop: 8 },
});

export default EditProductScreen;
