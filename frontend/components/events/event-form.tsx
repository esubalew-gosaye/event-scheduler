'use client';

import type React from 'react';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { apiService } from '@/lib/api-service';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

type EventFormProps = {
  eventId?: string;
};

export function EventForm({ eventId }: EventFormProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingEvent, setIsLoadingEvent] = useState(!!eventId);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    is_recurring: false,
    recurrence_rule: {
      frequency: 'DAILY',
      interval: 1,
      count: null as number | null,
      until: null as string | null,
      weekdays: null as string | null,
      month_day: null as number | null,
      month: null as number | null,
      week_of_month: null as number | null,
      weekday_of_month: null as number | null,
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load event data if editing
  useEffect(() => {
    if (eventId) {
      const fetchEvent = async () => {
        try {
          const event = await apiService.getEvent(eventId);

          const startDate = format(new Date(event.start_time), 'yyyy-MM-dd');
          const startTime = format(new Date(event.start_time), 'HH:mm');
          const endDate = format(new Date(event.end_time), 'yyyy-MM-dd');
          const endTime = format(new Date(event.end_time), 'HH:mm');

          setFormData({
            title: event.title,
            description: event.description || '',
            start_date: startDate,
            start_time: startTime,
            end_date: endDate,
            end_time: endTime,
            is_recurring: event.is_recurring,
            recurrence_rule: event.recurrence_rule || {
              frequency: 'DAILY',
              interval: 1,
              count: null,
              until: null,
              weekdays: null,
              month_day: null,
              month: null,
              week_of_month: null,
              weekday_of_month: null,
            },
          });
        } catch (error) {
          toast({
            title: 'Error',
            description: 'Failed to load event',
            variant: 'destructive',
          });
          router.push('/dashboard');
        } finally {
          setIsLoadingEvent(false);
        }
      };

      fetchEvent();
    } else {
      // If creating a new event, check for start/end params
      const startParam = searchParams?.get('start');
      const endParam = searchParams?.get('end');

      if (startParam) {
        const startDate = new Date(startParam);
        setFormData((prev) => ({
          ...prev,
          start_date: format(startDate, 'yyyy-MM-dd'),
          start_time: format(startDate, 'HH:mm'),
        }));
      }

      if (endParam) {
        const endDate = new Date(endParam);
        setFormData((prev) => ({
          ...prev,
          end_date: format(endDate, 'yyyy-MM-dd'),
          end_time: format(endDate, 'HH:mm'),
        }));
      }
    }
  }, [eventId, router, searchParams, toast]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, is_recurring: checked }));
  };

  const handleRecurrenceChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      recurrence_rule: {
        ...prev.recurrence_rule,
        [field]: value,
      },
    }));
  };

  const handleWeekdayChange = (day: number, checked: boolean) => {
    const currentWeekdays = formData.recurrence_rule.weekdays
      ? formData.recurrence_rule.weekdays.split(',').map(Number)
      : [];

    let newWeekdays: number[];

    if (checked) {
      newWeekdays = [...currentWeekdays, day].sort();
    } else {
      newWeekdays = currentWeekdays.filter((d) => d !== day);
    }

    handleRecurrenceChange(
      'weekdays',
      newWeekdays.length > 0 ? newWeekdays.join(',') : null
    );
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }

    if (!formData.start_time) {
      newErrors.start_time = 'Start time is required';
    }

    if (!formData.end_date) {
      newErrors.end_date = 'End date is required';
    }

    if (!formData.end_time) {
      newErrors.end_time = 'End time is required';
    }

    // Check if end datetime is after start datetime
    const startDateTime = new Date(
      `${formData.start_date}T${formData.start_time}`
    );
    const endDateTime = new Date(`${formData.end_date}T${formData.end_time}`);

    if (endDateTime <= startDateTime) {
      newErrors.end_time = 'End time must be after start time';
    }

    // Validate recurrence rule if recurring
    if (formData.is_recurring) {
      const { frequency, interval } = formData.recurrence_rule;

      if (!frequency) {
        newErrors.frequency = 'Frequency is required';
      }

      if (!interval || interval < 1) {
        newErrors.interval = 'Interval must be at least 1';
      }

      if (frequency === 'WEEKLY' && !formData.recurrence_rule.weekdays) {
        newErrors.weekdays = 'Select at least one day of the week';
      }

      if (
        frequency === 'MONTHLY' &&
        !formData.recurrence_rule.month_day &&
        (formData.recurrence_rule.week_of_month === null ||
          formData.recurrence_rule.weekday_of_month === null)
      ) {
        newErrors.month_pattern = 'Select a monthly pattern';
      }

      if (frequency === 'YEARLY' && !formData.recurrence_rule.month) {
        newErrors.month = 'Select a month';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Prepare event data
      const startDateTime = new Date(
        `${formData.start_date}T${formData.start_time}`
      );
      const endDateTime = new Date(`${formData.end_date}T${formData.end_time}`);

      const eventData = {
        title: formData.title,
        description: formData.description,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        is_recurring: formData.is_recurring,
        recurrence_rule: formData.is_recurring
          ? formData.recurrence_rule
          : null,
      };

      if (eventId) {
        await apiService.updateEvent(eventId, eventData);
        toast({
          title: 'Event updated',
          description: 'Your event has been updated successfully',
        });
      } else {
        await apiService.createEvent(eventData);
        toast({
          title: 'Event created',
          description: 'Your event has been created successfully',
        });
      }

      router.push('/dashboard');
    } catch (error: any) {
      const apiErrors = error.response?.data || {};

      // Map API errors to form fields
      const fieldErrors: Record<string, string> = {};
      Object.entries(apiErrors).forEach(([key, value]) => {
        fieldErrors[key] = Array.isArray(value) ? value[0] : String(value);
      });

      setErrors(fieldErrors);

      toast({
        title: eventId ? 'Failed to update event' : 'Failed to create event',
        description: 'Please check the form for errors',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingEvent) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block mb-4">
            <svg
              className="animate-spin h-8 w-8 text-primary"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
          <p className="text-gray-500">Loading event...</p>
        </div>
      </div>
    );
  }

  const weekdays = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];
  const selectedWeekdays = formData.recurrence_rule.weekdays
    ? formData.recurrence_rule.weekdays.split(',').map(Number)
    : [];

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>{eventId ? 'Edit Event' : 'Create New Event'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Event Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter event title"
                disabled={isLoading}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter event description"
                disabled={isLoading}
                className="min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  name="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                {errors.start_date && (
                  <p className="text-sm text-red-500">{errors.start_date}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_time">Start Time</Label>
                <Input
                  id="start_time"
                  name="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                {errors.start_time && (
                  <p className="text-sm text-red-500">{errors.start_time}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  name="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                {errors.end_date && (
                  <p className="text-sm text-red-500">{errors.end_date}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  name="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                {errors.end_time && (
                  <p className="text-sm text-red-500">{errors.end_time}</p>
                )}
              </div>
            </div>
          </div>

          {/* Recurrence Options */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_recurring"
                checked={formData.is_recurring}
                onCheckedChange={handleSwitchChange}
                disabled={isLoading}
              />
              <Label htmlFor="is_recurring">Recurring Event</Label>
            </div>

            {formData.is_recurring && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                {/* Frequency and Interval */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Select
                      value={formData.recurrence_rule.frequency}
                      onValueChange={(value) =>
                        handleRecurrenceChange('frequency', value)
                      }
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        <SelectItem value="DAILY">Daily</SelectItem>
                        <SelectItem value="WEEKLY">Weekly</SelectItem>
                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                        <SelectItem value="YEARLY">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.frequency && (
                      <p className="text-sm text-red-500">{errors.frequency}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Repeat every</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        value={formData.recurrence_rule.interval}
                        onChange={(e) =>
                          handleRecurrenceChange(
                            'interval',
                            Number.parseInt(e.target.value) || 1
                          )
                        }
                        disabled={isLoading}
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">
                        {formData.recurrence_rule.frequency === 'DAILY' &&
                          'day(s)'}
                        {formData.recurrence_rule.frequency === 'WEEKLY' &&
                          'week(s)'}
                        {formData.recurrence_rule.frequency === 'MONTHLY' &&
                          'month(s)'}
                        {formData.recurrence_rule.frequency === 'YEARLY' &&
                          'year(s)'}
                      </span>
                    </div>
                    {errors.interval && (
                      <p className="text-sm text-red-500">{errors.interval}</p>
                    )}
                  </div>
                </div>

                {/* Weekly Options */}
                {formData.recurrence_rule.frequency === 'WEEKLY' && (
                  <div className="space-y-2">
                    <Label>Repeat on</Label>
                    <div className="flex flex-wrap gap-4">
                      {weekdays.map((day, index) => (
                        <div key={day} className="flex items-center space-x-2">
                          <Checkbox
                            id={`weekday-${index}`}
                            checked={selectedWeekdays.includes(index)}
                            onCheckedChange={(checked) =>
                              handleWeekdayChange(index, checked as boolean)
                            }
                            disabled={isLoading}
                          />
                          <Label
                            htmlFor={`weekday-${index}`}
                            className="text-sm"
                          >
                            {day}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {errors.weekdays && (
                      <p className="text-sm text-red-500">{errors.weekdays}</p>
                    )}
                  </div>
                )}

                {/* Monthly Options */}
                {formData.recurrence_rule.frequency === 'MONTHLY' && (
                  <div className="space-y-4">
                    <Label>Repeat on</Label>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <input
                          type="radio"
                          id="monthly-day"
                          name="monthly-pattern"
                          checked={formData.recurrence_rule.month_day !== null}
                          onChange={() => {
                            handleRecurrenceChange('month_day', 1);
                            handleRecurrenceChange('week_of_month', null);
                            handleRecurrenceChange('weekday_of_month', null);
                          }}
                          disabled={isLoading}
                          className="text-primary"
                        />
                        <Label
                          htmlFor="monthly-day"
                          className="flex items-center gap-2"
                        >
                          Day
                          <Input
                            type="number"
                            min="1"
                            max="31"
                            value={formData.recurrence_rule.month_day || ''}
                            onChange={(e) =>
                              handleRecurrenceChange(
                                'month_day',
                                Number.parseInt(e.target.value) || null
                              )
                            }
                            disabled={
                              isLoading ||
                              formData.recurrence_rule.month_day === null
                            }
                            className="w-20"
                          />
                          of the month
                        </Label>
                      </div>

                      <div className="flex items-center space-x-4">
                        <input
                          type="radio"
                          id="monthly-relative"
                          name="monthly-pattern"
                          checked={
                            formData.recurrence_rule.week_of_month !== null
                          }
                          onChange={() => {
                            handleRecurrenceChange('month_day', null);
                            handleRecurrenceChange('week_of_month', 1);
                            handleRecurrenceChange('weekday_of_month', 0);
                          }}
                          disabled={isLoading}
                          className="text-primary"
                        />
                        <div className="flex items-center gap-2">
                          <Label>On the</Label>
                          <Select
                            value={
                              formData.recurrence_rule.week_of_month?.toString() ||
                              ''
                            }
                            onValueChange={(value) =>
                              handleRecurrenceChange(
                                'week_of_month',
                                Number.parseInt(value)
                              )
                            }
                            disabled={
                              isLoading ||
                              formData.recurrence_rule.week_of_month === null
                            }
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent position="popper">
                              <SelectItem value="1">First</SelectItem>
                              <SelectItem value="2">Second</SelectItem>
                              <SelectItem value="3">Third</SelectItem>
                              <SelectItem value="4">Fourth</SelectItem>
                              <SelectItem value="-1">Last</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select
                            value={
                              formData.recurrence_rule.weekday_of_month?.toString() ||
                              ''
                            }
                            onValueChange={(value) =>
                              handleRecurrenceChange(
                                'weekday_of_month',
                                Number.parseInt(value)
                              )
                            }
                            disabled={
                              isLoading ||
                              formData.recurrence_rule.weekday_of_month === null
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent position="popper">
                              {weekdays.map((day, index) => (
                                <SelectItem key={day} value={index.toString()}>
                                  {day}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    {errors.month_pattern && (
                      <p className="text-sm text-red-500">
                        {errors.month_pattern}
                      </p>
                    )}
                  </div>
                )}

                {/* Yearly Options */}
                {formData.recurrence_rule.frequency === 'YEARLY' && (
                  <div className="space-y-2">
                    <Label>Month</Label>
                    <Select
                      value={formData.recurrence_rule.month?.toString() || ''}
                      onValueChange={(value) =>
                        handleRecurrenceChange('month', Number.parseInt(value))
                      }
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select month" />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {[
                          'January',
                          'February',
                          'March',
                          'April',
                          'May',
                          'June',
                          'July',
                          'August',
                          'September',
                          'October',
                          'November',
                          'December',
                        ].map((month, index) => (
                          <SelectItem
                            key={month}
                            value={(index + 1).toString()}
                          >
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.month && (
                      <p className="text-sm text-red-500">{errors.month}</p>
                    )}
                  </div>
                )}

                {/* End Options */}
                <div className="space-y-2 border-t border-border/50 pt-4 mt-4">
                  <Label className="font-medium">End recurrence</Label>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="end-never"
                        name="end-pattern"
                        checked={
                          !formData.recurrence_rule.count &&
                          !formData.recurrence_rule.until
                        }
                        onChange={() => {
                          handleRecurrenceChange('count', null);
                          handleRecurrenceChange('until', null);
                        }}
                        className="text-primary"
                      />
                      <Label htmlFor="end-never">Never</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="end-after"
                        name="end-pattern"
                        checked={formData.recurrence_rule.count !== null}
                        onChange={() => {
                          handleRecurrenceChange('count', 1);
                          handleRecurrenceChange('until', null);
                        }}
                        className="text-primary"
                      />
                      <Label
                        htmlFor="end-after"
                        className="flex items-center gap-2"
                      >
                        After
                        <Input
                          type="number"
                          min="1"
                          placeholder="occurrences"
                          value={formData.recurrence_rule.count || ''}
                          onChange={(e) =>
                            handleRecurrenceChange(
                              'count',
                              Number.parseInt(e.target.value) || null
                            )
                          }
                          disabled={formData.recurrence_rule.count === null}
                          className="w-24"
                        />
                        occurrences
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? 'Saving...'
              : eventId
              ? 'Update Event'
              : 'Create Event'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
