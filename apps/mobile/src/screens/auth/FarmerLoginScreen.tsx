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
  navigation: NativeStackNavigationProp<AuthStackParamList, 'FarmerLogin'>;
};

const FarmerLoginScreen: React.FC<Props> = ({ navigation }) => {
  const [useEmail, setUseEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const { setUser } = useAuthStore();

  const handleLogin = async () => {
    setErrors({});
    setLoading(true);

    try {
      const payload: any = {
        password,
        role: 'FARMER',
      };
      
      if (useEmail) {
        payload.email = email;
      } else {
        const fullPhone = countryCode + phone;
        payload.phone = fullPhone;
      }
      
      console.log('Step 1: Verifying farmer password and sending OTP');
      
      const response = await api.post('/auth/login-password', payload);

      console.log('Password verified! OTP sent. Session:', response.data.pendingSessionId);
      
      // Navigate to OTP verification
      navigation.navigate('OTPVerification', {
        pendingSessionId: response.data.pendingSessionId,
        email: useEmail ? email : undefined,
        phone: useEmail ? undefined : (countryCode + phone),
        isLogin: true,
      });
      
      const medium = useEmail ? 'email' : 'phone';
      Alert.alert('OTP Sent', `Please enter the 6-digit OTP sent to your ${medium}`);
    } catch (error: any) {
      console.error('Login error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let message = 'Login failed. Please try again.';
      
      if (error.response?.data?.error) {
        message = error.response.data.error;
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.message) {
        message = error.message;
      }
      
      Alert.alert('Login Error', message);
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
        <Text style={styles.title}>Farmer Login</Text>
        <Text style={styles.subtitle}>Sign in to manage your products and orders</Text>
      </View>

      <View style={styles.form}>
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
              value={email}
              onChangeText={setEmail}
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
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                error={errors.phone}
                style={styles.phoneInput}
              />
            </View>
          </>
        )}

        <Input
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          error={errors.password}
        />

        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.forgotPassword}>Forgot Password?</Text>
        </TouchableOpacity>

        <Button
          title="Login"
          onPress={handleLogin}
          loading={loading}
          disabled={(useEmail && !email) || (!useEmail && !phone) || !password}
          fullWidth
          style={styles.loginButton}
        />

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('FarmerRegister')}>
          <Text style={styles.signupText}>
            Don't have an account? <Text style={styles.signupLink}>Sign Up</Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.switchRole}>
          <Text style={styles.switchRoleText}>Login as Customer →</Text>
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
  forgotPassword: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 24,
  },
  loginButton: {
    marginBottom: 24,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#6B7280',
    fontSize: 14,
  },
  signupText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
  },
  signupLink: {
    color: '#10B981',
    fontWeight: '600',
  },
  switchRole: {
    marginTop: 16,
    padding: 12,
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

export default FarmerLoginScreen;
