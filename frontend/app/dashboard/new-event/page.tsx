import { EventForm } from "@/components/events/event-form"

export default function NewEventPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Create New Event</h1>
      </div>
      <EventForm />
    </div>
  )
}
