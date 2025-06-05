'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Calendar, Clock, Edit, Trash } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiService } from '@/lib/api-service';
import { useToast } from '@/hooks/use-toast';

type Event = {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  is_recurring: boolean;
  recurrence_rule?: any;
};

export function EventList({ selectedDate }: { selectedDate?: Date }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const params: any = { show_occurrences: true };
        if (selectedDate) {
          params.start_date = format(selectedDate, 'yyyy-MM-dd');
          params.end_date = format(selectedDate, 'yyyy-MM-dd');
        }
        const data = await apiService.getEvents(params);
        setEvents(data);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load events',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [selectedDate, toast]);

  const handleDelete = async (eventId: string) => {
    try {
      await apiService.deleteEvent(eventId);
      setEvents((prev) => prev.filter((event) => event.id !== eventId));
      toast({
        title: 'Event deleted',
        description: 'The event has been deleted successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete event',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((n) => (
          <Card key={n} className="animate-pulse">
            <CardContent className="h-24" />
          </Card>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No events found for the selected criteria.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <Card key={event.id}>
          <CardHeader className="p-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">{event.title}</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/dashboard/edit/${event.id}`}>
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Trash className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Event</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this event? This action
                        cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(event.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {event.description && (
              <p className="text-muted-foreground mb-4">{event.description}</p>
            )}
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(event.start_time), 'PPP')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>
                  {format(new Date(event.start_time), 'p')} -{' '}
                  {format(new Date(event.end_time), 'p')}
                </span>
              </div>
              {event.is_recurring && (
                <div className="mt-2 text-xs">
                  <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                    Recurring Event
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
