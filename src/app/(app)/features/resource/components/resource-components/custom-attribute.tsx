'use client';

import { Datum } from '../datum';
import { ResourceComponentProps } from '../component-registry';
import { useIconComponent } from '@/app/(app)/shared/hooks/useIconComponent';
import { interpolateResourceProperties } from '@/utils/interpolateResourceProperties';

export function CustomAttributeComponent({
  resource,
  customAttribute,
}: ResourceComponentProps) {
  const IconComponent = useIconComponent(customAttribute?.icon);

  if (!customAttribute) {
    return null;
  }

  const interpolatedTitle = interpolateResourceProperties(
    customAttribute.title,
    resource,
  );
  const interpolatedSubtitle = interpolateResourceProperties(
    customAttribute.subtitle,
    resource,
  );
  const interpolatedDescription = interpolateResourceProperties(
    customAttribute.description,
    resource,
  );
  const interpolatedUrl = interpolateResourceProperties(
    customAttribute.url,
    resource,
  );

  if (
    [
      interpolatedTitle,
      interpolatedSubtitle,
      interpolatedDescription,
      interpolatedUrl,
    ].some((value) => value.includes('{{'))
  ) {
    console.warn(
      'Interpolation warning: Some values still contain unreplaced placeholders',
      {
        interpolatedTitle,
        interpolatedSubtitle,
        interpolatedDescription,
        interpolatedUrl,
        customAttribute,
      },
    );

    return null;
  }

  return (
    <Datum
      title={interpolatedTitle}
      subtitle={interpolatedSubtitle}
      description={interpolatedDescription}
      icon={IconComponent}
      iconColor={customAttribute.iconColor}
      url={interpolatedUrl}
      urlTarget={customAttribute.urlTarget}
      titleBelow={customAttribute.titleBelow}
      size={customAttribute.size}
      shouldParseHtml={false}
    />
  );
}
