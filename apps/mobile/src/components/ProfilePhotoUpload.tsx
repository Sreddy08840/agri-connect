import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';

interface ProfilePhotoUploadProps {
  currentAvatarUrl?: string | null;
  onPhotoUpdate?: (newAvatarUrl: string | null) => void;
  size?: 'small' | 'large';
}

const ProfilePhotoUpload: React.FC<ProfilePhotoUploadProps> = ({ 
  currentAvatarUrl, 
  onPhotoUpdate, 
  size = 'large' 
}) => {
  const { user, setUser } = useAuthStore();
  const [uploading, setUploading] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(currentAvatarUrl || user?.avatarUrl || null);

  const avatarSize = size === 'small' ? 80 : 120;

  // Request permissions
  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to upload photos!');
        return false;
      }
    }
    return true;
  };

  // Pick image from gallery
  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Check file size (approximate from base64)
        if (asset.base64) {
          const sizeInBytes = (asset.base64.length * 3) / 4;
          if (sizeInBytes > 5 * 1024 * 1024) {
            Alert.alert('Error', 'Image size must be less than 5MB');
            return;
          }
        }

        await uploadImage(asset.uri, asset.base64);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  // Take photo with camera
  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Sorry, we need camera permissions to take photos!');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Check file size
        if (asset.base64) {
          const sizeInBytes = (asset.base64.length * 3) / 4;
          if (sizeInBytes > 5 * 1024 * 1024) {
            Alert.alert('Error', 'Image size must be less than 5MB');
            return;
          }
        }

        await uploadImage(asset.uri, asset.base64);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  // Upload image to server
  const uploadImage = async (uri: string, base64?: string) => {
    setUploading(true);
    try {
      // Determine image type from URI
      const uriParts = uri.split('.');
      const fileType = uriParts[uriParts.length - 1].toLowerCase();
      
      // Convert to base64 if not already
      let imageData = base64;
      if (!imageData) {
        // Fallback: read file as base64 (platform specific)
        Alert.alert('Error', 'Unable to process image');
        return;
      }

      // Create data URL
      const dataUrl = `data:image/${fileType};base64,${imageData}`;

      const response = await api.post('/upload/avatar', { image: dataUrl });
      
      const newAvatarUrl = response.data.avatarUrl;
      setImageUri(newAvatarUrl);
      
      // Update user in auth store
      if (user) {
        setUser({ ...user, avatarUrl: newAvatarUrl });
      }
      
      // Callback to parent
      onPhotoUpdate?.(newAvatarUrl);
      
      Alert.alert('Success', 'Profile photo updated successfully!');
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  // Remove photo
  const removePhoto = async () => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove your profile photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setUploading(true);
            try {
              await api.delete('/upload/avatar');
              setImageUri(null);
              
              if (user) {
                setUser({ ...user, avatarUrl: null });
              }
              
              onPhotoUpdate?.(null);
              Alert.alert('Success', 'Profile photo removed successfully!');
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to remove photo');
            } finally {
              setUploading(false);
            }
          },
        },
      ]
    );
  };

  // Show options
  const showOptions = () => {
    const options = imageUri 
      ? ['Take Photo', 'Choose from Gallery', 'Remove Photo', 'Cancel']
      : ['Take Photo', 'Choose from Gallery', 'Cancel'];
    
    Alert.alert(
      'Profile Photo',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Gallery', onPress: pickImage },
        ...(imageUri ? [{ text: 'Remove Photo', onPress: removePhoto, style: 'destructive' as const }] : []),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const displayUrl = imageUri || currentAvatarUrl || user?.avatarUrl;
  const apiBaseUrl = api.defaults.baseURL?.replace('/api', '') || 'http://localhost:3001';

  return (
    <TouchableOpacity 
      style={[styles.container, { width: avatarSize, height: avatarSize }]} 
      onPress={showOptions}
      disabled={uploading}
    >
      <View style={[styles.avatarContainer, { width: avatarSize, height: avatarSize }]}>
        {displayUrl ? (
          <Image
            source={{ 
              uri: displayUrl.startsWith('http') ? displayUrl : `${apiBaseUrl}${displayUrl}` 
            }}
            style={styles.avatar}
            onError={(e) => {
              console.error('Image load error:', e.nativeEvent.error);
            }}
          />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>
              {user?.name?.charAt(0)?.toUpperCase() || '👤'}
            </Text>
          </View>
        )}
        
        {uploading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        )}
        
        {/* Camera icon overlay */}
        <View style={styles.cameraIcon}>
          <Text style={styles.cameraText}>📷</Text>
        </View>
      </View>
      
      {size === 'large' && (
        <Text style={styles.hint}>Tap to change photo</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  avatarContainer: {
    borderRadius: 100,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#10B981',
  },
  placeholderText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#10B981',
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cameraText: {
    fontSize: 16,
  },
  hint: {
    marginTop: 8,
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default ProfilePhotoUpload;
