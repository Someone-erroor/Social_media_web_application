'use client';

import { AuthProvider } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';

/**
 * ClientProviders wraps the application with all client-side context providers.
 * Maintains Next.js Server Component boundaries in root layout.js while providing
 * global client state (Authentication, user session restoration, real-time notifications).
 *
 * @param {object} props
 * @param {React.ReactNode} props.children
 */
export function ClientProviders({ children }) {
  return (
    <AuthProvider>
      <NotificationProvider>{children}</NotificationProvider>
    </AuthProvider>
  );
}

export default ClientProviders;

