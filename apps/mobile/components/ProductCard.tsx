import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';

export type Product = {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  farmerName?: string;
};

type Props = {
  product: Product;
  onPress?: () => void;
  action?: React.ReactNode;
};

export default function ProductCard({ product, onPress, action }: Props) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.card}>
      {product.imageUrl ? (
        <Image source={{ uri: product.imageUrl }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.placeholder]} />
      )}
      <View style={styles.info}>
        <Text numberOfLines={1} style={styles.name}>{product.name}</Text>
        {product.farmerName ? (
          <Text numberOfLines={1} style={styles.sub}>by {product.farmerName}</Text>
        ) : null}
        <View style={styles.row}>
          <Text style={styles.price}>₹{product.price.toFixed(2)}</Text>
          <View style={{ flex: 1 }} />
          {action}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 12 },
  image: { width: '100%', height: 160, backgroundColor: '#f3f4f6' },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  info: { padding: 12 },
  name: { fontWeight: '700', fontSize: 16, color: '#111827' },
  sub: { color: '#6b7280', marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  price: { fontWeight: '800', color: '#1b5e20' },
});
