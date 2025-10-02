import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { verify2FA } from '../../services/auth';
import { setToken, setUserRole } from '../../utils/storage';
import { api } from '../../services/api';
import Loader from '../../components/Loader';

export default function OTPVerifyScreen() {
  const router = useRouter();
  const { pendingSessionId, phone } = useLocalSearchParams<{ pendingSessionId: string; phone?: string }>();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Cooldown timer effect
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const onVerify = async () => {
    if (!pendingSessionId) {
      setError('Missing session. Please login again.');
      return;
    }
    if (code.length !== 6) {
      setError('Please enter a valid 6-digit OTP code.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await verify2FA({ pendingSessionId: String(pendingSessionId), code });
      await setToken(res.accessToken);
      const role = (res.user.role === 'FARMER' ? 'farmer' : 'customer') as 'farmer' | 'customer';
      await setUserRole(role);
      router.replace(role === 'farmer' ? '/farmer' : '/customer');
    } catch (e: any) {
      setError(e?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const onResendOTP = async () => {
    if (!phone) {
      setError('Phone number not available. Please login again.');
      return;
    }
    setResending(true);
    setError(null);
    try {
      await api.post('/auth/otp/request', { phone });
      setCooldown(30);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  const handleCodeChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '');
    setCode(numericText);
    setError(null);
  };

  const goBack = () => {
    router.back();
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.wrapper}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <Text style={styles.title}>Verify OTP</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to {phone ? phone : 'your phone'}
          </Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="000000"
              keyboardType="number-pad"
              maxLength={6}
              value={code}
              onChangeText={handleCodeChange}
              style={styles.input}
              autoFocus
              textAlign="center"
            />
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.error}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity 
            style={[styles.button, (loading || code.length !== 6) && styles.buttonDisabled]} 
            onPress={onVerify} 
            disabled={loading || code.length !== 6}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </Text>
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            <TouchableOpacity 
              onPress={onResendOTP}
              disabled={cooldown > 0 || resending}
              style={styles.resendButton}
            >
              <Text style={[styles.resendText, (cooldown > 0 || resending) && styles.resendTextDisabled]}>
                {cooldown > 0 ? `Resend OTP in ${cooldown}s` : resending ? 'Sending...' : 'Resend OTP'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.backButton}
            onPress={goBack}
            disabled={loading}
          >
            <Text style={styles.backButtonText}>Back to Login</Text>
          </TouchableOpacity>

          <Loader visible={loading || resending} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#f9fafb' },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  container: { 
    flex: 1, 
    padding: 24, 
    justifyContent: 'center',
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  title: { 
    fontSize: 28, 
    fontWeight: '800', 
    marginBottom: 8, 
    textAlign: 'center', 
    color: '#1b5e20' 
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: { 
    borderWidth: 2, 
    borderColor: '#2e7d32', 
    borderRadius: 12, 
    padding: 16, 
    backgroundColor: '#fff',
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: 8,
  },
  button: { 
    backgroundColor: '#2e7d32', 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
    opacity: 0.6,
  },
  buttonText: { 
    color: '#fff', 
    fontWeight: '700',
    fontSize: 16,
  },
  resendContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  resendButton: {
    padding: 12,
  },
  resendText: {
    color: '#2e7d32',
    fontWeight: '600',
    fontSize: 14,
  },
  resendTextDisabled: {
    color: '#9ca3af',
  },
  backButton: {
    marginTop: 8,
    padding: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#6b7280',
    fontWeight: '600',
    fontSize: 14,
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  error: { 
    color: '#b91c1c', 
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
});
