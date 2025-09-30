import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function SignupIndex() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create your account</Text>
      <TouchableOpacity style={styles.btn} onPress={() => router.push('/signup/customer')}>
        <Text style={styles.btnText}>I'm a Customer</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.btn} onPress={() => router.push('/signup/farmer')}>
        <Text style={styles.btnText}>I'm a Farmer</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 24, textAlign: 'center', color: '#1b5e20' },
  btn: { backgroundColor: '#2e7d32', padding: 16, borderRadius: 10, marginBottom: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
});
