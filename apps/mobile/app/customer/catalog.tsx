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
        keyExtractor={(item: any) => String(item.id || Math.random())}
        renderItem={({ item }) => (
          <ProductCard
            product={{ 
              id: String(item.id), 
              name: item.name || 'Product', 
              price: item.price || 0, 
              imageUrl: item.imageUrl, 
              farmerName: item.farmerName || 'Farmer' 
            }}
            onPress={() => {
              if (item.id) {
                router.push(`/customer/product/${item.id}`);
              }
            }}
          />
        )}
      />
    </View>
  );
}
