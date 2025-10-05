import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Card from '../../components/ui/Card';

const FAQScreen: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Text style={styles.question}>How do I place an order?</Text>
        <Text style={styles.answer}>Browse products, add to cart, and checkout with delivery address.</Text>
      </Card>
      <Card style={styles.card}>
        <Text style={styles.question}>How can I track my order?</Text>
        <Text style={styles.answer}>Go to Orders tab to view all your orders and their status.</Text>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
  card: { marginBottom: 12 },
  question: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 8 },
  answer: { fontSize: 14, color: '#6B7280' },
});

export default FAQScreen;
