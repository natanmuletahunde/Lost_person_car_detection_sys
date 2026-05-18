import '@mantine/core/styles.css';
import { ColorSchemeScript } from '@mantine/core';
import '@mantine/carousel/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';
import Providers from './providers'; // adjust the path if needed
import DarkModeFloatingButton from './components/DarkModeFloatingButton'; // adjust path
import LanguageFloatingButton from './components/LanguageFloatingButton';
import AIAssistantWidget from './components/AIAssistantWidget';

import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { Noto_Sans_Ethiopic } from 'next/font/google';

// Load Noto Sans Ethiopic for premium Amharic text support
const notoEthiopic = Noto_Sans_Ethiopic({
  subsets: ['ethiopic'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-noto-ethiopic',
  display: 'swap',
});

export const metadata = {
  title: 'Auth UI',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html 
      lang={locale} 
      suppressHydrationWarning
      className={locale === 'am' ? notoEthiopic.className : ''}
      style={locale === 'am' ? { fontFamily: 'var(--font-noto-ethiopic), sans-serif' } : undefined}
    >
      {/* 👇 This comment absorbs the whitespace that causes hydration mismatch */}
      {/* */}
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body style={{ margin: 0 }}>
        <NextIntlClientProvider messages={messages}>
          <Providers>
            {children}
            <DarkModeFloatingButton />
            <LanguageFloatingButton />
            <AIAssistantWidget />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}