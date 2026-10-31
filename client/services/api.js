const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Standardized API client for Looply frontend.
 * Always sends credentials: 'include' to ensure HTTP-only cookies are preserved.
 *
 * @param {string} endpoint - API path relative to /api (e.g. '/auth/login')
 * @param {RequestInit} [options] - Fetch configuration options
 * @returns {Promise<any>} Parsed response data
 */
export async function apiClient(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const defaultHeaders = {
    'Accept': 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {})
  };

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
    throw new Error('Unable to connect to Looply server. Please check your internet connection or server status.');
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

