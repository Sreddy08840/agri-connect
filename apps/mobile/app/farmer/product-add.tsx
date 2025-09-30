import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { addProduct } from '../../services/farmer';
import { useRouter } from 'expo-router';

export default function ProductAdd() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setLoading(true);
    try {
      await addProduct({ name, price: Number(price) || 0, imageUrl, description });
      router.back();
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Input label="Name" value={name} onChangeText={setName} />
      <Input label="Price" value={price} onChangeText={setPrice} keyboardType="numeric" />
      <Input label="Image URL" value={imageUrl} onChangeText={setImageUrl} />
      <Input label="Description" value={description} onChangeText={setDescription} />
      <Button title={loading ? 'Saving...' : 'Save'} onPress={onSubmit} disabled={loading} />
    </ScrollView>
  );
}
