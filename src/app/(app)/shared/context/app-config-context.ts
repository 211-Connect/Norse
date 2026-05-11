'use client';

import { createContext } from 'react';

import { AppConfig } from '@/types/appConfig';

const appConfigContext = createContext<AppConfig | null>(null);

export { appConfigContext };
