import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { loginPassword, forgotPassword, resetPassword } from '../services/auth';
import Loader from '../components/Loader';
// Picker will be added later - using TouchableOpacity for now

// Country dial codes
const COUNTRY_CODES = [
  { code: 'IN', name: 'India', dial: '+91', example: '9876543210' },
  { code: 'US', name: 'United States', dial: '+1', example: '4155551234' },
  { code: 'GB', name: 'United Kingdom', dial: '+44', example: '7911123456' },
  { code: 'AE', name: 'UAE', dial: '+971', example: '501234567' },
  { code: 'SG', name: 'Singapore', dial: '+65', example: '81234567' },
  { code: 'AU', name: 'Australia', dial: '+61', example: '412345678' },
  { code: 'CA', name: 'Canada', dial: '+1', example: '6475551234' },
];

const E164_REGEX = /^\+[1-9]\d{7,14}$/;

function toE164(raw: string, countryCode: string): string | null {
  const input = (raw || '').replace(/\s|-/g, '').trim();
  if (!input) return null;
  if (input.startsWith('+')) {
    return E164_REGEX.test(input) ? input : null;
  }
  const country = COUNTRY_CODES.find(c => c.code === countryCode);
  const dial = country?.dial || '+91';
  const digits = input.replace(/\D/g, '');
  const candidate = `${dial}${digits}`;
  return E164_REGEX.test(candidate) ? candidate : null;
}

