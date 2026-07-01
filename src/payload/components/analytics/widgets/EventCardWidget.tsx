import EventCardWidgetClient from './EventCardWidgetClient';

type EventCardWidgetData = {
  event?: string;
  property?: string;
};

export default function EventCardWidget({
  widgetData,
}: {
  widgetData?: EventCardWidgetData;
}) {
  return <EventCardWidgetClient widgetData={widgetData} />;
}
