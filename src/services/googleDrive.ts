import * as FileSystem from 'expo-file-system/legacy';

const uploadUrl = process.env.EXPO_PUBLIC_GOOGLE_DRIVE_UPLOAD_URL || '';
const defaultFolderId = process.env.EXPO_PUBLIC_GOOGLE_DRIVE_FOLDER_ID || '';

export async function uploadToGoogleDrive(
  localUri: string,
  filename?: string
): Promise<string | null> {
  if (!uploadUrl) {
    console.error('Google Drive Upload URL is not configured in .env');
    return null;
  }

  try {
    const fname = filename || localUri.split('/').pop() || 'upload.jpg';
    const ext = fname.split('.').pop() || 'jpg';
    const mimeType = `image/${ext === 'png' ? 'png' : 'jpeg'}`;

    // Use expo-file-system to read file as base64 directly.
    // This avoids the React Native limitation where Blob constructor
    // does not support ArrayBuffer/ArrayBufferView.
    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const payload = {
      base64,
      filename: fname,
      mimeType,
      folderId: defaultFolderId,
    };

    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
      console.error('Google Drive Upload service error:', data.error);
      return null;
    }
  } catch (err) {
    console.error('Error uploading to Google Drive:', err);
    return null;
  }
}
