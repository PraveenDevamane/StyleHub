import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

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
