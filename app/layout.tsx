import type { Metadata, Viewport } from 'next';
import './globals.css';
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#306e50',
};
export const metadata: Metadata = {
  title: 'discover. — Koh Rong’u keşfet',
  description:
    'Kamboçya’daki Koh Rong adası için yerler, etkinlikler, yürüyüş rotaları ve sohbetler.',
  icons: { icon: '/favicon.svg' },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
