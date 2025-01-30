# gyms/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Gym
from .serializers import GymSerializer
from users.serializers import UserSerializer

class GymViewSet(viewsets.ModelViewSet):
    queryset = Gym.objects.all()
    serializer_class = GymSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        """Get all members of a gym"""
        gym = self.get_object()
        members = gym.user_set.all()
        serializer = UserSerializer(members, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search gyms by name or location"""
        query = request.query_params.get('q', '')
        if query:
            gyms = Gym.objects.filter(
                models.Q(name__icontains=query) |
                models.Q(location__icontains=query)
            )
            serializer = self.get_serializer(gyms, many=True)
            return Response(serializer.data)
        return Response(
            {"error": "Please provide a search query"},
            status=status.HTTP_400_BAD_REQUEST
        )