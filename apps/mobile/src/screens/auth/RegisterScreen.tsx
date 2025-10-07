import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
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
  const [useEmail, setUseEmail] = useState(true);
  const [countryCode, setCountryCode] = useState('+91');
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
        const fullPhone = countryCode + formData.phone;
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

        {useEmail ? (
          <>
            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TouchableOpacity onPress={() => setUseEmail(false)}>
                <Text style={styles.switchLink}>Use Phone Number</Text>
              </TouchableOpacity>
            </View>
            <Input
              placeholder="your.email@example.com"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />
          </>
        ) : (
          <>
            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TouchableOpacity onPress={() => setUseEmail(true)}>
                <Text style={styles.switchLink}>Use Email-ID</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.phoneContainer}>
              <View style={styles.countryCodePicker}>
                <Picker
                  selectedValue={countryCode}
                  onValueChange={(value) => setCountryCode(value)}
                  style={styles.picker}
                >
                  <Picker.Item label="🇮🇳 +91" value="+91" />
                  <Picker.Item label="🇺🇸 +1" value="+1" />
                  <Picker.Item label="🇬🇧 +44" value="+44" />
                  <Picker.Item label="🇦🇪 +971" value="+971" />
                  <Picker.Item label="🇸🇬 +65" value="+65" />
                  <Picker.Item label="🇦🇺 +61" value="+61" />
                  <Picker.Item label="🇨🇳 +86" value="+86" />
                  <Picker.Item label="🇯🇵 +81" value="+81" />
                  <Picker.Item label="🇰🇷 +82" value="+82" />
                  <Picker.Item label="🇩🇪 +49" value="+49" />
                  <Picker.Item label="🇫🇷 +33" value="+33" />
                  <Picker.Item label="🇮🇹 +39" value="+39" />
                  <Picker.Item label="🇪🇸 +34" value="+34" />
                  <Picker.Item label="🇷🇺 +7" value="+7" />
                  <Picker.Item label="🇧🇷 +55" value="+55" />
                  <Picker.Item label="🇿🇦 +27" value="+27" />
                  <Picker.Item label="🇳🇬 +234" value="+234" />
                  <Picker.Item label="🇪🇬 +20" value="+20" />
                </Picker>
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
          </>
        )}

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
  countryCodePicker: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    marginRight: 8,
    justifyContent: 'center',
    width: 120,
    height: 56,
  },
  picker: {
    width: '100%',
    height: '100%',
  },
  phoneInput: {
    flex: 1,
  },
  registerButton: {
    marginBottom: 24,
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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  switchLink: {
    color: '#3B82F6',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default RegisterScreen;
