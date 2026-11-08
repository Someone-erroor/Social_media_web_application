import './globals.css';
import { ClientProviders } from '@/components/providers/ClientProviders';

export const metadata = {
  title: {
    default: 'Looply — Connect. Share. Express.',
    template: '%s | Looply'
  },
  description:
    'Looply is an editorial digital social networking platform built for authentic connection, creative dialogue, and expressive experiences.',
  icons: {
    icon: '/favicon.svg'
  }
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#17151D'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full bg-[#110F17] antialiased selection:bg-[#FF6257] selection:text-[#17151D] dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&family=Syne:wght@700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col text-[#F6F2EA] bg-[#110F17] font-sans">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
