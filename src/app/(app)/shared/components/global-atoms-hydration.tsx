'use client';

import { useHydrateAtoms } from 'jotai/react/utils';
import { PropsWithChildren } from 'react';

import { type DeviceType } from '../lib/get-server-device';
import { accessibilityAtom } from '../store/accessibility';
import { deviceAtom } from '../store/device';

interface GlobalAtomsHydrationProps {
  device: DeviceType;
  fontSize: string;
}

/**
 * Seeds session-wide atoms once per store: on the server for each request and
 * once in the browser. Unlike page-level state these are never re-synced on
 * navigation — the device doesn't change and the font size is owned by
 * `FontSizeToggle` after the first render.
 *
 * Must render inside the Jotai `Provider`.
 */
export function GlobalAtomsHydration({
  device,
  fontSize,
  children,
}: PropsWithChildren<GlobalAtomsHydrationProps>) {
  useHydrateAtoms([
    [deviceAtom, device],
    [accessibilityAtom, { fontSize }],
  ] as const);

  return <>{children}</>;
}
