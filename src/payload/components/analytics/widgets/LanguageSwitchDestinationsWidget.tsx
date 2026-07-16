'use client';

import { getLanguageName } from '../../../../app/(app)/shared/lib/language-names';
import { MetricsTable } from '../MetricsTable';
import { useLanguageSwitchDestinations } from '../useAnalyticsData';
import { WIDGET_INFO, WidgetSlug } from '../widgetInfo';

export default function LanguageSwitchDestinationsWidget() {
  const { loading, error, data, refetch } = useLanguageSwitchDestinations();

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
      description={WIDGET_INFO[WidgetSlug.LanguageSwitchDestinations]}
      colLabel="Destination language"
      colValue="Count"
      rows={rows}
      onRefresh={refetch}
      refreshing={loading}
      loading={loading}
      errorTitle={
        error ? 'Could not load language switch destinations.' : undefined
      }
      errorDescription={error ? 'Please contact the support team.' : undefined}
    />
  );
}
