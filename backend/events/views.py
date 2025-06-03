from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils import timezone
from datetime import timedelta
from django.db import models
from .models import Event
from .serializers import EventSerializer
from .services import RecurrenceService

class EventViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows events to be viewed or edited.
    """
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = Event.objects.filter(user=self.request.user)
        
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date and end_date:
            start_date = timezone.datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date = timezone.datetime.strptime(end_date, '%Y-%m-%d').date()
            
            start_datetime = timezone.make_aware(timezone.datetime.combine(start_date, timezone.datetime.min.time()))
            end_datetime = timezone.make_aware(timezone.datetime.combine(end_date, timezone.datetime.max.time()))
            
            queryset = queryset.filter(
                models.Q(is_recurring=False, start_time__gte=start_datetime, start_time__lte=end_datetime) |
                models.Q(is_recurring=True)
            )
        
        return queryset.order_by('start_time')
    
    @swagger_auto_schema(
        operation_description="List all events",
        manual_parameters=[
            openapi.Parameter(
                'start_date',
                openapi.IN_QUERY,
                description="Start date for filtering (YYYY-MM-DD)",
                type=openapi.TYPE_STRING
            ),
            openapi.Parameter(
                'end_date',
                openapi.IN_QUERY,
                description="End date for filtering (YYYY-MM-DD)",
                type=openapi.TYPE_STRING
            ),
        ]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @swagger_auto_schema(
        operation_description="Create a new event",
        request_body=EventSerializer,
        responses={
            201: EventSerializer,
            400: "Bad Request"
        }
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
    
    @swagger_auto_schema(
        operation_description="Retrieve an event",
        responses={
            200: EventSerializer,
            404: "Not Found"
        }
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)
    
    @swagger_auto_schema(
        operation_description="Update an event",
        request_body=EventSerializer,
        responses={
            200: EventSerializer,
            400: "Bad Request",
            404: "Not Found"
        }
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
    
    @swagger_auto_schema(
        operation_description="Delete an event",
        responses={
            204: "No Content",
            404: "Not Found"
        }
    )
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)
    
    @swagger_auto_schema(
        operation_description="List upcoming events (next 30 days)",
        responses={
            200: EventSerializer(many=True),
            401: "Unauthorized"
        }
    )
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        now = timezone.now()
        end_date = now + timedelta(days=30)
        
        events = self.get_queryset().filter(
            models.Q(is_recurring=False, start_time__gte=now, start_time__lte=end_date) |
            models.Q(is_recurring=True)
        )
        
        serializer = self.get_serializer(events, many=True)
        return Response(serializer.data)
    
    @swagger_auto_schema(
        operation_description="Delete a specific occurrence of a recurring event",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'occurrence_date': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    format='date-time',
                    description="Date and time of the occurrence to delete"
                )
            }
        ),
        responses={
            200: "Occurrence marked for deletion",
            400: "Bad Request",
            404: "Not Found"
        }
    )
    @action(detail=True, methods=['post'])
    def delete_occurrence(self, request, pk=None):
        event = self.get_object()
        occurrence_date = request.data.get('occurrence_date')
        
        if not occurrence_date:
            return Response(
                {'error': 'occurrence_date is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            occurrence_date = timezone.datetime.strptime(occurrence_date, '%Y-%m-%dT%H:%M:%S')
            if not event.is_recurring:
                return Response(
                    {'error': 'Event is not recurring'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            return Response({'status': 'Occurrence marked for deletion'})
        except ValueError:
            return Response(
                {'error': 'Invalid date format. Use YYYY-MM-DDTHH:MM:SS'},
                status=status.HTTP_400_BAD_REQUEST
            )