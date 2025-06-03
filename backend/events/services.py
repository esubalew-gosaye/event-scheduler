from dateutil.rrule import rrule, DAILY, WEEKLY, MONTHLY, YEARLY, MO, TU, WE, TH, FR, SA, SU
from dateutil.relativedelta import relativedelta
from datetime import datetime, timedelta
from .models import FrequencyType, Weekday, MonthWeek
from django.utils import timezone
import math

class RecurrenceService:
    @staticmethod
    def get_weekday_mapping():
        return {
            Weekday.MONDAY: MO,
            Weekday.TUESDAY: TU,
            Weekday.WEDNESDAY: WE,
            Weekday.THURSDAY: TH,
            Weekday.FRIDAY: FR,
            Weekday.SATURDAY: SA,
            Weekday.SUNDAY: SU,
        }

    @staticmethod
    def generate_occurrences(event, start_date=None, end_date=None):
        if not event.is_recurring:
            return [{
                'start_time': event.start_time,
                'end_time': event.end_time,
                'event_id': event.id,
                'is_original': True
            }]

        rule = event.recurrence_rule
        freq_mapping = {
            FrequencyType.DAILY: DAILY,
            FrequencyType.WEEKLY: WEEKLY,
            FrequencyType.MONTHLY: MONTHLY,
            FrequencyType.YEARLY: YEARLY,
        }
        
        freq = freq_mapping[rule.frequency]
        interval = rule.interval
        dtstart = event.start_time
        until = rule.until or end_date or (timezone.now() + timedelta(days=365*2))
        
        # Handle count if provided
        count = rule.count if rule.count else None
        
        # Handle weekdays for weekly recurrence
        byweekday = None
        if rule.frequency == FrequencyType.WEEKLY and rule.weekdays:
            weekday_mapping = RecurrenceService.get_weekday_mapping()
            weekdays = [int(day) for day in rule.weekdays.split(',')]
            byweekday = [weekday_mapping[day] for day in weekdays]
        
        # Handle month day for monthly recurrence
        bymonthday = rule.month_day if rule.frequency == FrequencyType.MONTHLY and rule.month_day else None
        
        # Handle relative weekdays (e.g., 2nd Friday of the month)
        if rule.frequency == FrequencyType.MONTHLY and rule.week_of_month and rule.weekday_of_month:
            weekday_mapping = RecurrenceService.get_weekday_mapping()
            byweekday = weekday_mapping[rule.weekday_of_month]
            
            if rule.week_of_month == MonthWeek.LAST:
                occurrences = []
                current_date = dtstart
                while current_date <= until:
                    # Find last weekday of month
                    last_day = current_date.replace(day=28) + timedelta(days=4)
                    last_day = last_day - timedelta(days=last_day.day)
                    
                    # Find the last occurrence of the weekday
                    while last_day.weekday() != rule.weekday_of_month:
                        last_day -= timedelta(days=1)
                    
                    if last_day >= current_date:
                        occurrences.append(last_day)
                    
                    # Move to next month
                    current_date = last_day + timedelta(days=1)
                    current_date = current_date.replace(day=1)
                
                return [{
                    'start_time': dt,
                    'end_time': dt + (event.end_time - event.start_time),
                    'event_id': event.id,
                    'is_original': False
                } for dt in occurrences]
            else:
                # For non-last week of month
                bysetpos = rule.week_of_month
        else:
            bysetpos = None
        
        # Handle yearly recurrence with specific month
        bymonth = rule.month if rule.frequency == FrequencyType.YEARLY and rule.month else None
        
        # Generate occurrences using rrule
        rr = rrule(
            freq=freq,
            interval=interval,
            dtstart=dtstart,
            until=until,
            count=count,
            byweekday=byweekday,
            bymonthday=bymonthday,
            bysetpos=bysetpos,
            bymonth=bymonth
        )
        
        occurrences = []
        for dt in rr:
            if start_date and dt < start_date:
                continue
            if end_date and dt > end_date:
                break
                
            occurrences.append({
                'start_time': dt,
                'end_time': dt + (event.end_time - event.start_time),
                'event_id': event.id,
                'is_original': dt == dtstart
            })
        
        return occurrences