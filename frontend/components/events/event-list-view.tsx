"use client"

import { useEffect, useState } from "react"
import { apiService } from "@/lib/api-service"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { CalendarIcon, ChevronRightIcon, ClockIcon, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

type Event = {
  id: string
  title: string
  description: string
  start_time: string
  end_time: string
  is_recurring: boolean
}

export function EventListView() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true)
      try {
        // Get events for the next 30 days
        const today = new Date()
        const thirtyDaysLater = new Date()
        thirtyDaysLater.setDate(today.getDate() + 30)

        const startDate = format(today, "yyyy-MM-dd")
        const endDate = format(thirtyDaysLater, "yyyy-MM-dd")

        const response = await apiService.getEvents({
          start_date: startDate,
          end_date: endDate,
          show_occurrences: true,
        })

        setEvents(response)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load events",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [toast])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium mb-2">No upcoming events</h3>
        <p className="text-gray-500 mb-6">You don&apos;t have any events scheduled for the next 30 days.</p>
        <Button onClick={() => router.push("/dashboard/new-event")}>Create Event</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <Card key={event.id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle>{event.title}</CardTitle>
            {event.is_recurring && <CardDescription>Recurring event</CardDescription>}
          </CardHeader>
          <CardContent className="pb-3">
            {event.description && <p className="text-sm text-gray-500 mb-4">{event.description}</p>}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{format(new Date(event.start_time), "EEEE, MMMM d, yyyy")}</span>
              </div>
              <div className="flex items-center space-x-2">
                <ClockIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  {format(new Date(event.start_time), "h:mm a")} - {format(new Date(event.end_time), "h:mm a")}
                </span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Link href={`/dashboard/edit-event/${event.id}`} className="w-full">
              <Button variant="outline" className="w-full flex items-center justify-between">
                <span>View Details</span>
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
