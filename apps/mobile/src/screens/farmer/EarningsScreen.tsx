import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function EarningsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.emptyContainer}>
        <Ionicons name="cash" size={64} color="#9ca3af" />
        <Text style={styles.emptyText}>No earnings yet</Text>
        <Text style={styles.emptySubtext}>Earnings will appear here after you complete orders</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});
