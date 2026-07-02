'use client';

import { cache } from 'react';

import { useIconComponent } from '@/app/(app)/shared/hooks/useIconComponent';
import { ResultType } from '@/app/(app)/shared/store/results';
import { createLogger } from '@/lib/logger';
import { Resource } from '@/types/resource';
import { interpolateResourceProperties } from '@/utils/interpolateResourceProperties';

import { ResourceComponentProps } from '../component-registry';
import { Datum, type DatumProps } from '../datum';

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
    log.debug(
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

  if (!interpolatedTitle && !interpolatedSubtitle && !interpolatedDescription) {
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
  withPadding?: boolean;
  labelAs?: DatumProps['labelAs'] | null;
};

export function CustomAttributeComponent({
  resource,
  customAttribute,
  withPadding,
  labelAs = 'h3',
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
      withPadding={withPadding}
      icon={IconComponent}
      iconColor={customAttribute.iconColor}
      urlTarget={customAttribute.urlTarget}
      titleBelow={customAttribute.titleBelow}
      size={customAttribute.size}
      labelAs={labelAs ?? undefined}
      shouldParseHtml={false}
    />
  );
}
