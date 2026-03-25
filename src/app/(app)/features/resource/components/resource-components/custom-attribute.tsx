'use client';

import { Datum } from '../datum';
import { ResourceComponentProps } from '../component-registry';
import { useIconComponent } from '@/app/(app)/shared/hooks/useIconComponent';
import { interpolateResourceProperties } from '@/utils/interpolateResourceProperties';
import { Resource } from '@/types/resource';
import { ResultType } from '@/app/(app)/shared/store/results';
import { createLogger } from '@/lib/logger';
import { cache } from 'react';

const log = createLogger('CustomAttributeComponent');

const getCustomAttributePropsOrig = ({
  resource,
  customAttribute,
}: CustomAttributeComponentProps): {
  title: string;
  subtitle: string;
  description: string;
  url: string;
} | null => {
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
    log.warn(
      {
        interpolatedTitle,
        interpolatedSubtitle,
        interpolatedDescription,
        interpolatedUrl,
        customAttribute,
      },
      'Interpolation warning: Some values still contain unreplaced placeholders',
    );

    return null;
  }

  return {
    title: interpolatedTitle,
    subtitle: interpolatedSubtitle,
    description: interpolatedDescription,
    url: interpolatedUrl,
  };
};

export const getCustomAttributeProps = cache(getCustomAttributePropsOrig);

type CustomAttributeComponentProps = Pick<
  ResourceComponentProps,
  'customAttribute'
> & {
  resource: Resource | ResultType;
};

export function CustomAttributeComponent({
  resource,
  customAttribute,
}: CustomAttributeComponentProps) {
  const IconComponent = useIconComponent(customAttribute?.icon);

  if (!customAttribute) {
    log.warn(
      'CustomAttributeComponent rendered without customAttribute config',
    );
    return null;
  }

  const customAttributeProps = getCustomAttributeProps({
    resource,
    customAttribute,
  });

  if (!customAttributeProps) {
    return null;
  }

  return (
    <Datum
      {...customAttributeProps}
      icon={IconComponent}
      iconColor={customAttribute.iconColor}
      urlTarget={customAttribute.urlTarget}
      titleBelow={customAttribute.titleBelow}
      size={customAttribute.size}
      shouldParseHtml={false}
    />
  );
}
