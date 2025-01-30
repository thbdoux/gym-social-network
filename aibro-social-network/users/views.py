# users/views.py
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import User, Schedule
from .serializers import UserSerializer, UserDetailSerializer, ScheduleSerializer
from django.shortcuts import get_object_or_404

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    
    def get_serializer_class(self):
        if self.action in ['retrieve', 'me']:
            return UserDetailSerializer
        return UserSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user's profile"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_friend(self, request, pk=None):
        """Add a friend"""
        user = request.user
        friend = self.get_object()
        
        if friend == user:
            return Response(
                {"error": "Cannot add yourself as a friend"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if friend in user.friends.all():
            return Response(
                {"error": "Already friends with this user"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        user.friends.add(friend)
        return Response(status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def remove_friend(self, request, pk=None):
        """Remove a friend"""
        user = request.user
        friend = self.get_object()
        user.friends.remove(friend)
        return Response(status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def gym_buddies(self, request):
        """Get users from the same gym"""
        if not request.user.gym:
            return Response(
                {"error": "You haven't set your gym yet"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        gym_buddies = User.objects.filter(gym=request.user.gym).exclude(id=request.user.id)
        serializer = self.get_serializer(gym_buddies, many=True)
        return Response(serializer.data)

class ScheduleViewSet(viewsets.ModelViewSet):
    serializer_class = ScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Schedule.objects.filter(user=self.request.user)
        
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)