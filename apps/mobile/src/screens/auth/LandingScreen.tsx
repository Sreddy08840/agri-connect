import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import Button from '../../components/ui/Button';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Landing'>;
};

const LandingScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.logo}>🌾 Agri-Connect</Text>
        <Text style={styles.tagline}>Direct from Farm to Your Home</Text>
      </View>

      <View style={styles.imageContainer}>
        <Text style={styles.heroEmoji}>🚜</Text>
      </View>

      <View style={styles.features}>
        <FeatureItem icon="🌱" title="Fresh Produce" description="Direct from local farmers" />
        <FeatureItem icon="💰" title="Fair Prices" description="No middlemen, better prices" />
        <FeatureItem icon="🚚" title="Fast Delivery" description="Quick delivery to your doorstep" />
      </View>

      <View style={styles.actions}>
        <Text style={styles.sectionTitle}>Shop Fresh Produce</Text>
        <Button
          title="Customer Login"
          onPress={() => navigation.navigate('Login')}
          fullWidth
          style={styles.button}
        />
        <Button
          title="Create Customer Account"
          onPress={() => navigation.navigate('Register')}
          variant="outline"
          fullWidth
          style={styles.button}
        />

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Sell Your Products</Text>
        <Button
          title="Farmer Login"
          onPress={() => navigation.navigate('FarmerLogin')}
          fullWidth
          style={styles.button}
        />
        <Button
          title="Register as Farmer"
          onPress={() => navigation.navigate('FarmerRegister')}
          variant="outline"
          fullWidth
          style={styles.button}
        />
      </View>
    </ScrollView>
  );
};

const FeatureItem = ({ icon, title, description }: { icon: string; title: string; description: string }) => (
  <View style={styles.featureItem}>
    <Text style={styles.featureIcon}>{icon}</Text>
    <View style={styles.featureText}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 32,
  },
  logo: {
    fontSize: 32,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  heroEmoji: {
    fontSize: 120,
  },
  features: {
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  featureIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  actions: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 24,
  },
});

export default LandingScreen;
