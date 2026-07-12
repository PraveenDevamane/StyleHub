import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const uploadUrl = process.env.EXPO_PUBLIC_GOOGLE_DRIVE_UPLOAD_URL || '';
const defaultFolderId = process.env.EXPO_PUBLIC_GOOGLE_DRIVE_FOLDER_ID || '';

// Fallback upload helper using Firebase Storage
export async function uploadToFirebaseStorage(
  localUri: string,
  filename: string
): Promise<string | null> {
  try {
    const storageRef = ref(storage, `products/${filename}`);
    
    // Fetch blob data
    const response = await fetch(localUri);
    const blob = await response.blob();
    
    // Upload bytes
    await uploadBytes(storageRef, blob);
    
    // Get public download URL
    const downloadUrl = await getDownloadURL(storageRef);
    console.log('Successfully uploaded to Firebase Storage fallback:', downloadUrl);
    return downloadUrl;
  } catch (err) {
    console.warn('Error uploading to Firebase Storage fallback:', err);
    return null;
  }
}

// Fallback delete helper using Firebase Storage
export async function deleteFromFirebaseStorage(fileUrl: string): Promise<boolean> {
  try {
    const storageRef = ref(storage, fileUrl);
    await deleteObject(storageRef);
    console.log('Successfully deleted from Firebase Storage:', fileUrl);
    return true;
  } catch (err) {
    console.warn('Error deleting from Firebase Storage:', err);
    return false;
  }
}

export async function uploadToGoogleDrive(
  localUri: string,
  filename?: string
): Promise<string | null> {
  const fname = filename || localUri.split('/').pop() || `upload_${Date.now()}.jpg`;

  if (!uploadUrl) {
    console.warn('[Drive Upload] Upload URL is not configured. Falling back to Firebase Storage.');
    return uploadToFirebaseStorage(localUri, fname);
  }

  try {
    console.log(`[Drive Upload] Starting upload for "${fname}"...`);
    console.log(`[Drive Upload] Upload URL: ${uploadUrl.substring(0, 50)}...`);
    console.log(`[Drive Upload] Folder ID: ${defaultFolderId}`);

    const ext = fname.split('.').pop() || 'jpg';
    const mimeType = `image/${ext === 'png' ? 'png' : 'jpeg'}`;

    let base64 = '';

    if (Platform.OS === 'web') {
      console.log('[Drive Upload] Web platform: fetching blob from local URI...');
      const response = await fetch(localUri);
      if (!response.ok) {
        throw new Error(`Failed to fetch local image: ${response.status} ${response.statusText}`);
      }
      const blob = await response.blob();
      console.log(`[Drive Upload] Blob created: ${blob.size} bytes, type: ${blob.type}`);

      base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64Data = result.split(',')[1];
          if (!base64Data || base64Data.length === 0) {
            reject(new Error('FileReader produced empty base64 data'));
            return;
          }
          resolve(base64Data);
        };
        reader.onerror = () => reject(new Error('FileReader failed to read blob'));
        reader.readAsDataURL(blob);
      });
    } else {
      console.log('[Drive Upload] Native platform: reading file as base64...');
      base64 = await FileSystem.readAsStringAsync(localUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
    }

    console.log(`[Drive Upload] Base64 length: ${base64.length} chars (~${Math.round(base64.length * 0.75 / 1024)} KB)`);

    if (!base64 || base64.length === 0) {
      throw new Error('Base64 data is empty after encoding');
    }

    const payload = {
      base64,
      filename: fname,
      mimeType,
      folderId: defaultFolderId,
    };

    console.log('[Drive Upload] Sending POST to Google Apps Script...');
    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify(payload),
    });

    console.log(`[Drive Upload] Response status: ${uploadRes.status}, redirected: ${uploadRes.redirected}, type: ${uploadRes.type}`);

    // Read the raw response text first to diagnose issues
    const rawText = await uploadRes.text();
    console.log(`[Drive Upload] Raw response (first 500 chars): ${rawText.substring(0, 500)}`);

    if (!uploadRes.ok) {
      throw new Error(`HTTP error! status: ${uploadRes.status}, body: ${rawText.substring(0, 200)}`);
    }

    // Try to parse as JSON
    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch (parseErr) {
      console.error('[Drive Upload] Failed to parse response as JSON. Raw response:', rawText.substring(0, 300));
      throw new Error(`Response is not valid JSON. First 200 chars: ${rawText.substring(0, 200)}`);
    }

    if (data.success && data.url) {
      console.log(`[Drive Upload] ✅ Success! File URL: ${data.url}`);
      return data.url;
    } else {
      console.warn('[Drive Upload] Service returned error:', data.error || data);
      throw new Error(data.error || 'Unknown error from Drive upload service');
    }
  } catch (err) {
    console.error('[Drive Upload] ❌ Upload failed:', err);
    console.log('[Drive Upload] Falling back to Firebase Storage...');
    return uploadToFirebaseStorage(localUri, fname);
  }
}

export async function deleteFromGoogleDrive(fileUrl: string): Promise<boolean> {
  if (!fileUrl) return false;

  // If it's a Firebase Storage URL, delete it from Firebase Storage
  if (fileUrl.startsWith('https://firebasestorage.googleapis.com')) {
    return deleteFromFirebaseStorage(fileUrl);
  }

  // If it's a local/blob/temp URI, skip Google Drive deletion
  if (fileUrl.startsWith('blob:') || fileUrl.startsWith('file:') || fileUrl.startsWith('ph:')) {
    console.warn('Skipping Google Drive deletion for local URI:', fileUrl);
    return true;
  }

  if (!uploadUrl) {
    console.warn('Google Drive URL is not configured in .env');
    return false;
  }

  const fileId = extractFileIdFromUrl(fileUrl);
  if (!fileId) {
    console.warn('Could not extract Google Drive file ID from URL:', fileUrl);
    return false;
  }

  try {
    const payload = {
      action: 'delete',
      fileId: fileId,
    };

    // Use text/plain Content-Type to prevent CORS preflight check
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return !!data.success;
  } catch (err) {
    console.warn('Error deleting file from Google Drive:', err);
    return false;
  }
}

function extractFileIdFromUrl(url: string): string | null {
  const regExp = /id=([^&]+)|d\/([^/]+)/;
  const matches = url.match(regExp);
  if (matches) {
    return matches[1] || matches[2] || null;
  }
  return null;
}
