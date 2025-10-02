import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function CustomerHome() {
  const router = useRouter();

  const menuItems = [
    { icon: 'shopping-bag', title: 'Browse Products', subtitle: 'Explore fresh produce', route: '/customer/catalog' },
    { icon: 'shopping-cart', title: 'My Cart', subtitle: 'View your cart items', route: '/customer/cart' },
    { icon: 'receipt', title: 'My Orders', subtitle: 'Track your orders', route: '/customer/orders' },
    { icon: 'person', title: 'Profile', subtitle: 'Edit your profile', route: '/customer/profile' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome Back!</Text>
        <Text style={styles.subtitle}>Explore fresh products from local farmers</Text>
      </View>

      <View style={styles.menuGrid}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuCard}
            onPress={() => router.push(item.route as any)}
          >
            <MaterialIcons name={item.icon as any} size={40} color="#2e7d32" />
            <Text style={styles.menuTitle}>{item.title}</Text>
            <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.infoCard}>
        <MaterialIcons name="info" size={24} color="#1b5e20" />
        <View style={styles.infoText}>
          <Text style={styles.infoTitle}>Getting Started</Text>
          <Text style={styles.infoDescription}>
            Use the tabs below to navigate: Browse products, manage your cart, track orders, and edit your profile.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    backgroundColor: '#2e7d32',
    padding: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  title: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#e8f5e9',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
    marginTop: -20,
  },
  menuCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 12,
    textAlign: 'center',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#e8f5e9',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2e7d32',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1b5e20',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    color: '#2e7d32',
    lineHeight: 20,
  },
});
