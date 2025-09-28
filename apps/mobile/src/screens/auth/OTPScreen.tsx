import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import Toast from 'react-native-toast-message';

export default function OTPScreen({ navigation, route }: any) {
  const { phone } = route.params;
  const { login } = useAuth();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const verifyOTPMutation = useMutation(
    (data: { phone: string; code: string; name?: string }) => 
      api.post('/auth/otp/verify', data),
    {
      onSuccess: async (response) => {
        const { accessToken, refreshToken, user } = response.data;
        await login(accessToken, refreshToken, user);
        Toast.show({
          type: 'success',
          text1: 'Welcome!',
          text2: `Hello ${user.name}`,
        });
      },
      onError: (error: any) => {
        if (error.response?.data?.error?.includes('Name is required')) {
          setIsNewUser(true);
          setName('');
        } else {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: error.response?.data?.error || 'Failed to verify OTP',
          });
        }
      },
    }
  );

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleVerifyOTP = () => {
    if (!code.trim()) {
      Alert.alert('Error', 'Please enter the OTP code');
      return;
    }

    if (code.length !== 6) {
      Alert.alert('Error', 'Please enter a 6-digit OTP code');
      return;
    }

    if (isNewUser && !name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    verifyOTPMutation.mutate({
      phone,
      code,
      name: isNewUser ? name : undefined,
    });
  };

  const handleResendOTP = () => {
    navigation.goBack();
  };

  return (
    <LinearGradient
      colors={['#16a34a', '#22c55e']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Ionicons name="shield-checkmark" size={60} color="#ffffff" />
            <Text style={styles.title}>Verify OTP</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to{'\n'}{phone}
            </Text>
          </View>

          <View style={styles.form}>
            {isNewUser && (
              <>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="person" size={20} color="#16a34a" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>
              </>
            )}

            <Text style={styles.label}>OTP Code</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="key" size={20} color="#16a34a" style={styles.inputIcon} />
              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder="123456"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
                textAlign="center"
                fontSize={24}
                letterSpacing={4}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, verifyOTPMutation.isLoading && styles.buttonDisabled]}
              onPress={handleVerifyOTP}
              disabled={verifyOTPMutation.isLoading}
            >
              <Text style={styles.buttonText}>
                {verifyOTPMutation.isLoading ? 'Verifying...' : 'Verify OTP'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.resendButton} onPress={handleResendOTP}>
              <Text style={styles.resendText}>Resend OTP</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 24,
    backgroundColor: '#f9fafb',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    color: '#374151',
  },
  button: {
    backgroundColor: '#16a34a',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  resendText: {
    color: '#16a34a',
    fontSize: 16,
    fontWeight: '600',
  },
});
