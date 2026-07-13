import React, { useState, useEffect, useMemo } from 'react';
import { getImageUrlCandidates } from '../utils/image';

export default function CachedImage({
  source,
  style = {},
  className = '',
  showLoader = false,
  alt = '',
  ...props
}) {
  const [loading, setLoading] = useState(true);
  const [candidateIndex, setCandidateIndex] = useState(0);
  const sourceValue = source?.uri || source;
  const candidates = useMemo(() => getImageUrlCandidates(sourceValue), [sourceValue]);
  const src = candidates[candidateIndex] || '';

  useEffect(() => {
    setCandidateIndex(0);
    setLoading(!!sourceValue);
  }, [sourceValue]);

  const handleError = () => {
    if (candidateIndex < candidates.length - 1) {
      setCandidateIndex((current) => current + 1);
      return;
    }
    setLoading(false);
  };

  return (
    <div style={{ position: 'relative', overflow: 'hidden', width: '100%', height: '100%', ...style }} className={className}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoading(false)}
        onError={handleError}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: loading ? 0 : 1,
          transition: 'opacity 0.3s ease',
          display: 'block'
        }}
        {...props}
      />
      {loading && showLoader && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
          }}
        >
          <div className="spinner" />
        </div>
      )}
    </div>
  );
}
