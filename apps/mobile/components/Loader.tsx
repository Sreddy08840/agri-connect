import React from 'react';
import { Modal, View, ActivityIndicator } from 'react-native';

export default function Loader({ visible }: { visible: boolean }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    </Modal>
  );
}
