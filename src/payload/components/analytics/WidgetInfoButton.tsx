'use client';

import { Popup } from '@payloadcms/ui';
import { InfoIcon } from 'lucide-react';
import { useState } from 'react';

export function WidgetInfoButton({ description }: { description?: string }) {
  const [hovered, setHovered] = useState(false);

  if (!description) return null;

  return (
    <Popup
      button={
        <span
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            lineHeight: 0,
            color: hovered
              ? 'var(--theme-elevation-600)'
              : 'var(--theme-elevation-400)',
          }}
        >
          <InfoIcon size={14} />
        </span>
      }
      buttonType="custom"
      size="small"
      horizontalAlign="left"
      render={() => (
        <div
          style={{
            padding: '0.75rem 0.875rem',
            maxWidth: 260,
            fontSize: '0.8125rem',
            lineHeight: 1.4,
            fontWeight: 400,
            textTransform: 'none',
            letterSpacing: 'normal',
            color: 'var(--theme-text)',
            whiteSpace: 'normal',
          }}
        >
          {description}
        </div>
      )}
    />
  );
}
