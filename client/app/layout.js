import './globals.css';
import { ClientProviders } from '@/components/providers/ClientProviders';

export const metadata = {
  title: {
    default: 'Looply — A Modern Social Playground',
    template: '%s | Looply'
  },
  description:
    'Looply is a warm, modern social playground for authentic conversation, playful shared experiences, and genuine community connection.',
  icons: {
    icon: '/favicon.svg'
  }
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FFFFFF'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full bg-[#F8F7F4] antialiased selection:bg-[#EEEAFE] selection:text-[#6C63FF]">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&family=Syne:wght@700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col text-[#1E1E24] bg-[#F8F7F4] font-sans">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
