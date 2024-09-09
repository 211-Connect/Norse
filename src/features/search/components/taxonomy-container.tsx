import { badgeVariants } from '@/shared/components/ui/badge';
import { cn } from '@/shared/lib/utils';
import { TaxonomyService } from '@/shared/services/taxonomy-service';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export function TaxonomyContainer() {
  const router = useRouter();
  const [taxonomies, setTaxonomies] = useState([]);
  const { data } = useQuery({
    queryKey: [...taxonomies],
    queryFn: async () => {
      if (taxonomies.length === 0) return [];

      const data = await TaxonomyService.getTaxonomyTerms(taxonomies, {
        locale: router.locale,
      });

      return data;
    },
  });

  useEffect(() => {
    if (router.query.query_type === 'taxonomy') {
      setTaxonomies((router?.query?.query as string)?.split(',') ?? []);
    } else {
      setTaxonomies([]);
    }
  }, [router.query]);

  return (
    <div className="flex flex-wrap gap-1">
      {data?.map((tax) => (
        <Link
          key={tax.code}
          className={cn(badgeVariants(), 'hover:underline')}
          href={`/search?query=${tax.code}&query_label=${tax.name}&query_type=taxonomy`}
        >
          {tax.name}
        </Link>
      ))}
    </div>
  );
}
