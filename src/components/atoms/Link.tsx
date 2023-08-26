import IntlLink from 'next-intl/link';
import { LinkProps } from 'next/link';

export default function Link({
  children,
  className = '',
  ...rest
}: {
  children: React.ReactNode;
  locale?: string;
  className?: string;
} & LinkProps) {
  return (
    <IntlLink className={`flex items-center gap-0.1 ${className}`} {...rest}>
      {children}
    </IntlLink>
  );
}
