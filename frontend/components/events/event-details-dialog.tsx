"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { format } from "date-fns"
import { CalendarIcon, ClockIcon, EditIcon, TrashIcon } from "lucide-react"
import { useState } from "react"
import { apiService } from "@/lib/api-service"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

type EventDetailsDialogProps = {
  event: any
  isOpen: boolean
  onClose: () => void
  onEdit: () => void
}

export function EventDetailsDialog({ event, isOpen, onClose, onEdit }: EventDetailsDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  if (!event) return null

  const { originalEvent } = event
  const startTime = new Date(event.start)
  const endTime = new Date(event.end)

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this event?")) {
      return
    }

    setIsDeleting(true)

    try {
      await apiService.deleteEvent(originalEvent.id)

      toast({
        title: "Event deleted",
        description: "The event has been successfully deleted",
      })

      onClose()
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the event",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{originalEvent.title}</DialogTitle>
          <DialogDescription>{originalEvent.is_recurring && "Recurring event"}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {originalEvent.description && (
            <div className="space-y-1">
              <p className="text-sm font-medium">Description</p>
              <p className="text-sm text-gray-500">{originalEvent.description}</p>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-4 w-4 text-gray-500" />
            <span className="text-sm">{format(startTime, "EEEE, MMMM d, yyyy")}</span>
          </div>

          <div className="flex items-center space-x-2">
            <ClockIcon className="h-4 w-4 text-gray-500" />
            <span className="text-sm">
              {format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}
            </span>
          </div>

          {originalEvent.is_recurring && originalEvent.recurrence_rule && (
            <div className="space-y-1">
              <p className="text-sm font-medium">Recurrence</p>
              <p className="text-sm text-gray-500">{getRecurrenceDescription(originalEvent.recurrence_rule)}</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center space-x-1"
          >
            <TrashIcon className="h-4 w-4" />
            <span>{isDeleting ? "Deleting..." : "Delete"}</span>
          </Button>

          <Button variant="outline" size="sm" onClick={onEdit} className="flex items-center space-x-1">
            <EditIcon className="h-4 w-4" />
            <span>Edit</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function getRecurrenceDescription(rule: any): string {
  const { frequency, interval, weekdays, month_day, month, week_of_month, weekday_of_month } = rule

  const intervalText = interval > 1 ? `every ${interval} ` : "every "

  switch (frequency) {
    case "DAILY":
      return `Repeats ${intervalText}day${interval > 1 ? "s" : ""}`

    case "WEEKLY":
      if (weekdays) {
        const days = weekdays.split(",").map((day: string) => {
          const dayNum = Number.parseInt(day.trim())
          return ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][dayNum]
        })
        return `Repeats ${intervalText}week on ${days.join(", ")}`
      }
      return `Repeats ${intervalText}week`

    case "MONTHLY":
      if (month_day) {
        return `Repeats ${intervalText}month on day ${month_day}`
      }
      if (week_of_month && weekday_of_month !== undefined) {
        const weekText = week_of_month === -1 ? "last" : ["first", "second", "third", "fourth"][week_of_month - 1]
        const dayText = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][weekday_of_month]
        return `Repeats ${intervalText}month on the ${weekText} ${dayText}`
      }
      return `Repeats ${intervalText}month`

    case "YEARLY":
      if (month) {
        const monthName = [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ][month - 1]
        if (month_day) {
          return `Repeats ${intervalText}year on ${monthName} ${month_day}`
        }
        return `Repeats ${intervalText}year in ${monthName}`
      }
      return `Repeats ${intervalText}year`

    default:
      return "Custom recurrence"
  }
}
