const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer with memory storage
const storage = multer.memoryStorage();

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, JPG, PNG, GIF, and WebP are allowed.'), false);
    }
  },
});

// Helper function to upload to Cloudinary
const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const defaultOptions = {
      folder: 'coordinet/events',
      resource_type: 'auto',
      transformation: [
        { width: 800, height: 600, crop: 'limit' },
        { quality: 'auto:good' }
      ],
      ...options
    };

    cloudinary.uploader.upload_stream(defaultOptions, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    }).end(buffer);
  });
};

module.exports = {
  cloudinary,
  upload,
  uploadToCloudinary,
};