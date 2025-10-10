import '../styles/globals.css';
import type { Metadata } from 'next';
import type { CSSProperties, ReactNode } from 'react';
import { Providers } from '../components/providers';
import { COLORS, GRADIENTS } from '../constants/colors';
import { TYPOGRAPHY } from '../constants/typography';

export const metadata: Metadata = {
  title: 'Gauntlet AI',
  description: 'Archlife Industries AI Projects',
  themeColor: COLORS.black,
  colorScheme: 'dark',
};

type CSSVariables = Record<`--${string}`, string>;

const cssVariables: CSSVariables = {
  '--color-black': COLORS.black,
  '--color-background': COLORS.background,
  '--color-background-secondary': COLORS.backgroundSecondary,
  '--color-foreground': COLORS.foreground,
  '--color-accent-primary': COLORS.accentPrimary,
  '--color-accent-secondary': COLORS.accentSecondary,
  '--card-background': COLORS.cardBackground,
  '--card-border': COLORS.cardBorder,
  '--card-shadow-color': COLORS.cardShadow,
  '--text-muted': COLORS.textMuted,
  '--cta-shadow-color': COLORS.ctaShadow,
  '--footer-muted': COLORS.footerMuted,
  '--code-background': COLORS.codeBackground,
  '--gradient-body': GRADIENTS.body,
  '--gradient-cta': GRADIENTS.cta,
  '--font-family-body': TYPOGRAPHY.fontFamily.body,
  '--font-size-hero-title': TYPOGRAPHY.web.heroTitle.fontSize,
  '--font-size-cta': TYPOGRAPHY.web.cta.fontSize,
  '--font-weight-cta': TYPOGRAPHY.web.cta.fontWeight,
};

const htmlStyle: CSSProperties = {
  backgroundColor: COLORS.black,
  ...cssVariables,
};

const bodyStyle: CSSProperties = {
  backgroundColor: COLORS.black,
  color: COLORS.foreground,
  fontFamily: TYPOGRAPHY.fontFamily.body,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang='en' style={htmlStyle}>
      <head>
        <link rel='icon' href='/favicon.ico' />
      </head>
      <body style={bodyStyle}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
