'use client';

import { ToggleGroup, ToggleGroupItem } from '@radix-ui/react-toggle-group';
import { useEffect } from 'react';
import { setCookie, deleteCookie, getCookie } from 'cookies-next';
import { USER_PREF_FONT_SIZE } from '../../lib/constants';
import { useAppConfig } from '../../hooks/use-app-config';
import { useAtomValue, useSetAtom } from 'jotai';
import { accessibilityAtom } from '../../store/accessibility';

export const FontSizeToggle = () => {
  const accessibility = useAtomValue(accessibilityAtom);
  const setAccessibility = useSetAtom(accessibilityAtom);

  const appConfig = useAppConfig();
  const enabled = appConfig.accessibility.fontSize.allowedValues.length > 1;

  useEffect(() => {
    if (
      enabled &&
      appConfig.accessibility.fontSize.allowedValues.includes(
        accessibility.fontSize,
      )
    ) {
      document.documentElement.style.fontSize = accessibility.fontSize;
      setCookie(USER_PREF_FONT_SIZE, accessibility.fontSize);
    } else {
      deleteCookie(USER_PREF_FONT_SIZE);
    }
  }, [
    accessibility.fontSize,
    appConfig.accessibility.fontSize.allowedValues,
    enabled,
  ]);

  if (!enabled) {
    return null;
  }

  return (
    <ToggleGroup
      type="single"
      aria-label="Font size toggle"
      className="flex flex-shrink-0 overflow-hidden rounded bg-white font-medium text-foreground [&>*[data-state=on]]:bg-background-highlight [&>*]:cursor-pointer [&>*]:rounded [&>*]:p-[7px]"
      value={accessibility.fontSize}
      onValueChange={(value) => setAccessibility({ fontSize: value })}
    >
      <ToggleGroupItem
        className="text-xs"
        value={appConfig.accessibility.fontSize.allowedValues[0]}
        aria-label="Normal font size"
        disabled={
          accessibility.fontSize ===
          appConfig.accessibility.fontSize.allowedValues[0]
        }
      >
        A
      </ToggleGroupItem>
      <ToggleGroupItem
        className="text-lg leading-4"
        value={appConfig.accessibility.fontSize.allowedValues[1]}
        aria-label="Larger font size"
        disabled={
          accessibility.fontSize ===
          appConfig.accessibility.fontSize.allowedValues[1]
        }
      >
        A
      </ToggleGroupItem>
    </ToggleGroup>
  );
};
