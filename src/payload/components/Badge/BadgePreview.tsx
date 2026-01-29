'use client';

import { useWatchForm } from '@payloadcms/ui';
import { type FC, useMemo } from 'react';
import { Badge } from '@/app/(app)/shared/components/ui/badge';
import './styles.css';
import { ResourceDirectoryBadgeListItem } from '@/payload/collections/ResourceDirectories/types/badge';

interface BadgePreviewProps {
  path: string;
}

export const BadgePreview: FC<BadgePreviewProps> = ({ path }) => {
  const { getDataByPath } = useWatchForm();

  const badgeRowPath = useMemo(() => {
    return path.replace(/\.[^.]+$/, '');
  }, [path]);

  const badgeData: ResourceDirectoryBadgeListItem | undefined =
    getDataByPath(badgeRowPath);

  if (!badgeData) {
    return null;
  }

  const displayLabel = badgeData?.badgeLabel || 'Preview';

  return (
    <div className="badge-preview">
      <div className="badge-preview-label">Preview:</div>
      <div className="badge-preview-container">
        <Badge
          color={badgeData.color}
          badgeStyle={badgeData.style}
          icon={badgeData.icon}
          tooltip={badgeData.tooltip || undefined}
          label={displayLabel}
        />
      </div>
    </div>
  );
};

export default BadgePreview;
