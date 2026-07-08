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
    console.warn('Google Drive Upload URL is not configured in .env. Falling back to Firebase Storage.');
    return uploadToFirebaseStorage(localUri, fname);
  }

  try {
    const ext = fname.split('.').pop() || 'jpg';
    const mimeType = `image/${ext === 'png' ? 'png' : 'jpeg'}`;

    let base64 = '';

    if (Platform.OS === 'web') {
      const response = await fetch(localUri);
      const blob = await response.blob();
      base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } else {
      base64 = await FileSystem.readAsStringAsync(localUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
    }

    const payload = {
      base64,
      filename: fname,
      mimeType,
      folderId: defaultFolderId,
    };

    // Use text/plain Content-Type to prevent triggering CORS preflight check on Google Apps Script
    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify(payload),
    });

    if (!uploadRes.ok) {
      throw new Error(`HTTP error! status: ${uploadRes.status}`);
    }

    const data = await uploadRes.json();
    if (data.success && data.url) {
      return data.url;
    } else {
      console.warn('Google Drive Upload service error:', data.error);
      throw new Error(data.error || 'Unknown error');
    }
  } catch (err) {
    console.warn('Error uploading to Google Drive. Falling back to Firebase Storage:', err);
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
