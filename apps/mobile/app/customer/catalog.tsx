import React from 'react';
import { View, FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getCatalog } from '../../services/customer';
import ProductCard from '../../components/ProductCard';
import { useRouter } from 'expo-router';

export default function Catalog() {
  const router = useRouter();
  const { data = [], isLoading } = useQuery({ queryKey: ['catalog'], queryFn: getCatalog });
  return (
    <View style={{ flex: 1, padding: 12 }}>
      <FlatList
        data={data}
        refreshing={isLoading}
        keyExtractor={(item: any) => String(item.id)}
        renderItem={({ item }) => (
          <ProductCard
            product={{ id: String(item.id), name: item.name, price: item.price, imageUrl: item.imageUrl, farmerName: item.farmerName }}
            onPress={() => router.push(`/customer/product/${item.id}`)}
          />
        )}
      />
    </View>
  );
}
