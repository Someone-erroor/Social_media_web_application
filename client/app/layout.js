import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata = {
  title: {
    default: 'Looply — Connect. Share. Express.',
    template: '%s | Looply'
  },
  description:
    'Looply is a modern, professional social media platform built for meaningful connection and expression.',
  icons: {
    icon: '/favicon.svg'
  }
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0F172A'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full bg-slate-50 antialiased selection:bg-indigo-500 selection:text-white">
      <body className="min-h-full flex flex-col text-slate-900 bg-slate-50 font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
