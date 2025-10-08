File Upload System with Multer
server/middleware/upload.js:

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/';
    
    // Organize files by type
    if (file.fieldname === 'assessment') {
      uploadPath += 'assessments/';
    } else if (file.fieldname === 'resource') {
      uploadPath += 'resources/';
    } else if (file.fieldname === 'profile') {
      uploadPath += 'profiles/';
    } else {
      uploadPath += 'general/';
    }
    
    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension);
    cb(null, `${baseName}-${uniqueSuffix}${extension}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    'assessment': ['.pdf', '.doc', '.docx', '.txt'],
    'resource': ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.mp4', '.mp3', '.jpg', '.png', '.gif'],
    'profile': ['.jpg', '.jpeg', '.png', '.gif'],
    'general': ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.png']
  };

  const fieldType = file.fieldname || 'general';
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes[fieldType] && allowedTypes[fieldType].includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type for ${fieldType}. Allowed: ${allowedTypes[fieldType].join(', ')}`), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 5 // Maximum 5 files per request
  }
});

module.exports = upload;