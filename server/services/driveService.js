const { ref, deleteObject } = require('firebase/storage');
const { storage } = require('../firebase-config');

const uploadUrl = process.env.GOOGLE_DRIVE_UPLOAD_URL || process.env.EXPO_PUBLIC_GOOGLE_DRIVE_UPLOAD_URL || '';
const defaultFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID || process.env.EXPO_PUBLIC_GOOGLE_DRIVE_FOLDER_ID || '';

function redactUrl(value) {
  if (!value) return '';

  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`;
  } catch {
    return '[redacted-url]';
  }
}

async function deleteFromFirebaseStorage(fileUrl) {
  try {
    // Extract file path from URL
    const storageRef = ref(storage, fileUrl);
    await deleteObject(storageRef);
    console.log('[Firebase Storage] Deleted file:', redactUrl(fileUrl));
    return true;
  } catch (err) {
    console.warn('[Firebase Storage] Deletion failed:', err);
    return false;
  }
}

async function uploadToGoogleDrive(base64Data, filename, mimeType) {
  const fname = filename || `upload_${Date.now()}.jpg`;
  const mType = mimeType || 'image/jpeg';

  if (!uploadUrl) {
    console.warn('[Drive Upload] Upload URL is not configured.');
    return null;
  }

  try {
    console.log('[Drive Upload] Uploading image to Google Drive...');
    const payload = {
      base64: base64Data,
      filename: fname,
      mimeType: mType,
      folderId: defaultFolderId,
    };

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const rawText = await response.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseErr) {
      throw new Error('Response is not valid JSON');
    }

    if (data.success && data.url) {
      console.log('[Drive Upload] Successfully uploaded to Drive.');
      return data.url;
    } else {
      throw new Error(data.error || 'Unknown error from Drive upload service');
    }
  } catch (err) {
    console.error('[Drive Upload] Google Drive upload failed:', err.message);
    return null;
  }
}

async function deleteFromGoogleDrive(fileUrl) {
  if (!fileUrl) return false;

  if (fileUrl.startsWith('https://firebasestorage.googleapis.com')) {
    return deleteFromFirebaseStorage(fileUrl);
  }

  if (!uploadUrl) {
    console.warn('[Drive Delete] Upload URL is not configured. Skipping Drive delete.');
    return false;
  }

  const fileId = extractFileIdFromUrl(fileUrl);
  if (!fileId) {
    console.warn('[Drive Delete] Could not extract file ID from URL:', fileUrl);
    return false;
  }

  try {
    const payload = {
      action: 'delete',
      fileId: fileId,
    };

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();
    return !!data.success;
  } catch (err) {
    console.warn('[Drive Delete] Deletion failed:', err.message);
    return false;
  }
}

function extractFileIdFromUrl(url) {
  const regExp = /id=([^&]+)|d\/([^/]+)/;
  const matches = url.match(regExp);
  if (matches) {
    return matches[1] || matches[2] || null;
  }
  return null;
}

module.exports = {
  uploadToGoogleDrive,
  deleteFromGoogleDrive
};
