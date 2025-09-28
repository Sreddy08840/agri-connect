import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { api } from '../lib/api';
import { getImageUrl } from '../lib/imageUtils';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';
import { Camera, Upload, User, Trash2 } from 'lucide-react';
import Button from './ui/Button';

interface ProfilePhotoUploadProps {
  currentAvatarUrl?: string | null;
  onPhotoUpdate?: (newAvatarUrl: string | null) => void;
  size?: 'small' | 'large';
}

export default function ProfilePhotoUpload({ currentAvatarUrl, onPhotoUpdate, size = 'large' }: ProfilePhotoUploadProps) {
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Upload mutation
  const uploadMutation = useMutation(
    (imageData: string) => api.post('/upload/avatar', { image: imageData }),
    {
      onSuccess: (response) => {
        const newAvatarUrl = response.data.avatarUrl;
        toast.success('Profile photo updated successfully!');
        
        // Update user in auth store
        if (user) {
          const updatedUser = { ...user, avatarUrl: newAvatarUrl };
          setUser(updatedUser);
        }
        
        // Clear preview
        setPreviewUrl(null);
        
        // Callback to parent component
        onPhotoUpdate?.(newAvatarUrl);
        
        // Invalidate queries
        queryClient.invalidateQueries(['user-profile']);
        queryClient.invalidateQueries(['farmer-profile']);
        queryClient.invalidateQueries(['customer-profile']);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to upload photo');
        setPreviewUrl(null);
      }
    }
  );

  // Delete mutation
  const deleteMutation = useMutation(
    () => api.delete('/upload/avatar'),
    {
      onSuccess: () => {
        toast.success('Profile photo removed successfully!');
        
        // Update user in auth store
        if (user) {
          setUser({ ...user, avatarUrl: null });
        }
        
        // Clear preview
        setPreviewUrl(null);
        
        // Callback to parent component
        onPhotoUpdate?.(null);
        
        // Invalidate queries
        queryClient.invalidateQueries(['user-profile']);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to remove photo');
      }
    }
  );

  const handleFileSelect = (file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreviewUrl(result);
    };
    reader.readAsDataURL(file);

    // Upload image
    const uploadReader = new FileReader();
    uploadReader.onload = (e) => {
      const result = e.target?.result as string;
      uploadMutation.mutate(result);
    };
    uploadReader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemovePhoto = () => {
    deleteMutation.mutate();
  };

  const displayUrl = previewUrl || currentAvatarUrl || user?.avatarUrl;
  const isLoading = uploadMutation.isLoading || deleteMutation.isLoading;
  
  
  const avatarSize = size === 'small' ? 'w-20 h-20' : 'w-32 h-32';
  const iconSize = size === 'small' ? 'w-10 h-10' : 'w-16 h-16';
  const cameraSize = size === 'small' ? 'w-3 h-3' : 'w-4 h-4';

  return (
    <div className={`flex flex-col items-center ${size === 'small' ? 'space-y-2' : 'space-y-4'}`}>
      {/* Avatar Display */}
      <div className="relative">
        <div 
          className={`${avatarSize} rounded-full border-4 border-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center transition-all duration-200 ${
            isDragging ? 'border-blue-400 bg-blue-50' : ''
          } ${isLoading ? 'opacity-50' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {displayUrl ? (
            <>
              <img 
                src={displayUrl?.startsWith('data:') ? displayUrl : getImageUrl(displayUrl || undefined)}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error('Image failed to load:', displayUrl);
                  // Don't hide the image, show the User icon instead
                  e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                  e.currentTarget.style.display = 'none';
                }}
              />
              <User className={`${iconSize} text-gray-400 fallback-icon hidden`} />
            </>
          ) : (
            <User className={`${iconSize} text-gray-400`} />
          )}
          
          {isLoading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            </div>
          )}
        </div>

        {/* Camera Button */}
        <button
          onClick={handleCameraClick}
          disabled={isLoading}
          className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-1.5 shadow-lg transition-colors disabled:opacity-50"
        >
          <Camera className={cameraSize} />
        </button>
      </div>

      {/* Upload Instructions - Only show for large size */}
      {size === 'large' && (
        <>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              Click the camera icon or drag & drop an image
            </p>
            <p className="text-xs text-gray-500">
              Supported: JPEG, PNG, GIF, WebP (max 5MB)
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCameraClick}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload Photo
            </Button>

            {displayUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemovePhoto}
                disabled={isLoading}
                className="flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                Remove
              </Button>
            )}
          </div>
        </>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Drag & Drop Overlay */}
      {isDragging && (
        <div className="fixed inset-0 bg-blue-600 bg-opacity-20 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-white rounded-lg p-8 shadow-lg">
            <Upload className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-900">Drop image here</p>
          </div>
        </div>
      )}
    </div>
  );
}
