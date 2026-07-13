const express = require('express');

const router = express.Router();

function buildDriveImageCandidates(fileId, resourceKey) {
  const encodedId = encodeURIComponent(fileId);
  const resourceKeyQuery = resourceKey ? `&resourcekey=${encodeURIComponent(resourceKey)}` : '';

  return [
    `https://lh3.googleusercontent.com/d/${encodedId}=w1600`,
    `https://drive.google.com/thumbnail?id=${encodedId}&sz=w1600${resourceKeyQuery}`,
    `https://drive.google.com/uc?export=view&id=${encodedId}${resourceKeyQuery}`,
    `https://drive.google.com/uc?export=download&id=${encodedId}${resourceKeyQuery}`,
  ];
}

router.get('/drive/:fileId', async (req, res) => {
  const { fileId } = req.params;
  const resourceKey = typeof req.query.resourcekey === 'string' ? req.query.resourcekey : '';

  if (!/^[a-zA-Z0-9_-]+$/.test(fileId)) {
    return res.status(400).json({ error: 'Invalid Drive file ID' });
  }

  const candidates = buildDriveImageCandidates(fileId, resourceKey);
  const errors = [];

  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate, {
        redirect: 'follow',
        headers: {
          'User-Agent': 'StyleHub/1.0 image proxy',
          Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        },
      });

      const contentType = response.headers.get('content-type') || '';
      if (!response.ok || !contentType.toLowerCase().startsWith('image/')) {
        errors.push(`${response.status} ${contentType || 'unknown content type'}`);
        continue;
      }

      const imageBuffer = Buffer.from(await response.arrayBuffer());
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', imageBuffer.length);
      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
      return res.send(imageBuffer);
    } catch (err) {
      errors.push(err.message);
    }
  }

  console.warn(`[Image Proxy] Failed to resolve Drive image ${fileId}:`, errors);
  return res.status(404).json({ error: 'Drive image could not be fetched' });
});

module.exports = router;
