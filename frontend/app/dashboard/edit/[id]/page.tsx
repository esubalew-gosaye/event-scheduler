'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { EventForm } from '@/components/events/event-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiService } from '@/lib/api-service';
import { useToast } from '@/hooks/use-toast';

export default function EditEventPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [event, setEvent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const data = await apiService.getEvent(params.id);
        setEvent(data);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load event',
          variant: 'destructive',
        });
        router.push('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [params.id, router, toast]);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4" />
              <div className="h-8 bg-gray-200 rounded w-3/4" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit Event</CardTitle>
        </CardHeader>
        <CardContent>
          <EventForm event={event} />
        </CardContent>
      </Card>
    </div>
  );
}
