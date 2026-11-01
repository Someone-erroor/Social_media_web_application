const rawApiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').trim();
const API_BASE_URL = rawApiBaseUrl.endsWith('/') ? rawApiBaseUrl.slice(0, -1) : rawApiBaseUrl;

/**
 * Standardized API client for Looply frontend.
 * Always sends credentials: 'include' to ensure HTTP-only cookies are preserved.
 *
 * @param {string} endpoint - API path relative to /api (e.g. '/auth/login')
 * @param {RequestInit} [options] - Fetch configuration options
 * @returns {Promise<any>} Parsed response data
 */
export async function apiClient(endpoint, options = {}) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  const defaultHeaders = {
    'Accept': 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {})
  };

  if (typeof window !== 'undefined') {
    try {
      const storedToken = localStorage.getItem('looply_token');
      if (storedToken && !options.headers?.Authorization && !options.headers?.authorization) {
        defaultHeaders['Authorization'] = `Bearer ${storedToken}`;
      }
    } catch {
      // In restricted browser environments, proceed with cookie credentials
    }
  }

  const config = {
    ...options,
    credentials: 'include', // Guarantees HTTP-only auth cookies are transmitted cross-origin and same-origin
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  };

  let response;
  try {
    response = await fetch(url, config);
  } catch (netErr) {
    const networkError = new Error('Unable to connect to Looply server. Please check your internet connection or server status.');
    networkError.isNetworkError = true;
    networkError.status = 0;
    networkError.originalError = netErr;
    throw networkError;
  }

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const error = new Error(data?.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.errors = data?.errors || [];
    error.data = data;
    throw error;
  }

  return data;
}

export default apiClient;

