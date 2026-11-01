import './globals.css';
import { ClientProviders } from '@/components/providers/ClientProviders';

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
  themeColor: '#080D12'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full bg-[#080D12] antialiased selection:bg-[#19D3E3] selection:text-[#080D12] dark">
      <body className="min-h-full flex flex-col text-[#F4F8FA] bg-[#080D12] font-sans">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
