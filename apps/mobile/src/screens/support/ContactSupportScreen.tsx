import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Card from '../../components/ui/Card';

const ContactSupportScreen: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Text style={styles.title}>Contact Support</Text>
        <Text style={styles.text}>Email: support@agriconnect.com</Text>
        <Text style={styles.text}>Phone: +91 1234567890</Text>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
  card: {},
  title: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 12 },
  text: { fontSize: 14, color: '#374151', marginBottom: 8 },
});

export default ContactSupportScreen;
