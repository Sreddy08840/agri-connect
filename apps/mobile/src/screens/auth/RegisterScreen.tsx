import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'>;
};

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const { setUser } = useAuthStore();

  const handleRegister = async () => {
    setErrors({});

    // Validation
    const newErrors: any = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.phone && !formData.email) newErrors.phone = 'Email or phone is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      console.log('Step 1: Creating account and sending OTP');
      const payload: any = {
        name: formData.name,
        password: formData.password,
        role: 'CUSTOMER',
      };
      
      if (formData.email) payload.email = formData.email;
      if (formData.phone) {
        const fullPhone = formData.phone.startsWith('+') ? formData.phone : `+91${formData.phone}`;
        payload.phone = fullPhone;
      }
      
      const response = await api.post('/auth/register-password', payload);

      console.log('Account created! OTP sent. Session:', response.data.pendingSessionId);
      
      const target = formData.email ? formData.email : payload.phone;
      // Navigate to OTP verification
      navigation.navigate('OTPVerification', {
        pendingSessionId: response.data.pendingSessionId,
        email: formData.email || undefined,
        phone: payload.phone || undefined,
        isLogin: false,
      });
      
      const medium = formData.email ? 'email' : 'phone';
      Alert.alert('OTP Sent', `Please check your ${medium} for the 6-digit OTP code`);
    } catch (error: any) {
      console.error('Registration error details:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error message:', error.message);
      
      let message = 'Registration failed. Please try again.';
      
      if (error.message === 'Network Error' || error.code === 'ECONNABORTED') {
        message = 'Cannot connect to server. Please check:\n1. Backend is running on port 8080\n2. Phone and computer are on same WiFi\n3. API URL: ' + api.defaults.baseURL;
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }
      
      Alert.alert('Registration Error', message);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.logo}>🌾 Agri-Connect</Text>
        <Text style={styles.title}>Create Customer Account</Text>
        <Text style={styles.subtitle}>Join us to shop fresh produce</Text>
      </View>

      <View style={styles.form}>
        <Input
          label="Full Name"
          placeholder="Enter your full name"
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          error={errors.name}
        />

        <Text style={styles.inputLabel}>Phone Number</Text>
        <View style={styles.phoneContainer}>
          <View style={styles.countryCode}>
            <Text style={styles.countryCodeText}>+91 🇮🇳</Text>
          </View>
          <Input
            placeholder="Enter phone number"
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            keyboardType="phone-pad"
            error={errors.phone}
            style={styles.phoneInput}
          />
        </View>

        <Input
          label="Email Address"
          placeholder="your.email@example.com"
          value={formData.email}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
        />
        
        <Text style={styles.orText}>OR</Text>

        <Input
          label="Password"
          placeholder="Create a password"
          value={formData.password}
          onChangeText={(text) => setFormData({ ...formData, password: text })}
          secureTextEntry
          error={errors.password}
        />

        <Input
          label="Confirm Password"
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
          secureTextEntry
          error={errors.confirmPassword}
        />

        <Button
          title="Create Account"
          onPress={handleRegister}
          loading={loading}
          fullWidth
          style={styles.registerButton}
        />

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginText}>
            Already have an account? <Text style={styles.loginLink}>Login</Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('FarmerRegister')} style={styles.switchRole}>
          <Text style={styles.switchRoleText}>Register as Farmer →</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

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
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  countryCode: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 16,
    marginRight: 8,
    justifyContent: 'center',
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  registerButton: {
    marginBottom: 24,
  },
  orText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
    marginVertical: 8,
  },
  loginText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
  },
  loginLink: {
    color: '#10B981',
    fontWeight: '600',
  },
  switchRole: {
    marginTop: 16,
    alignItems: 'center',
  },
  switchRoleText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default RegisterScreen;
