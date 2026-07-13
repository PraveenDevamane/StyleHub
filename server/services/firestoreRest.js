const projectId = process.env.FIREBASE_PROJECT_ID || process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '';

if (!projectId) {
  console.warn('[Firestore REST] Firebase Project ID is not configured on the server');
}

const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

function encodePath(...segments) {
  return segments.map((segment) => encodeURIComponent(segment)).join('/');
}

function toFirestoreValue(value) {
  if (value === null || value === undefined) {
    return { nullValue: null };
  }

  if (Array.isArray(value)) {
    return {
      arrayValue: value.length > 0
        ? { values: value.map(toFirestoreValue) }
        : {},
    };
  }

  if (typeof value === 'boolean') {
    return { booleanValue: value };
  }

  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }

  if (typeof value === 'object') {
    return {
      mapValue: {
        fields: toFirestoreFields(value),
      },
    };
  }

  return { stringValue: String(value) };
}

function toFirestoreFields(data) {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, toFirestoreValue(value)])
  );
}

function fromFirestoreValue(value) {
  if (!value || value.nullValue === null) return null;
  if (value.stringValue !== undefined) return value.stringValue;
  if (value.integerValue !== undefined) return Number(value.integerValue);
  if (value.doubleValue !== undefined) return Number(value.doubleValue);
  if (value.booleanValue !== undefined) return value.booleanValue;
  if (value.timestampValue !== undefined) return value.timestampValue;
  if (value.arrayValue !== undefined) {
    return (value.arrayValue.values || []).map(fromFirestoreValue);
  }
  if (value.mapValue !== undefined) {
    return fromFirestoreFields(value.mapValue.fields || {});
  }
  return null;
}

function fromFirestoreFields(fields = {}) {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, fromFirestoreValue(value)])
  );
}

function fromFirestoreDocument(document) {
  if (!document) return null;

  return {
    id: document.name.split('/').pop(),
    ...fromFirestoreFields(document.fields || {}),
  };
}

async function firestoreFetch(url, token, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });

  const rawText = await response.text();
  let data = null;
  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { rawText };
    }
  }

  if (!response.ok) {
    const message = data?.error?.message || data?.rawText || `Firestore REST HTTP ${response.status}`;
    throw new Error(message);
  }

  return data;
}

async function getDocument(collectionName, id, token) {
  const path = encodePath(collectionName, id);
  let data;
  try {
    data = await firestoreFetch(`${FIRESTORE_BASE_URL}/${path}`, token);
  } catch (err) {
    if (/not found|NOT_FOUND/i.test(err.message)) return null;
    throw err;
  }
  return fromFirestoreDocument(data);
}

async function listDocuments(collectionName, token, options = {}) {
  const params = new URLSearchParams();
  if (options.orderBy) params.set('orderBy', options.orderBy);
  if (options.pageSize) params.set('pageSize', String(options.pageSize));

  const queryString = params.toString();
  const data = await firestoreFetch(
    `${FIRESTORE_BASE_URL}/${encodePath(collectionName)}${queryString ? `?${queryString}` : ''}`,
    token
  );

  return (data.documents || []).map(fromFirestoreDocument);
}

async function createDocument(collectionName, data, token) {
  const created = await firestoreFetch(`${FIRESTORE_BASE_URL}/${encodePath(collectionName)}`, token, {
    method: 'POST',
    body: JSON.stringify({ fields: toFirestoreFields(data) }),
  });

  return fromFirestoreDocument(created);
}

async function updateDocument(collectionName, id, data, token) {
  const params = new URLSearchParams();
  Object.keys(data).forEach((fieldPath) => {
    params.append('updateMask.fieldPaths', fieldPath);
  });

  const updated = await firestoreFetch(
    `${FIRESTORE_BASE_URL}/${encodePath(collectionName, id)}?${params.toString()}`,
    token,
    {
      method: 'PATCH',
      body: JSON.stringify({ fields: toFirestoreFields(data) }),
    }
  );

  return fromFirestoreDocument(updated);
}

async function deleteDocument(collectionName, id, token) {
  await firestoreFetch(`${FIRESTORE_BASE_URL}/${encodePath(collectionName, id)}`, token, {
    method: 'DELETE',
  });

  return true;
}

module.exports = {
  createDocument,
  deleteDocument,
  getDocument,
  listDocuments,
  updateDocument,
};
