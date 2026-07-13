function getDriveFileInfo(url) {
  if (!url || typeof url !== 'string') return null;

  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
  ];

  let fileId = null;
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      fileId = match[1];
      break;
    }
  }

  if (!fileId) return null;

  let resourceKey = null;
  try {
    resourceKey = new URL(url).searchParams.get('resourcekey');
  } catch (err) {
    const match = url.match(/[?&]resourcekey=([^&]+)/);
    resourceKey = match ? decodeURIComponent(match[1]) : null;
  }

  return { fileId, resourceKey };
}

function uniqueUrls(urls) {
  return [...new Set(urls.filter(Boolean))];
}

/**
 * Returns browser-friendly image URL candidates for Google Drive links.
 * Falls back to the original URL if it is not a Google Drive image URL.
 *
 * @param {string} url - The URL to check and parse
 * @returns {string[]} Candidate image URLs in preferred order
 */
export function getImageUrlCandidates(url) {
  if (!url || typeof url !== 'string') return [];

  const isGoogleImageCdn = url.includes('googleusercontent.com/d/');
  const isDriveUrl = url.includes('drive.google.com') || url.includes('docs.google.com') || isGoogleImageCdn;
  if (!isDriveUrl) return [url];

  const driveInfo = getDriveFileInfo(url);
  if (!driveInfo) return [url];

  const { fileId, resourceKey } = driveInfo;
  const encodedId = encodeURIComponent(fileId);
  const resourceKeyQuery = resourceKey ? `&resourcekey=${encodeURIComponent(resourceKey)}` : '';
  const directCdnUrl = `https://lh3.googleusercontent.com/d/${encodedId}=w1600`;

  return uniqueUrls([
    `/api/images/drive/${encodedId}${resourceKey ? `?resourcekey=${encodeURIComponent(resourceKey)}` : ''}`,
    isGoogleImageCdn ? url : null,
    `https://drive.google.com/thumbnail?id=${encodedId}&sz=w1600${resourceKeyQuery}`,
    directCdnUrl,
    `https://drive.google.com/uc?export=view&id=${encodedId}${resourceKeyQuery}`,
    `https://drive.google.com/uc?export=download&id=${encodedId}${resourceKeyQuery}`,
    url,
  ]);
}

/**
 * Converts a standard Google Drive sharing/view URL into a web-friendly image URL.
 * Falls back to returning the original URL if it's not a Google Drive link.
 *
 * @param {string} url - The URL to check and parse
 * @returns {string} The preferred image URL or original URL
 */
export function getDirectDriveUrl(url) {
  return getImageUrlCandidates(url)[0] || '';
}
