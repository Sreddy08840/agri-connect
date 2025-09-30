import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CustomerHome() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Customer Dashboard</Text>
      <Text>Use the tabs to browse catalog, cart, and orders.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 16, color: '#1b5e20' },
});
