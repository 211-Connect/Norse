'use client';

import { createContext } from 'react';

export type Auth = {
  sessionId?: string;
};

const authContext = createContext<Auth>({});

export { authContext };
