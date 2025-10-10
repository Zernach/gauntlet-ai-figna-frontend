export const TYPOGRAPHY = {
  fontFamily: {
    body: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const
  },
  native: {
    body: {
      fontSize: 16,
      lineHeight: 24
    },
    heading: {
      fontSize: 24,
      lineHeight: 32,
      fontWeight: '600' as const
    },
    subtitle: {
      fontSize: 18,
      lineHeight: 26,
      fontWeight: '500' as const
    },
    caption: {
      fontSize: 12,
      lineHeight: 16
    },
    button: {
      fontSize: 16,
      fontWeight: '600' as const
    }
  },
  web: {
    heroTitle: {
      fontSize: '1.9rem'
    },
    body: {
      fontSize: '1rem'
    },
    cta: {
      fontSize: '1rem',
      fontWeight: '600'
    }
  }
} as const;

export type Typography = typeof TYPOGRAPHY;
