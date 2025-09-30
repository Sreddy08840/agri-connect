import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  style?: ViewStyle;
};

export default function Button({ title, onPress, variant = 'primary', disabled, style }: Props) {
  const bg = variant === 'primary' ? '#2e7d32' : variant === 'secondary' ? '#1b5e20' : '#b91c1c';
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.base, { backgroundColor: disabled ? '#9ca3af' : bg }, style]}
    >
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { padding: 14, borderRadius: 8, alignItems: 'center' },
  text: { color: '#fff', fontWeight: '700' },
});