export default function LoginScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('IN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);

  const onLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const e164Phone = toE164(phone, country);
      if (!e164Phone) {
        setError('Please enter a valid phone number');
        setLoading(false);
        return;
      }
      const res = await loginPassword({ phone: e164Phone, password });
      // Navigate to OTP verify screen with pending session ID and phone
      router.push({ pathname: '/auth/otp', params: { pendingSessionId: res.pendingSessionId, phone: e164Phone } });
    } catch (e: any) {
      setError(e?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const goSignup = () => router.push('/signup');

  const goForgotPassword = () => {
    setShowForgotPassword(true);
    setError(null);
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setPendingSessionId(null);
  };

  const cancelForgotPassword = () => {
    setShowForgotPassword(false);
    setError(null);
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setPendingSessionId(null);
  };

  const requestPasswordReset = async () => {
    setLoading(true);
    setError(null);
    try {
      const e164Phone = toE164(phone, country);
      if (!e164Phone) {
        setError('Please enter a valid phone number');
        setLoading(false);
        return;
      }
      const res = await forgotPassword({ phone: e164Phone });
      setPendingSessionId(res.pendingSessionId);
      setError('OTP sent to your phone. Please enter it below.');
    } catch (e: any) {
      setError(e?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const resetPasswordSubmit = async () => {
    if (!pendingSessionId) {
      setError('Please request OTP first');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await resetPassword({
        pendingSessionId,
        code: otp,
        newPassword,
      });
      setError('Password reset successful! You can now login with your new password.');
      setTimeout(() => {
        setShowForgotPassword(false);
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setPendingSessionId(null);
      }, 2000);
    } catch (e: any) {
      setError(e?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const selectedCountry = COUNTRY_CODES.find(c => c.code === country) || COUNTRY_CODES[0];

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
          <Text style={styles.title}>AgriConnect</Text>
          <Text style={styles.subtitle}>
            {showForgotPassword ? 'Reset Password' : 'Login to Your Account'}
          </Text>

          {showForgotPassword ? (
            <>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <View style={styles.phoneContainer}>
                  <TouchableOpacity
                    style={styles.countryButton}
                    onPress={() => {
                      const idx = COUNTRY_CODES.findIndex(c => c.code === country);
                      const nextIdx = (idx + 1) % COUNTRY_CODES.length;
                      setCountry(COUNTRY_CODES[nextIdx].code);
                    }}
                  >
                    <Text style={styles.countryButtonText}>{selectedCountry.dial}</Text>
                  </TouchableOpacity>
                  <TextInput
                    placeholder={selectedCountry.example}
                    autoCapitalize="none"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                    style={styles.phoneInput}
                  />
                </View>
              </View>

              {pendingSessionId ? (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>OTP</Text>
                    <TextInput
                      placeholder="Enter 6-digit OTP"
                      keyboardType="number-pad"
                      maxLength={6}
                      value={otp}
                      onChangeText={setOtp}
                      style={styles.input}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>New Password</Text>
                    <TextInput
                      placeholder="Enter new password (min 6 chars)"
                      secureTextEntry
                      value={newPassword}
                      onChangeText={setNewPassword}
                      style={styles.input}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Confirm Password</Text>
                    <TextInput
                      placeholder="Confirm new password"
                      secureTextEntry
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      style={styles.input}
                    />
                  </View>

                  <TouchableOpacity style={styles.button} onPress={resetPasswordSubmit} disabled={loading}>
                    <Text style={styles.buttonText}>{loading ? 'Resetting...' : 'Reset Password'}</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity style={styles.button} onPress={requestPasswordReset} disabled={loading}>
                  <Text style={styles.buttonText}>{loading ? 'Sending OTP...' : 'Send OTP'}</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={cancelForgotPassword} style={styles.cancelButton}>
                <Text style={styles.cancelText}>Back to Login</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <View style={styles.phoneContainer}>
                  <TouchableOpacity
                    style={styles.countryButton}
                    onPress={() => {
                      const idx = COUNTRY_CODES.findIndex(c => c.code === country);
                      const nextIdx = (idx + 1) % COUNTRY_CODES.length;
                      setCountry(COUNTRY_CODES[nextIdx].code);
                    }}
                  >
                    <Text style={styles.countryButtonText}>{selectedCountry.dial}</Text>
                  </TouchableOpacity>
                  <TextInput
                    placeholder={selectedCountry.example}
                    autoCapitalize="none"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                    style={styles.phoneInput}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  placeholder="Enter your password"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  style={styles.input}
                />
              </View>

              <TouchableOpacity onPress={goForgotPassword} style={styles.forgotButton}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.button} onPress={onLogin} disabled={loading}>
                <Text style={styles.buttonText}>{loading ? 'Sending OTP...' : 'Login'}</Text>
              </TouchableOpacity>

              <View style={styles.signupContainer}>
                <Text style={styles.signupText}>Don't have an account? </Text>
                <TouchableOpacity onPress={goSignup}>
                  <Text style={styles.link}>Sign up here</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Loader visible={loading} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#f9fafb' },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  container: { flex: 1, padding: 24, justifyContent: 'center', maxWidth: 400, width: '100%', alignSelf: 'center' },
  title: { fontSize: 32, fontWeight: '800', marginBottom: 8, textAlign: 'center', color: '#1b5e20' },
  subtitle: { fontSize: 16, color: '#6b7280', textAlign: 'center', marginBottom: 32 },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  phoneContainer: { flexDirection: 'row', gap: 8 },
  countryButton: { 
    borderWidth: 1, 
    borderColor: '#e5e7eb', 
    borderRadius: 8, 
    backgroundColor: '#fff',
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  countryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  phoneInput: { 
    flex: 1,
    borderWidth: 1, 
    borderColor: '#e5e7eb', 
    borderRadius: 8, 
    padding: 12, 
    backgroundColor: '#fff',
    fontSize: 16,
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#e5e7eb', 
    borderRadius: 8, 
    padding: 12, 
    backgroundColor: '#fff',
    fontSize: 16,
  },
  forgotButton: { alignSelf: 'flex-end', marginBottom: 16 },
  forgotText: { color: '#2e7d32', fontSize: 14, fontWeight: '600' },
  button: { 
    backgroundColor: '#2e7d32', 
    padding: 16, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  signupContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 16, alignItems: 'center' },
  signupText: { color: '#6b7280', fontSize: 14 },
  link: { color: '#2e7d32', fontSize: 14, fontWeight: '600' },
  error: { color: '#b91c1c', marginBottom: 12, textAlign: 'center', fontSize: 14, backgroundColor: '#fee2e2', padding: 12, borderRadius: 8 },
  cancelButton: { alignSelf: 'center', marginTop: 16 },
  cancelText: { color: '#6b7280', fontSize: 14, fontWeight: '600' },
});
