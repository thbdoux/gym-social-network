from rest_framework import serializers
from .models import WorkoutSession

class WorkoutSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkoutSession
        fields = ['id', 'date', 'exercises', 'notes']
        read_only_fields = ['id']