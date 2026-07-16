'use client';

import type { ReactNode } from 'react';

import { WidgetInfoButton } from './WidgetInfoButton';

export function WidgetCard({
  title,
  description,
  height,
  headingLevel = 'h4',
  bordered = false,
  children,
}: {
  title: string;
  description?: string;
  height?: string | number;
  headingLevel?: 'h3' | 'h4';
  bordered?: boolean;
  children: ReactNode;
}) {
  const Heading = headingLevel;

  return (
    <div
      style={
        bordered
          ? {
              border: '1px solid var(--theme-elevation-150)',
              borderRadius: '0.5rem',
              padding: '1rem',
              background: 'var(--theme-elevation-0)',
              height,
            }
          : { height }
      }
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: bordered ? '0.75rem' : '0.5rem',
          height: '100%',
        }}
      >
        <Heading
          style={{
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            fontSize: headingLevel === 'h3' ? undefined : '1rem',
            fontWeight: headingLevel === 'h3' ? undefined : 600,
            color: 'var(--theme-text)',
          }}
        >
          {title}
          <WidgetInfoButton description={description} />
        </Heading>
        {children}
      </div>
    </div>
  );
}
