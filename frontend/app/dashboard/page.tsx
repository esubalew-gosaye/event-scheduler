import { CalendarView } from "@/components/events/calendar-view"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Calendar</h1>
      </div>
      <CalendarView />
    </div>
  )
}
