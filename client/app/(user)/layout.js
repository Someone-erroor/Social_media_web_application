import UserShell from '@/components/layouts/UserShell';

/**
 * User Route Group Layout
 * Wraps all user experience routes (/feed, /explore, /profile, etc.)
 * in the standard Looply UserShell.
 */
export default function UserLayout({ children }) {
  return <UserShell>{children}</UserShell>;
}
