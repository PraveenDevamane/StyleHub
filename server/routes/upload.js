const express = require('express');
const router = express.Router();
const { uploadToGoogleDrive, deleteFromGoogleDrive } = require('../services/driveService');
const { requireAdmin } = require('../services/authService');

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function sanitizeFilename(filename, mimeType) {
  const extensionByType = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  const fallbackExtension = extensionByType[mimeType] || 'jpg';
  const rawName = typeof filename === 'string' && filename.trim()
    ? filename.trim()
    : `upload_${Date.now()}.${fallbackExtension}`;
  const safeName = rawName
    .replace(/[^\w.\-]+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 120);

  return safeName.includes('.') ? safeName : `${safeName}.${fallbackExtension}`;
}

function getBase64Size(base64) {
  const normalized = base64.replace(/\s/g, '');
  const padding = (normalized.match(/=+$/) || [''])[0].length;
  return Math.floor((normalized.length * 3) / 4) - padding;
}

// POST upload file (base64 payload)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { base64, filename, mimeType } = req.body;

    if (!base64 || typeof base64 !== 'string') {
      return res.status(400).json({ error: 'Base64 image data is required' });
    }

    if (!ALLOWED_IMAGE_TYPES.has(mimeType)) {
      return res.status(400).json({ error: 'Only JPEG, PNG, and WebP images are allowed' });
    }

    if (!/^[A-Za-z0-9+/=\s]+$/.test(base64)) {
      return res.status(400).json({ error: 'Invalid base64 image data' });
    }

    if (getBase64Size(base64) > MAX_IMAGE_BYTES) {
      return res.status(413).json({ error: 'Image is too large' });
    }

    const safeFilename = sanitizeFilename(filename, mimeType);
    const fileUrl = await uploadToGoogleDrive(base64, safeFilename, mimeType);

    if (fileUrl) {
      res.json({ success: true, url: fileUrl });
    } else {
      res.status(500).json({ error: 'Failed to upload image' });
    }
  } catch (err) {
    console.error('Upload route error:', err);
    res.status(500).json({ error: 'Internal server error during upload' });
  }
});

// POST delete file (takes fileUrl)
router.post('/delete', requireAdmin, async (req, res) => {
  try {
    const { fileUrl } = req.body;

    if (!fileUrl) {
      return res.status(400).json({ error: 'File URL is required' });
    }

    const success = await deleteFromGoogleDrive(fileUrl);
    res.json({ success });
  } catch (err) {
    console.error('Delete route error:', err);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

module.exports = router;
