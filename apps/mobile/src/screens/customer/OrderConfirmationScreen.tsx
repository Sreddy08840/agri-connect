import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { CustomerStackParamList } from '../../navigation/types';
import Button from '../../components/ui/Button';

type Props = {
  navigation: NativeStackNavigationProp<CustomerStackParamList, 'OrderConfirmation'>;
  route: RouteProp<CustomerStackParamList, 'OrderConfirmation'>;
};

const OrderConfirmationScreen: React.FC<Props> = ({ navigation, route }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>✅</Text>
      <Text style={styles.title}>Order Confirmed!</Text>
      <Text style={styles.subtitle}>Your order has been placed successfully</Text>
      <Text style={styles.orderId}>Order #{route.params.orderId.slice(0, 8)}</Text>
      
      <Button
        title="View Orders"
        onPress={() => navigation.navigate('CustomerTabs', { screen: 'Orders' })}
        style={styles.button}
      />
      <Button
        title="Continue Shopping"
        onPress={() => navigation.navigate('CustomerTabs', { screen: 'Home' })}
        variant="outline"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center', padding: 32 },
  emoji: { fontSize: 80, marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '700', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 16 },
  orderId: { fontSize: 14, color: '#10B981', fontWeight: '600', marginBottom: 32 },
  button: { marginBottom: 12, width: '100%' },
});

export default OrderConfirmationScreen;
