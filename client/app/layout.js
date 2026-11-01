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
  themeColor: '#172126'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full bg-[#F6F8F7] antialiased selection:bg-[#16B8C8] selection:text-[#172126]">
      <body className="min-h-full flex flex-col text-[#172126] bg-[#F6F8F7] font-sans">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
