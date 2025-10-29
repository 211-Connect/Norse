'use client';

import { AppConfig } from '@/types/appConfig';
import { createContext } from 'react';

const appConfigContext = createContext<AppConfig | null>(null);

export { appConfigContext };
