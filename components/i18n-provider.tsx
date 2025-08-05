// components/I18nProvider.tsx
'use client';

import React, { ReactNode, useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18next from '@/lib/i18n';

const I18nProvider = ({ children }: { children: ReactNode }) => {
  // Ensure i18next is initialized (optional, as it's already initialized in i18n.ts)
  useEffect(() => {
    i18next.init().catch((error) => console.error('i18next initialization error:', error));
  }, []);

  return <I18nextProvider i18n={i18next}>{children}</I18nextProvider>;
};

export default I18nProvider;