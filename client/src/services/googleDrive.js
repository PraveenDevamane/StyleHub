import { getAdminAuthHeaders } from './authHeaders';

export async function uploadToGoogleDrive(file) {
  try {
    console.log('[Drive Upload] Starting server upload.');
    
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.onerror = () => reject(new Error('FileReader failed'));
      reader.readAsDataURL(file);
    });

    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: await getAdminAuthHeaders({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify({
        base64,
        filename: file.name,
        mimeType: file.type,
      }),
    });

    const rawText = await response.text();
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${rawText.substring(0, 200)}`);
    }

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (err) {
      throw new Error(`Response is not valid JSON: ${rawText.substring(0, 200)}`);
    }

    if (data.success && data.url) {
      console.log('[Drive Upload] Server upload succeeded.');
      return data.url;
    } else {
      throw new Error(data.error || 'Drive uploader returned success=false');
    }
  } catch (err) {
    console.warn('[Drive Upload] Server Drive upload failed:', err.message);
    throw err;
  }
}
