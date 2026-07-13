import { auth } from './firebase';

export async function getAdminAuthHeaders(extraHeaders = {}) {
  if (typeof auth.authStateReady === 'function') {
    await auth.authStateReady();
  }

  const token = await auth.currentUser?.getIdToken();
  if (!token) {
    throw new Error('Admin authentication is required');
  }

  return {
    ...extraHeaders,
    Authorization: `Bearer ${token}`,
  };
}
