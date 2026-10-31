import AdminShell from '@/components/layouts/AdminShell';

/**
 * Admin Route Group Layout
 * Wraps all administrative management routes (/admin, /admin/users, etc.)
 * in the standard Looply AdminShell.
 */
export default function AdminLayout({ children }) {
  return <AdminShell>{children}</AdminShell>;
}
