import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Card from '../../components/ui/Card';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const FAQScreen: React.FC = () => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      category: 'Getting Started',
      question: 'How do I add my first product?',
      answer: 'Go to the Products tab, tap "+ Add Product", fill in the product details including name, price, stock, and upload photos. Your product will be reviewed by admin before going live.',
    },
    {
      category: 'Getting Started',
      question: 'Why is my product pending review?',
      answer: 'All new products and edited products must be approved by our admin team to ensure quality and accuracy. This usually takes 24-48 hours.',
    },
    {
      category: 'Orders',
      question: 'How do I accept an order?',
      answer: 'When you receive a new order, go to Orders tab, tap on the order, and click "Accept Order". You can then proceed to pack and ship it.',
    },
    {
      category: 'Orders',
      question: 'What are the order statuses?',
      answer: 'Orders flow through: PLACED → ACCEPTED → PACKED → SHIPPED → DELIVERED. You update the status at each stage.',
    },
    {
      category: 'Orders',
      question: 'Can I cancel an order?',
      answer: 'Yes, you can cancel orders that are in PLACED or ACCEPTED status. Once packed or shipped, cancellation requires contacting support.',
    },
    {
      category: 'Products',
      question: 'How many product images can I add?',
      answer: 'You can add up to 5 images per product. High-quality photos help customers make better purchasing decisions.',
    },
    {
      category: 'Products',
      question: 'Can I edit my products?',
      answer: 'Yes! Tap the Edit button on any product. Note: If the product was APPROVED, editing will move it back to PENDING_REVIEW for re-approval.',
    },
    {
      category: 'Payments',
      question: 'When do I receive payment?',
      answer: 'Payments are processed after the order is marked as DELIVERED. Payouts are typically processed within 3-5 business days.',
    },
    {
      category: 'Payments',
      question: 'How is my revenue calculated?',
      answer: 'Your revenue includes all DELIVERED orders. Pending and cancelled orders are not included in revenue calculations.',
    },
    {
      category: 'Account',
      question: 'How do I update my profile?',
      answer: 'Go to Profile tab, tap the "Edit" button next to Personal Information, update your details, and save.',
    },
    {
      category: 'Account',
      question: 'How do I change my profile photo?',
      answer: 'Tap on your profile photo, choose "Take Photo" or "Choose from Gallery", and upload a new image.',
    },
    {
      category: 'Technical',
      question: 'What image formats are supported?',
      answer: 'We support JPEG, PNG, GIF, and WebP formats. Maximum file size is 10MB per image.',
    },
  ];

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const groupedFAQs = faqs.reduce((acc, faq, index) => {
    if (!acc[faq.category]) {
      acc[faq.category] = [];
    }
    acc[faq.category].push({ ...faq, index });
    return acc;
  }, {} as Record<string, (FAQItem & { index: number })[]>);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Frequently Asked Questions</Text>
        <Text style={styles.subtitle}>Quick answers to common questions</Text>
      </View>

      <View style={styles.content}>
        {Object.entries(groupedFAQs).map(([category, items]) => (
          <View key={category} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category}</Text>
            {items.map((faq) => (
              <Card key={faq.index} style={styles.faqCard}>
                <TouchableOpacity onPress={() => toggleExpand(faq.index)}>
                  <View style={styles.questionRow}>
                    <Text style={styles.question}>{faq.question}</Text>
                    <Text style={styles.expandIcon}>
                      {expandedIndex === faq.index ? '−' : '+'}
                    </Text>
                  </View>
                  {expandedIndex === faq.index && (
                    <Text style={styles.answer}>{faq.answer}</Text>
                  )}
                </TouchableOpacity>
              </Card>
            ))}
          </View>
        ))}
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
  categorySection: { marginBottom: 24 },
  categoryTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#10B981', 
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  faqCard: { marginBottom: 8 },
  questionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  question: { fontSize: 16, fontWeight: '600', color: '#111827', flex: 1, paddingRight: 12 },
  expandIcon: { fontSize: 24, fontWeight: '700', color: '#10B981' },
  answer: { 
    fontSize: 14, 
    color: '#6B7280', 
    marginTop: 12, 
    paddingTop: 12, 
    borderTopWidth: 1, 
    borderTopColor: '#E5E7EB',
    lineHeight: 20,
  },
});

export default FAQScreen;
