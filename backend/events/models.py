from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from dateutil.rrule import rrule, DAILY, WEEKLY, MONTHLY, YEARLY
import dateutil.parser
from enum import Enum

User = get_user_model()

class FrequencyType(models.TextChoices):
    DAILY = 'DAILY', 'Daily'
    WEEKLY = 'WEEKLY', 'Weekly'
    MONTHLY = 'MONTHLY', 'Monthly'
    YEARLY = 'YEARLY', 'Yearly'

class Weekday(models.IntegerChoices):
    MONDAY = 0, 'Monday'
    TUESDAY = 1, 'Tuesday'
    WEDNESDAY = 2, 'Wednesday'
    THURSDAY = 3, 'Thursday'
    FRIDAY = 4, 'Friday'
    SATURDAY = 5, 'Saturday'
    SUNDAY = 6, 'Sunday'

class Month(models.IntegerChoices):
    JANUARY = 1, 'January'
    FEBRUARY = 2, 'February'
    MARCH = 3, 'March'
    APRIL = 4, 'April'
    MAY = 5, 'May'
    JUNE = 6, 'June'
    JULY = 7, 'July'
    AUGUST = 8, 'August'
    SEPTEMBER = 9, 'September'
    OCTOBER = 10, 'October'
    NOVEMBER = 11, 'November'
    DECEMBER = 12, 'December'

class MonthWeek(models.IntegerChoices):
    FIRST = 1, 'First'
    SECOND = 2, 'Second'
    THIRD = 3, 'Third'
    FOURTH = 4, 'Fourth'
    LAST = -1, 'Last'

class Event(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='events')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    is_recurring = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['start_time']

    def __str__(self):
        return f"{self.title} ({self.start_time})"

class RecurrenceRule(models.Model):
    event = models.OneToOneField(
        Event, 
        on_delete=models.CASCADE, 
        related_name='recurrence_rule'
    )
    frequency = models.CharField(
        max_length=10, 
        choices=FrequencyType.choices,
        default=FrequencyType.DAILY
    )
    interval = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(1)]
    )
    count = models.PositiveIntegerField(null=True, blank=True)
    until = models.DateTimeField(null=True, blank=True)
    weekdays = models.CharField(max_length=20, blank=True, null=True)  # Comma-separated weekdays
    month_day = models.PositiveIntegerField(
        null=True, 
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(31)]
    )
    month = models.PositiveIntegerField(
        null=True, 
        blank=True,
        choices=Month.choices,
        validators=[MinValueValidator(1), MaxValueValidator(12)]
    )
    week_of_month = models.IntegerField(
        null=True, 
        blank=True,
        choices=MonthWeek.choices
    )
    weekday_of_month = models.IntegerField(
        null=True, 
        blank=True,
        choices=Weekday.choices
    )

    def __str__(self):
        return f"Recurrence for {self.event.title}"