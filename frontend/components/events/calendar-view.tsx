'use client';

import { useEffect, useState } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '@/styles/calendar.css';
import { apiService } from '@/lib/api-service';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EventDetailsDialog } from './event-details-dialog';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const localizer = momentLocalizer(moment);

type Event = {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  is_recurring: boolean;
  recurrence_rule?: any;
  occurrences?: string[];
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
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const router = useRouter();
  const { toast } = useToast();

  const fetchEvents = async (start: Date, end: Date) => {
    setLoading(true);
    try {
      const startDate = moment(start).format('YYYY-MM-DD');
      const endDate = moment(end).format('YYYY-MM-DD');

      const response = await apiService.getEvents({
        start_date: startDate,
        end_date: endDate,
        show_occurrences: true,
      });

      const calendarEvents: CalendarEvent[] = [];

      response.forEach((event: Event) => {
        if (event.is_recurring && event.occurrences) {
          event.occurrences.forEach((occurrence: string) => {
            const occurrenceDate = parseISO(occurrence);
            const originalStart = parseISO(event.start_time);
            const originalEnd = parseISO(event.end_time);
            
            // Calculate duration in milliseconds
            const duration = originalEnd.getTime() - originalStart.getTime();
            
            // Create new start date with same time as original but on occurrence date
            const occurrenceStart = new Date(occurrenceDate);
            occurrenceStart.setHours(
              originalStart.getHours(),
              originalStart.getMinutes(),
              originalStart.getSeconds()
            );
            
            // Create end date by adding duration
            const occurrenceEnd = new Date(occurrenceStart.getTime() + duration);

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
        }

        // Always add the original event
        calendarEvents.push({
          id: event.id,
          title: event.title,
          start: parseISO(event.start_time),
          end: parseISO(event.end_time),
          originalEvent: event,
        });
      });

      setEvents(calendarEvents);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load events',
        variant: 'destructive',
      });
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const start = moment(currentDate).startOf('month').toDate();
    const end = moment(currentDate).endOf('month').toDate();
    fetchEvents(start, end);
  }, [currentDate]);

  const handleNavigate = (newDate: Date) => {
    setCurrentDate(newDate);
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  };

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    const { start, end } = slotInfo;
    // Adjust end time if it's the same as start (default 30 min duration)
    const adjustedEnd = start.getTime() === end.getTime() 
      ? new Date(start.getTime() + 30 * 60000) 
      : end;
      
    router.push(
      `/dashboard/new-event?start=${start.toISOString()}&end=${adjustedEnd.toISOString()}`
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
          onNavigate={handleNavigate}
          date={currentDate}
          onRangeChange={() => {}}
          views={[Views.MONTH, Views.WEEK, Views.DAY]}
          defaultView={Views.MONTH}
          style={{ height: '100%' }}
          formats={{
            timeGutterFormat: 'h:mm a',
            eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) => 
              `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`,
            dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
              `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`,
          }}
          components={{
            event: ({ event }: { event: CalendarEvent }) => (
              <div
                className={`p-1 text-sm truncate rounded ${
                  event.isOccurrence
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'bg-primary text-primary-foreground'
                }`}
                title={`${event.title}\n${format(event.start, 'h:mm a')} - ${format(event.end, 'h:mm a')}`}
              >
                {event.title}
              </div>
            ),
            toolbar: (props) => (
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
                  {[Views.MONTH, Views.WEEK, Views.DAY].map((view) => (
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
          }}
          eventPropGetter={(event) => ({
            style: {
              backgroundColor: event.isOccurrence ? '#dbeafe' : '#3b82f6',
              color: event.isOccurrence ? '#1e40af' : 'white',
              borderColor: event.isOccurrence ? '#93c5fd' : '#3b82f6',
            },
          })}
        />
      </div>

      <EventDetailsDialog
        event={selectedEvent}
        isOpen={showEventDetails}
        onClose={() => setShowEventDetails(false)}
        onEdit={() => {
          if (selectedEvent) {
            router.push(`/dashboard/edit-event/${selectedEvent.originalEvent.id}`);
            setShowEventDetails(false);
          }
        }}
      />
    </>
  );
}