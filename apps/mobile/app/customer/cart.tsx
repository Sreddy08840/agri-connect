import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Button from '../../components/Button';

export default function Cart() {
  // TODO: connect to a simple cart store
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cart</Text>
      <Text>Your cart is empty.</Text>
      <Button title="Checkout" onPress={() => {}} style={{ marginTop: 16 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 12 },
});
