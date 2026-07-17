'use client';

import { getLanguageName } from '../../../../app/(app)/shared/lib/language-names';
import { MetricsTable } from '../MetricsTable';
import { useAnalyticsLanguageSwitches } from '../useAnalyticsData';
import { WIDGET_INFO, WidgetSlug } from '../widgetInfo';

export default function LanguageSwitchDestinationsWidget() {
  const { loading, error, data, refetch } = useAnalyticsLanguageSwitches();

  const rows = (data ?? []).map((entry) => {
    const languageName = getLanguageName(entry.language, { displayLocale: 'en' });

    return {
      x: languageName === entry.language ? entry.language : `${languageName} (${entry.language})`,
      y: entry.count,
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
      loading={loading && !data}
      errorTitle={
        error ? 'Could not load language switch destinations.' : undefined
      }
      errorDescription={error ? 'Please contact the support team.' : undefined}
    />
  );
}
