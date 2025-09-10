import '@/app/global.css';
import { RootProvider } from 'fumadocs-ui/provider';
import { Geist, Geist_Mono } from 'next/font/google';
import { cn } from '@/lib/utils';
import SearchDialog from '@/components/search';
const fontSans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
});

const fontMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400'],
});

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={cn(fontSans.variable, fontMono.variable)} suppressHydrationWarning>
      <body
        className="flex flex-col min-h-screen absolute inset-0 z-0"
        style={{
          backgroundImage: `
       radial-gradient(circle at 25% 25%, #222222 0.5px, transparent 1px),
       radial-gradient(circle at 75% 75%, #111111 0.5px, transparent 1px)
     `,
          backgroundSize: '10px 10px',
          imageRendering: 'pixelated',
        }}>
        <RootProvider
          search={{
            SearchDialog,
          }}>
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
