import React from 'react';
import { View, FlatList } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyProducts, deleteProduct } from '../../services/farmer';
import ProductCard from '../../components/ProductCard';
import Button from '../../components/Button';
import { Link } from 'expo-router';

export default function FarmerProducts() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ['farmer-products'], queryFn: getMyProducts });
  const del = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['farmer-products'] }),
  });

  return (
    <View style={{ flex: 1, padding: 12 }}>
      <Link href="/farmer/product-add" asChild>
        <Button title="Add Product" onPress={() => {}} />
      </Link>
      <FlatList
        data={data}
        keyExtractor={(item: any) => String(item.id)}
        refreshing={isLoading}
        renderItem={({ item }) => (
          <ProductCard
            product={{ id: String(item.id), name: item.name, price: item.price, imageUrl: item.imageUrl }}
            action={<Button title="Delete" variant="danger" onPress={() => del.mutate(String(item.id))} />}
          />
        )}
      />
    </View>
  );
}
