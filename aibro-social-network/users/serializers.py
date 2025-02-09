# users/serializers.py
from rest_framework import serializers
from .models import User, Friendship, FriendRequest

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    class Meta:
        model = User
        fields = [
            'id', 
            'username', 
            'password',
            'email', 
            'training_level', 
            'personality_type',
            'fitness_goals',
            'bio'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'email': {'required': False},
            'fitness_goals': {'required': False},
            'bio': {'required': False},
        }

    def create(self, validated_data):
        try:
            user = User.objects.create_user(
                username=validated_data['username'],
                password=validated_data['password'],
                email=validated_data.get('email', ''),
                training_level=validated_data.get('training_level', 'beginner'),
                personality_type=validated_data.get('personality_type', 'casual'),
                fitness_goals=validated_data.get('fitness_goals', ''),
                bio=validated_data.get('bio', '')
            )
            return user
        except Exception as e:
            print("Error creating user:", str(e))  # Debug print
            raise

class FriendshipSerializer(serializers.ModelSerializer):
    friend = UserSerializer(source='to_user')
    
    class Meta:
        model = Friendship
        fields = ['id', 'friend', 'created_at']
        read_only_fields = ['id', 'created_at']

class FriendRequestSerializer(serializers.ModelSerializer):
    from_user = UserSerializer(read_only=True)
    to_user = UserSerializer(read_only=True)
    
    class Meta:
        model = FriendRequest
        fields = ['id', 'from_user', 'to_user', 'status', 'created_at']
        read_only_fields = ['id', 'created_at']