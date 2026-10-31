'use client';

import { AuthProvider } from '@/context/AuthContext';

/**
 * ClientProviders wraps the application with all client-side context providers.
 * Maintains Next.js Server Component boundaries in root layout.js while providing
 * global client state (Authentication, user session restoration, etc.).
 *
 * @param {object} props
 * @param {React.ReactNode} props.children
 */
export function ClientProviders({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}

export default ClientProviders;

