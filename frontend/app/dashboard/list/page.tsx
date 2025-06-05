import { EventListView } from '@/components/events/event-list-view';

export default function EventListPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Upcoming Events</h1>
      </div>
      <EventListView />
    </div>
  );
}
