import React, { useState, useRef, useEffect } from 'react';
import { uploadService } from '../../services/uploadService';

const ImageUpload = ({ onImageUpload, currentImage, onImageRemove }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState(currentImage || null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please select a JPEG, PNG, GIF, or WebP image.');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size too large. Please select an image under 5MB.');
      return;
    }

    setError(null);
    setUploading(true);
    setUploadProgress(0);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);

      // Upload to Cloudinary
      const response = await uploadService.uploadImage(file, (progress) => {
        setUploadProgress(progress);
      });

      if (response.success) {
        console.log('ImageUpload - Cloudinary upload successful:', response.data);
        setPreview(response.data.url);
        onImageUpload(response.data);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.message);
      setPreview(currentImage || null);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveImage = () => {
    setPreview(null);
    setError(null);
    if (onImageRemove) {
      onImageRemove();
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Keep preview in sync when parent passes a currentImage (e.g., Cloudinary URL)
  useEffect(() => {
    if (currentImage && typeof currentImage === 'string' && currentImage.trim() !== '') {
      setPreview(currentImage);
    } else if (!currentImage) {
      setPreview(null);
    }
  }, [currentImage]);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Event Image (Optional)
      </label>
      
      {/* File Input (Hidden) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Area */}
  <div className="border-2 border-dashed rounded-lg p-6 glass-soft border-subtle">
        {preview ? (
          // Image Preview
          <div className="space-y-4">
            <div className="relative">
              <img
                src={preview}
                alt="Event preview"
                className="w-full h-48 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 bg-[var(--color-highlight)] text-white rounded-full p-1 hover:opacity-90 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <button
              type="button"
              onClick={triggerFileInput}
              disabled={uploading}
              className="w-full py-2 px-4 rounded-md text-sm font-medium btn-accent neon-hover disabled:opacity-50"
            >
              Change Image
            </button>
          </div>
        ) : (
          // Upload Button
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-white/50"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="mt-4">
              <button
                type="button"
                onClick={triggerFileInput}
                disabled={uploading}
                className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium btn-accent neon-hover disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload Image'}
              </button>
            </div>
            <p className="mt-2 text-xs text-white/60">
              PNG, JPG, GIF, WebP up to 5MB
            </p>
          </div>
        )}

        {/* Upload Progress */}
        {uploading && (
            <div className="mt-4">
            <div className="bg-[rgba(255,255,255,0.03)] rounded-full h-2">
              <div
                className="bg-[var(--color-accent)] h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-xs text-white/60 mt-1 text-center">
              Uploading... {uploadProgress}%
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-[rgba(255,0,0,0.04)] border border-[rgba(255,0,0,0.08)] rounded-md">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;