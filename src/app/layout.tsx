import type { Metadata, Viewport } from 'next';
import { DM_Sans, Source_Serif_4, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { BookmarkProvider } from '@/context/BookmarkContext';
import { ToastProvider } from '@/context/ToastContext';
import { Toast } from '@/components/ui/Toast';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-serif',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const viewport: Viewport = {
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'Claude Conversation Manager',
  description: 'A redesigned conversation management experience for Claude',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${sourceSerif.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {process.env.NODE_ENV === 'development' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){var oe=console.error;console.error=function(){if(typeof arguments[0]==='string'&&arguments[0].indexOf('must be unwrapped with')!==-1)return;oe.apply(console,arguments)};})()`,
            }}
          />
        )}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('theme-preference');var t=s||(window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',t)}catch(e){}})()`,
          }}
        />
      </head>
      <body className="antialiased">
        <BookmarkProvider>
          <ToastProvider>
            {children}
            <Toast />
          </ToastProvider>
        </BookmarkProvider>
      </body>
    </html>
  );
}
