import React from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps } from 'react-native';

type Props = TextInputProps & { label?: string; errorText?: string };

export default function Input({ label, errorText, style, ...props }: Props) {
  return (
    <View style={{ marginBottom: 12 }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        {...props}
        style={[styles.input, style]}
        placeholderTextColor="#9ca3af"
      />
      {errorText ? <Text style={styles.error}>{errorText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: 6, fontWeight: '600', color: '#374151' },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
  },
  error: { color: '#b91c1c', marginTop: 6 },
});
