import { useState, useRef } from 'react';
import { useMutation } from 'react-query';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { Camera, Upload, X, Image as ImageIcon } from 'lucide-react';
import Button from './ui/Button';

interface ProductImageUploadProps {
  onImagesChange?: (images: string[]) => void;
  maxImages?: number;
}

interface ImagePreview {
  file: File;
  previewUrl: string;
  uploadedUrl?: string;
}

export default function ProductImageUpload({ 
  onImagesChange, 
  maxImages = 5 
}: ProductImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [images, setImages] = useState<ImagePreview[]>([]);


  // Upload mutation using FormData with explicit index mapping
  const uploadMutation = useMutation(
    (payload: { formData: FormData; targetIdxs: number[] }) => {
      return api.post('/upload/product-images', payload.formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    {
      onSuccess: (response, variables) => {
        const imagesResp = response.data.images || [];
        const uploadedUrls = imagesResp.map((r: any) => r.originalUrl);
        
        setImages(prev => {
          const updated = [...prev];
          // Map each uploaded URL to the corresponding indexes we uploaded
          variables.targetIdxs.forEach((idx, i) => {
            if (updated[idx]) {
              updated[idx] = { ...updated[idx], uploadedUrl: uploadedUrls[i] || updated[idx].uploadedUrl };
            }
          });

          const allUploadedUrls = updated
            .filter(img => img.uploadedUrl)
            .map(img => img.uploadedUrl!);
          onImagesChange?.(allUploadedUrls);
          return updated;
        });

        toast.success(`${uploadedUrls.length} image(s) uploaded successfully!`);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to upload images');
      }
    }
  );

  const handleFileSelect = (files: FileList) => {
    const fileArray = Array.from(files);
    
    // Check if we've reached the maximum number of images
    if (images.length + fileArray.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    // Validate files
    const validFiles: File[] = [];
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    for (const file of fileArray) {
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name}: Invalid file type. Only JPEG, PNG, GIF, WebP allowed`);
        continue;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name}: File too large. Maximum 10MB allowed`);
        continue;
      }
      
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Create preview URLs and add to state
    const newImages: ImagePreview[] = validFiles.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file)
    }));

    // Remember the indexes where these new images will be placed
    const startIdx = images.length;
    const targetIdxs = newImages.map((_, i) => startIdx + i);

    // Update state immediately for preview
    setImages(prev => [...prev, ...newImages]);

    // Auto-upload the newly added images
    const formData = new FormData();
    newImages.forEach(img => {
      formData.append('images', img.file);
    });
    if (newImages.length > 0) {
      uploadMutation.mutate({ formData, targetIdxs });
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => {
      const updated = prev.filter((_, i) => i !== index);
      
      // Clean up object URL to prevent memory leaks
      if (prev[index]) {
        URL.revokeObjectURL(prev[index].previewUrl);
      }
      
      // Notify parent with remaining uploaded URLs
      const remainingUrls = updated
        .filter(img => img.uploadedUrl)
        .map(img => img.uploadedUrl!);
      onImagesChange?.(remainingUrls);
      
      return updated;
    });
  };
  
  const handleUploadAll = () => {
    const targetIdxs: number[] = [];
    const formData = new FormData();

    images.forEach((img, idx) => {
      if (!img.uploadedUrl) {
        targetIdxs.push(idx);
        formData.append('images', img.file);
      }
    });

    if (targetIdxs.length === 0) {
      toast.error('No new images to upload');
      return;
    }

    uploadMutation.mutate({ formData, targetIdxs });
  };

  const isLoading = uploadMutation.isLoading;

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging 
            ? 'border-blue-400 bg-blue-50' 
            : images.length >= maxImages 
              ? 'border-gray-200 bg-gray-50' 
              : 'border-gray-300 hover:border-gray-400'
        } ${isLoading ? 'opacity-50' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {images.length >= maxImages ? (
          <div className="text-gray-500">
            <ImageIcon className="w-8 h-8 mx-auto mb-2" />
            <p>Maximum {maxImages} images reached</p>
          </div>
        ) : (
          <>
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 mb-2">
              Drag & drop product images here, or{' '}
              <button
                type="button"
                onClick={handleUploadClick}
                disabled={isLoading}
                className="text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
              >
                browse
              </button>
            </p>
            <p className="text-xs text-gray-500">
              JPEG, PNG, GIF, WebP (max 10MB each) • {images.length}/{maxImages} images
            </p>
            {isLoading && (
              <div className="mt-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-1">Uploading...</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={image.previewUrl}
                  alt={`Product ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                <X className="w-4 h-4" />
              </button>
              {index === 0 && (
                <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded shadow-lg">
                  Main Image
                </div>
              )}
              {image.uploadedUrl && (
                <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded shadow-lg">
                  ✓ Uploaded
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleUploadClick}
            disabled={isLoading || images.length >= maxImages}
            className="flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            Add Images
          </Button>
          
          {images.some(img => !img.uploadedUrl) && (
            <Button
              type="button"
              onClick={handleUploadAll}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {isLoading ? 'Uploading...' : 'Upload All'}
            </Button>
          )}
        </div>
        
        {images.length > 0 && (
          <p className="text-sm text-gray-600">
            {images.filter(img => img.uploadedUrl).length}/{images.length} uploaded • {images.length}/{maxImages} total
          </p>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        multiple
        className="hidden"
      />

      {/* Drag & Drop Overlay */}
      {isDragging && (
        <div className="fixed inset-0 bg-blue-600 bg-opacity-20 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-white rounded-lg p-8 shadow-lg">
            <Upload className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-900">Drop images here</p>
          </div>
        </div>
      )}
    </div>
  );
}
