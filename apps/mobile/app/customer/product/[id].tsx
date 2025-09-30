import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getProduct } from '../../../services/customer';
import Button from '../../../components/Button';

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading } = useQuery({ queryKey: ['product', id], queryFn: () => getProduct(String(id)) });
  if (isLoading || !data) return <View style={styles.container}><Text>Loading...</Text></View>;
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{data.name}</Text>
      <Text style={styles.price}>${data.price?.toFixed?.(2) ?? data.price}</Text>
      <Text style={{ marginVertical: 12 }}>{data.description}</Text>
      <Button title="Add to cart" onPress={() => { /* TODO: add to cart store */ }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: '800' },
  price: { fontSize: 18, fontWeight: '700', color: '#1b5e20', marginTop: 4 },
});
