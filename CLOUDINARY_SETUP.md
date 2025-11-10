# Cloudinary Setup for Image Uploads

## Overview
This project uses Cloudinary for image uploads, providing optimized image storage and delivery with CDN capabilities.

## Setup Instructions

### 1. Create a Cloudinary Account
1. Go to [Cloudinary](https://cloudinary.com) and create a free account
2. Navigate to your Dashboard to get your credentials

### 2. Environment Variables
Add these variables to your `.env` file:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Features
- **Automatic Image Optimization**: Images are automatically compressed and optimized
- **Responsive Images**: Multiple sizes generated automatically
- **File Validation**: Only image files (JPEG, PNG, GIF, WebP) up to 5MB
- **Secure Storage**: Images stored in `coordinet/events` folder
- **Progress Tracking**: Real-time upload progress feedback

### 4. API Endpoints

#### Upload Image
```
POST /api/upload/image
Headers: Authorization: Bearer <token>
Body: FormData with 'image' field
```

#### Delete Image
```
DELETE /api/upload/image/:public_id
Headers: Authorization: Bearer <token>
```

### 5. Frontend Usage
The `ImageUpload` component handles:
- File selection and validation
- Upload progress display
- Image preview
- Error handling
- Image removal

### 6. Configuration
Images are automatically:
- Resized to max 800x600 pixels
- Compressed with 'auto:good' quality
- Stored in organized folders
- Delivered via Cloudinary CDN

## Security
- Authentication required for all uploads
- File type validation on both frontend and backend
- File size limits enforced
- Public ID-based deletion for security