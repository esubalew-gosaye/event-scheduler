'use client';

import { useEffect, useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '@/styles/calendar.css';
import { apiService } from '@/lib/api-service';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EventDetailsDialog } from './event-details-dialog';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { isSameDay } from 'date-fns';

// Setup the localizer
const localizer = momentLocalizer(moment);

type Event = {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  is_recurring: boolean;
  recurrence_rule?: any;
};

type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  originalEvent: Event;
  isOccurrence?: boolean;
  occurrenceDate?: string;
};

export function CalendarView() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [showEventDetails, setShowEventDetails] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const fetchEvents = async (start: Date, end: Date) => {
    setLoading(true);
    try {
      // Add 1 month padding to ensure we get all recurring events
      const startDate = moment(start).subtract(1, 'month').format('YYYY-MM-DD');
      const endDate = moment(end).add(1, 'month').format('YYYY-MM-DD');

      const response = await apiService.getEvents({
        start_date: startDate,
        end_date: endDate,
        show_occurrences: true,
      });

      const calendarEvents: CalendarEvent[] = [];

      response.forEach((event: any) => {
        if (event.is_recurring && event.occurrences) {
          // Add recurring event occurrences
          event.occurrences.forEach((occurrence: string) => {
            const occurrenceStart = new Date(occurrence);
            const originalStart = new Date(event.start_time);
            const originalEnd = new Date(event.end_time);

            // Calculate the time difference to maintain the same duration and time of day
            const timeOfDay = {
              hours: originalStart.getHours(),
              minutes: originalStart.getMinutes(),
              seconds: originalStart.getSeconds(),
            };

            // Set the same time of day for the occurrence
            occurrenceStart.setHours(
              timeOfDay.hours,
              timeOfDay.minutes,
              timeOfDay.seconds
            );

            // Calculate duration of the original event
            const duration = originalEnd.getTime() - originalStart.getTime();
            const occurrenceEnd = new Date(
              occurrenceStart.getTime() + duration
            );

            calendarEvents.push({
              id: `${event.id}-${occurrence}`,
              title: event.title,
              start: occurrenceStart,
              end: occurrenceEnd,
              originalEvent: event,
              isOccurrence: true,
              occurrenceDate: occurrence,
            });
          });
        } else {
          // Add single event
          calendarEvents.push({
            id: event.id,
            title: event.title,
            start: new Date(event.start_time),
            end: new Date(event.end_time),
            originalEvent: event,
          });
        }
      });

      setEvents(calendarEvents);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load events',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Get current month's start and end
    const start = moment().startOf('month').toDate();
    const end = moment().endOf('month').toDate();
    fetchEvents(start, end);
  }, []);

  const handleRangeChange = (range: any) => {
    if (range.start && range.end) {
      fetchEvents(range.start, range.end);
    }
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  };

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    router.push(
      `/dashboard/new-event?start=${start.toISOString()}&end=${end.toISOString()}`
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="h-[700px] bg-white rounded-lg shadow p-4">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable
          onRangeChange={handleRangeChange}
          views={['month', 'week', 'day']}
          defaultView="month"
          style={{ height: '100%' }}
          formats={{
            timeGutterFormat: (date: Date) => format(date, 'h:mm a'),
            eventTimeRangeFormat: ({
              start,
              end,
            }: {
              start: Date;
              end: Date;
            }) => `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`,
            dayRangeHeaderFormat: ({
              start,
              end,
            }: {
              start: Date;
              end: Date;
            }) => `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`,
            dayFormat: (date: Date) => format(date, 'd'),
            monthHeaderFormat: (date: Date) => format(date, 'MMMM yyyy'),
            dayHeaderFormat: (date: Date) => format(date, 'cccc MM/dd'),
            weekdayFormat: (date: Date) => format(date, 'EEE'),
          }}
          components={{
            event: (props: any) => (
              <div
                className={`p-1 text-sm truncate ${
                  props.event.isOccurrence
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'bg-primary text-primary-foreground'
                } rounded`}
                title={`${props.title}\n${format(
                  props.event.start,
                  'h:mm a'
                )} - ${format(props.event.end, 'h:mm a')}`}
              >
                {props.title}
              </div>
            ),
            toolbar: (props: any) => (
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => props.onNavigate('TODAY')}
                  >
                    Today
                  </Button>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => props.onNavigate('PREV')}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => props.onNavigate('NEXT')}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <span className="text-lg font-semibold">
                    {format(props.date, 'MMMM yyyy')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {['month', 'week', 'day'].map((view) => (
                    <Button
                      key={view}
                      variant={props.view === view ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => props.onView(view)}
                    >
                      {view.charAt(0).toUpperCase() + view.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            ),
            timeSlotWrapper: (props: any) => (
              <div className="text-xs text-gray-500 bg-gray-50/50" {...props} />
            ),
          }}
          dayPropGetter={(date: Date) => ({
            className: 'font-medium',
            style: {
              backgroundColor: isSameDay(date, new Date())
                ? 'rgb(243 244 246)'
                : 'transparent',
            },
          })}
          slotPropGetter={(date: Date) => ({
            className: 'border-gray-100',
          })}
        />
      </div>

      {selectedEvent && (
        <EventDetailsDialog
          event={selectedEvent}
          isOpen={showEventDetails}
          onClose={() => setShowEventDetails(false)}
          onEdit={() => {
            router.push(
              `/dashboard/edit-event/${selectedEvent.originalEvent.id}`
            );
            setShowEventDetails(false);
          }}
        />
      )}
    </>
  );
}
