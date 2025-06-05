import { EventForm } from "@/components/events/event-form"

export default function EditEventPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Edit Event</h1>
      </div>
      <EventForm eventId={params.id} />
    </div>
  )
}
