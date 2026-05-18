'use client';

import { Banner, StaggeredShimmers } from '@payloadcms/ui';

import { getLanguageName } from '../../../../app/(app)/shared/lib/language-names';
import { MetricsTable } from '../MetricsTable';
import { useLanguageSwitchDestinations } from '../useAnalyticsData';

export default function LanguageSwitchDestinationsWidget() {
  const { loading, error, data } = useLanguageSwitchDestinations();

  if (loading) return <StaggeredShimmers count={5} height={40} />;

  if (error) {
    return (
      <Banner type="error">
        <strong>Could not load language switch destinations.</strong> Please
        contact the support team.
      </Banner>
    );
  }

  const rows = (data?.languageSwitchDestinations ?? []).map((entry) => {
    const languageName = getLanguageName(entry.x, { displayLocale: 'en' });

    return {
      ...entry,
      x: languageName === entry.x ? entry.x : `${languageName} (${entry.x})`,
    };
  });

  return (
    <MetricsTable
      title="Language switches by destination"
      colLabel="Destination language"
      colValue="Count"
      rows={rows}
    />
  );
}
