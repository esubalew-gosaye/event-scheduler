from rest_framework import serializers
from .models import Event, RecurrenceRule, FrequencyType, Weekday, Month, MonthWeek
from .services import RecurrenceService
from django.utils import timezone
from datetime import datetime, timedelta
from drf_yasg.utils import swagger_serializer_method

class RecurrenceRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecurrenceRule
        fields = [
            'frequency', 'interval', 'count', 'until', 
            'weekdays', 'month_day', 'month', 
            'week_of_month', 'weekday_of_month'
        ]
        extra_kwargs = {
            'frequency': {
                'help_text': "Recurrence frequency (DAILY, WEEKLY, MONTHLY, YEARLY)"
            },
            'interval': {
                'help_text': "Interval between occurrences (e.g., every 2 weeks)"
            },
            'count': {
                'help_text': "Total number of occurrences (optional)"
            },
            'until': {
                'help_text': "End date for recurrence (optional)"
            },
            'weekdays': {
                'help_text': "Comma-separated weekdays (0-6 where 0=Monday) for weekly recurrence"
            },
            'month_day': {
                'help_text': "Day of month for monthly recurrence (1-31)"
            },
            'month': {
                'help_text': "Month for yearly recurrence (1-12)"
            },
            'week_of_month': {
                'help_text': "Week of month (1-4 or -1 for last) for relative patterns"
            },
            'weekday_of_month': {
                'help_text': "Weekday (0-6 where 0=Monday) for relative patterns"
            }
        }

class EventSerializer(serializers.ModelSerializer):
    recurrence_rule = RecurrenceRuleSerializer(required=False, allow_null=True)
    occurrences = serializers.SerializerMethodField()
    
    class Meta:
        model = Event
        fields = [
            'id', 'title', 'description', 'start_time', 'end_time',
            'is_recurring', 'recurrence_rule', 'created_at', 'updated_at', 'occurrences'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'occurrences']
        extra_kwargs = {
            'title': {
                'help_text': "Title of the event"
            },
            'description': {
                'help_text': "Detailed description of the event",
                'required': False,
                'allow_blank': True
            },
            'start_time': {
                'help_text': "Start date and time of the event"
            },
            'end_time': {
                'help_text': "End date and time of the event"
            },
            'is_recurring': {
                'help_text': "Whether the event repeats"
            }
        }
    
    @swagger_serializer_method(serializer_or_field=serializers.ListField)
    def get_occurrences(self, obj):
        request = self.context.get('request')
        if request and request.query_params.get('show_occurrences') == 'true':
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            
            start_date = timezone.datetime.strptime(start_date, '%Y-%m-%d').date() if start_date else None
            end_date = timezone.datetime.strptime(end_date, '%Y-%m-%d').date() if end_date else None
            
            if start_date:
                start_date = timezone.make_aware(timezone.datetime.combine(start_date, timezone.datetime.min.time()))
            if end_date:
                end_date = timezone.make_aware(timezone.datetime.combine(end_date, timezone.datetime.max.time()))
            
            return RecurrenceService.generate_occurrences(obj, start_date, end_date)
        return None
    
    def validate(self, data):
        if data['start_time'] >= data['end_time']:
            raise serializers.ValidationError("End time must be after start time.")
        
        if data.get('is_recurring') and not data.get('recurrence_rule'):
            raise serializers.ValidationError("Recurrence rule is required for recurring events.")
        
        if not data.get('is_recurring') and data.get('recurrence_rule'):
            raise serializers.ValidationError("Recurrence rule should not be provided for non-recurring events.")
        
        return data
    
    def create(self, validated_data):
        user = self.context['request'].user
        recurrence_rule_data = validated_data.pop('recurrence_rule', None)
        
        event = Event.objects.create(user=user, **validated_data)
        
        if validated_data['is_recurring'] and recurrence_rule_data:
            RecurrenceRule.objects.create(event=event, **recurrence_rule_data)
        
        return event
    
    def update(self, instance, validated_data):
        recurrence_rule_data = validated_data.pop('recurrence_rule', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if instance.is_recurring:
            if recurrence_rule_data:
                if hasattr(instance, 'recurrence_rule'):
                    recurrence_rule = instance.recurrence_rule
                    for attr, value in recurrence_rule_data.items():
                        setattr(recurrence_rule, attr, value)
                    recurrence_rule.save()
                else:
                    RecurrenceRule.objects.create(event=instance, **recurrence_rule_data)
        elif hasattr(instance, 'recurrence_rule'):
            instance.recurrence_rule.delete()
        
        return instance