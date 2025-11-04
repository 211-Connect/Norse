import { useMemo } from 'react';
import { LinkIcon, Send } from 'lucide-react';
import Link from 'next/link';

import { PhoneNumbersSection } from './phone-number-section';
import { Separator } from './separator';

export function ContactSection({ resource }) {
  const { email, phoneNumbers, website } = useMemo(() => {
    const { phoneNumbers, website, email } = resource ?? {};
    return { phoneNumbers, website, email };
  }, [resource]);

  const shouldRender =
    email || (phoneNumbers && phoneNumbers.length > 0) || website;
  if (!shouldRender) {
    return null;
  }

  return (
    <>
      <Separator />
      <div className="flex flex-col gap-8">
        <PhoneNumbersSection phoneNumbers={phoneNumbers} />
        {website && (
          <div className="flex items-center gap-[6px]">
            <LinkIcon className="size-4" />
            <Link
              className="flex-1 text-sm text-custom-blue hover:underline"
              href={website}
            >
              {website}
            </Link>
          </div>
        )}
        {email && (
          <div className="flex items-center gap-[6px]">
            <Send className="size-4" />
            <Link
              className="flex-1 text-sm hover:underline"
              href={`mailto:${email}`}
            >
              {email}
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
