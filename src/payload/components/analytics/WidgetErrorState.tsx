'use client';

import { Banner, Button } from '@payloadcms/ui';

type WidgetErrorStateProps = {
  title: string;
  description?: string;
  onRetry: () => void;
  /** True while a retry triggered from this banner is in flight. */
  retrying?: boolean;
};

export function WidgetErrorState({
  title,
  description,
  onRetry,
  retrying = false,
}: WidgetErrorStateProps) {
  return (
    <Banner type="error">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
        <span>
          <strong>{title}</strong>
          {description ? ` ${description}` : null}
        </span>
        <Button
          buttonStyle="secondary"
          size="small"
          onClick={onRetry}
          disabled={retrying}
        >
          {retrying ? 'Retrying…' : 'Retry'}
        </Button>
      </div>
    </Banner>
  );
}
