import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import Card from '../../components/ui/Card';

const HelpCenterScreen: React.FC = () => {
  const helpTopics = [
    {
      icon: '🌾',
      title: 'Getting Started',
      description: 'Learn how to set up your farm profile and add products',
    },
    {
      icon: '📦',
      title: 'Managing Orders',
      description: 'How to accept, pack, ship, and complete orders',
    },
    {
      icon: '💰',
      title: 'Payments & Payouts',
      description: 'Understanding payment processing and receiving payouts',
    },
    {
      icon: '📸',
      title: 'Product Photos',
      description: 'Best practices for taking great product photos',
    },
    {
      icon: '⭐',
      title: 'Ratings & Reviews',
      description: 'How customer ratings work and improving your rating',
    },
    {
      icon: '📊',
      title: 'Analytics Dashboard',
      description: 'Understanding your business metrics and performance',
    },
    {
      icon: '🚚',
      title: 'Delivery Management',
      description: 'Tips for efficient delivery and customer satisfaction',
    },
    {
      icon: '🔔',
      title: 'Notifications',
      description: 'Managing alerts and staying updated on orders',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Help Center</Text>
        <Text style={styles.subtitle}>Find answers to common questions</Text>
      </View>

      <View style={styles.content}>
        {helpTopics.map((topic, index) => (
          <Card key={index} style={styles.topicCard}>
            <View style={styles.topicHeader}>
              <Text style={styles.topicIcon}>{topic.icon}</Text>
              <View style={styles.topicContent}>
                <Text style={styles.topicTitle}>{topic.title}</Text>
                <Text style={styles.topicDescription}>{topic.description}</Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </View>
          </Card>
        ))}

        <Card style={styles.contactCard}>
          <Text style={styles.contactTitle}>Still need help?</Text>
          <Text style={styles.contactText}>Our support team is here to assist you</Text>
          <TouchableOpacity 
            style={styles.contactButton}
            onPress={() => Linking.openURL('tel:1800-123-4567')}
          >
            <Text style={styles.contactButtonText}>📞 Call Support</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.contactButton}
            onPress={() => Linking.openURL('mailto:support@agri-connect.com')}
          >
            <Text style={styles.contactButtonText}>✉️ Email Support</Text>
          </TouchableOpacity>
        </Card>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { backgroundColor: '#10B981', padding: 24, paddingTop: 48 },
  title: { fontSize: 28, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#FFFFFF', opacity: 0.9 },
  content: { padding: 16 },
  topicCard: { marginBottom: 12 },
  topicHeader: { flexDirection: 'row', alignItems: 'center' },
  topicIcon: { fontSize: 32, marginRight: 12 },
  topicContent: { flex: 1 },
  topicTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
  topicDescription: { fontSize: 14, color: '#6B7280' },
  arrow: { fontSize: 20, color: '#10B981', marginLeft: 8 },
  contactCard: { marginTop: 16, backgroundColor: '#F0FDF4', borderColor: '#10B981', borderWidth: 1 },
  contactTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 },
  contactText: { fontSize: 14, color: '#6B7280', marginBottom: 16 },
  contactButton: { 
    backgroundColor: '#10B981', 
    padding: 12, 
    borderRadius: 8, 
    alignItems: 'center',
    marginBottom: 8 
  },
  contactButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
});

export default HelpCenterScreen;
