from django.contrib import admin
from .models import Event, RecurrenceRule
# Register your models here.

admin.site.register([Event, RecurrenceRule])