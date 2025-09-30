import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getFarmerOrders } from '../../services/farmer';

export default function FarmerOrders() {
  const { data = [], isLoading } = useQuery({ queryKey: ['farmer-orders'], queryFn: getFarmerOrders });
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <FlatList
        data={data}
        keyExtractor={(o: any) => String(o.id)}
        refreshing={isLoading}
        renderItem={({ item }) => (
          <View style={{ padding: 12, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, marginBottom: 10 }}>
            <Text style={{ fontWeight: '700' }}>Order #{item.id}</Text>
            <Text>Customer: {item.customerName}</Text>
            <Text>Status: {item.status}</Text>
          </View>
        )}
      />
    </View>
  );
}
