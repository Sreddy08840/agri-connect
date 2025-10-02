import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { signupFarmer } from '../../services/auth';
import { useRouter } from 'expo-router';
import Loader from '../../components/Loader';

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

function validatePassword(password: string): string[] {
  const errors: string[] = [];
  if (password.length < 8) errors.push('At least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('One lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('One number');
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('One special character');
  return errors;
}

export default function FarmerSignup() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('IN');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [farmName, setFarmName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    setPasswordErrors(validatePassword(text));
  };

  const onSubmit = async () => {
    setError('');
    
    // Validation
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    
    const e164Phone = toE164(phone, country);
    if (!e164Phone) {
      setError('Please enter a valid phone number');
      return;
    }
    
    const pwdErrors = validatePassword(password);
    if (pwdErrors.length > 0) {
      setError('Password does not meet requirements');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    try {
      const res = await signupFarmer({ name, phone: e164Phone, password, farmName });
      router.push({ pathname: '/auth/otp', params: { pendingSessionId: res.pendingSessionId, phone: e164Phone } });
    } catch (e: any) {
      setError(e?.message || 'Signup failed');
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
          <Text style={styles.title}>Create Farmer Account</Text>
          <Text style={styles.subtitle}>Join AgriConnect as a Farmer</Text>
          
          <Input label="Full Name" value={name} onChangeText={setName} placeholder="Enter your name" />
          
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
              <Input 
                value={phone} 
                onChangeText={setPhone} 
                placeholder={selectedCountry.example}
                keyboardType="phone-pad"
                style={styles.phoneInput}
              />
            </View>
          </View>
          
          <Input 
            label="Password" 
            value={password} 
            onChangeText={handlePasswordChange} 
            secureTextEntry 
            placeholder="Create a strong password"
          />
          
          {password.length > 0 && passwordErrors.length > 0 && (
            <View style={styles.passwordHints}>
              <Text style={styles.hintTitle}>Password must have:</Text>
              {passwordErrors.map((err, idx) => (
                <Text key={idx} style={styles.hintText}>• {err}</Text>
              ))}
            </View>
          )}
          
          <Input 
            label="Confirm Password" 
            value={confirmPassword} 
            onChangeText={setConfirmPassword} 
            secureTextEntry 
            placeholder="Re-enter your password"
          />
          
          <Input 
            label="Farm/Business Name (Optional)" 
            value={farmName} 
            onChangeText={setFarmName} 
            placeholder="Enter your farm name"
          />
          
          {error ? <Text style={styles.error}>{error}</Text> : null}
          
          <Button 
            title={loading ? 'Creating Account...' : 'Create Farmer Account'} 
            onPress={onSubmit} 
            disabled={loading}
            style={styles.button}
          />
          
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.link}>Login here</Text>
            </TouchableOpacity>
          </View>
          
          <Loader visible={loading} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#f9fafb' },
  scrollContent: { flexGrow: 1 },
  container: { flex: 1, padding: 24, paddingTop: 60, maxWidth: 400, width: '100%', alignSelf: 'center' },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 8, textAlign: 'center', color: '#1b5e20' },
  subtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 24 },
  formGroup: { marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  phoneContainer: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  countryButton: { 
    borderWidth: 1, 
    borderColor: '#e5e7eb', 
    borderRadius: 8, 
    backgroundColor: '#fff',
    width: 80,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countryButtonText: { fontSize: 16, fontWeight: '600', color: '#374151' },
  phoneInput: { flex: 1 },
  passwordHints: { backgroundColor: '#fef3c7', padding: 12, borderRadius: 8, marginBottom: 12 },
  hintTitle: { fontSize: 12, fontWeight: '600', color: '#92400e', marginBottom: 4 },
  hintText: { fontSize: 11, color: '#92400e', marginLeft: 4 },
  error: { color: '#b91c1c', marginBottom: 12, textAlign: 'center', fontSize: 14, backgroundColor: '#fee2e2', padding: 12, borderRadius: 8 },
  button: { marginTop: 8 },
  loginContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 16, alignItems: 'center' },
  loginText: { color: '#6b7280', fontSize: 14 },
  link: { color: '#2e7d32', fontSize: 14, fontWeight: '600' },
});
