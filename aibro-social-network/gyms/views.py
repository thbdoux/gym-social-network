# gyms/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Q
from django.utils import timezone

from .models import Gym, GymAnnouncement
from .serializers import GymSerializer, GymAnnouncementSerializer
from users.serializers import UserSerializer

class GymViewSet(viewsets.ModelViewSet):
    queryset = Gym.objects.all()
    serializer_class = GymSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        today = timezone.now().date()
        return Gym.objects.annotate(
            member_count=Count('regular_users', distinct=True),
            active_users_today=Count(
                'workout_logs',
                filter=Q(workout_logs__date=today),
                distinct=True
            )
        )


    def create(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            if not serializer.is_valid():
                return Response(
                    {
                        "error": "Invalid data",
                        "details": serializer.errors
                    }, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {
                    "error": "Server error",
                    "message": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        gym = self.get_object()
        members = gym.regular_users.all()
        serializer = UserSerializer(members, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def active_members(self, request, pk=None):
        gym = self.get_object()
        today = timezone.now().date()
        active_users = gym.workout_logs.filter(
            date=today
        ).values('user').distinct()
        members = gym.regular_users.filter(id__in=active_users)
        serializer = UserSerializer(members, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def announce(self, request, pk=None):
        gym = self.get_object()
        serializer = GymAnnouncementSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(gym=gym)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        gym = self.get_object()
        today = timezone.now().date()
        return Response({
            'total_members': gym.regular_users.count(),
            'active_today': gym.workout_logs.filter(date=today).count(),
            'workouts_this_week': gym.workout_logs.filter(
                date__gte=today - timezone.timedelta(days=7)
            ).count()
        })