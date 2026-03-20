import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Surflow — Surf Smarter, Recover Faster',
  description:
    'Real-time forecasts, webcams, guided recovery, and local coaches. Built for committed surfers in Morocco and Bali.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
