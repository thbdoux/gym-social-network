# users/views.py
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView

from .models import User, Friendship, FriendRequest
from .serializers import (UserSerializer, FriendshipSerializer,
                        FriendRequestSerializer)

class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    
    def get_permissions(self):
        """Allow registration without authentication"""
        if self.action == 'create':  # registration
            return []
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        return User.objects.all()
    
    def create(self, request, *args, **kwargs):
        """Handle user registration"""
        print("Received data:", request.data)  # Debug print
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("Validation errors:", serializer.errors)  # Debug print
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        user = serializer.save()
        return Response({
            'id': user.id,
            'username': user.username,
            'message': 'User created successfully'
        }, status=status.HTTP_201_CREATED)
        
    def get_queryset(self):
        return User.objects.all()
    
    @action(detail=True, methods=['post'])
    def send_friend_request(self, request, pk=None):
        to_user = self.get_object()
        from_user = request.user
        
        if to_user == from_user:
            return Response(
                {"detail": "Cannot send friend request to yourself"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        request, created = FriendRequest.objects.get_or_create(
            from_user=from_user,
            to_user=to_user,
            defaults={'status': 'pending'}
        )
        
        serializer = FriendRequestSerializer(request)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def respond_to_request(self, request, pk=None):
        friend_request = get_object_or_404(
            FriendRequest,
            to_user=request.user,
            from_user=self.get_object(),
            status='pending'
        )
        
        response = request.data.get('response')
        if response == 'accept':
            friend_request.status = 'accepted'
            friend_request.save()
            
            # Create friendship
            Friendship.objects.create(
                from_user=friend_request.from_user,
                to_user=friend_request.to_user
            )
            Friendship.objects.create(
                from_user=friend_request.to_user,
                to_user=friend_request.from_user
            )
        elif response == 'reject':
            friend_request.status = 'rejected'
            friend_request.save()
        
        return Response({'status': friend_request.status})
    
    @action(detail=False, methods=['get'])
    def friends(self, request):
        friendships = Friendship.objects.filter(
            from_user=request.user
        ).select_related('to_user')
        serializer = FriendshipSerializer(friendships, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def friend_requests(self, request):
        requests = FriendRequest.objects.filter(
            Q(to_user=request.user) | Q(from_user=request.user)
        ).select_related('from_user', 'to_user')
        serializer = FriendRequestSerializer(requests, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def remove_friend(self, request, pk=None):
        friend = self.get_object()
        Friendship.objects.filter(
            Q(from_user=request.user, to_user=friend) |
            Q(from_user=friend, to_user=request.user)
        ).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)