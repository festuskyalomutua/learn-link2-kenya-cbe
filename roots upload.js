server/routes/upload.js:

const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const auth = require('../middleware/auth');
const Resource = require('../models/Resource');
const { notifyRole } = require('../socket/socketHandler');

// Upload learning resource
router.post('/resource', auth, upload.single('resource'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const resource = new Resource({
      title: req.body.title,
      description: req.body.description,
      subject: req.body.subject,
      grade: req.body.grade,
      type: req.body.type,
      filePath: req.file.path,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: req.user.id,
      tags: req.body.tags ? req.body.tags.split(',') : []
    });

    await resource.save();

    // Notify teachers about new resource
    notifyRole('teacher', {
      type: 'new_resource',
      message: `New resource uploaded: ${resource.title}`,
      resourceId: resource._id,
      uploadedBy: req.user.name
    });

    res.status(201).json({
      message: 'Resource uploaded successfully',
      resource: resource
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Upload multiple assessment files
router.post('/assessment-files', auth, upload.array('assessmentFiles', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const uploadedFiles = req.files.map(file => ({
      fileName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype
    }));

    res.json({
      message: 'Files uploaded successfully',
      files: uploadedFiles
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get file (with access control)
router.get('/file/:filename', auth, (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Send file
    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

server/models/Resource.js:

const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  subject: {
    type: String,
    required: true
  },
  grade: String,
  type: {
    type: String,
    enum: ['document', 'video', 'audio', 'interactive', 'presentation', 'image'],
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileName: String,
  fileSize: Number,
  mimeType: String,
  downloadCount: {
    type: Number,
    default: 0
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [String],
  isPublic: {
    type: Boolean,
    default: true
  },
  competencies: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Resource', resourceSchema);