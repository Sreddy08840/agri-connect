import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Card from '../../components/ui/Card';

const PrivacyPolicyScreen: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.text}>
          We respect your privacy and are committed to protecting your personal data.
        </Text>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
  card: {},
  title: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 12 },
  text: { fontSize: 14, color: '#374151', lineHeight: 20 },
});

export default PrivacyPolicyScreen;
