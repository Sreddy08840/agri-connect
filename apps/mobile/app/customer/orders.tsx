import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getOrders } from '../../services/customer';

export default function CustomerOrders() {
  const { data = [], isLoading } = useQuery({ queryKey: ['customer-orders'], queryFn: getOrders });
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <FlatList
        data={data}
        refreshing={isLoading}
        keyExtractor={(o: any) => String(o.id)}
        renderItem={({ item }) => (
          <View style={{ padding: 12, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, marginBottom: 10 }}>
            <Text style={{ fontWeight: '700' }}>Order #{item.id}</Text>
            <Text>Status: {item.status}</Text>
          </View>
        )}
      />
    </View>
  );
}
