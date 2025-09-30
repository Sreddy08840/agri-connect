import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

export default function FarmerHome() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Farmer Dashboard</Text>
      <Link href="/farmer/products" asChild>
        <TouchableOpacity style={styles.btn}><Text style={styles.btnText}>Manage Products</Text></TouchableOpacity>
      </Link>
      <Link href="/farmer/orders" asChild>
        <TouchableOpacity style={styles.btn}><Text style={styles.btnText}>View Orders</Text></TouchableOpacity>
      </Link>
      <Link href="/farmer/profile" asChild>
        <TouchableOpacity style={styles.btn}><Text style={styles.btnText}>Profile</Text></TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 16, color: '#1b5e20' },
  btn: { backgroundColor: '#2e7d32', padding: 14, borderRadius: 10, marginBottom: 10 },
  btnText: { color: '#fff', fontWeight: '700' },
});
