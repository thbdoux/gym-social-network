# users/serializers.py
from rest_framework import serializers
from .models import User, Friendship, FriendRequest

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    current_password = serializers.CharField(write_only=True, required=False)
    # Use a SerializerMethodField to avoid circular imports
    current_program = serializers.SerializerMethodField()

    def __init__(self, *args, **kwargs):
        # Allow for specifying specific fields to include
        fields = kwargs.pop('fields', None)
        super().__init__(*args, **kwargs)
        
        if fields is not None:
            # Drop any fields that are not specified in the `fields` argument
            allowed = set(fields)
            existing = set(self.fields)
            for field_name in existing - allowed:
                self.fields.pop(field_name)
                
    def get_current_program(self, obj):
        if obj.current_program:
            from workouts.serializers import ProgramSerializer
            return {
                'id': obj.current_program.id,
                'name': obj.current_program.name,
                'focus': obj.current_program.focus,
                'sessions_per_week': obj.current_program.sessions_per_week,
                'difficulty_level': obj.current_program.difficulty_level
            }
        return None
    class Meta:
        model = User
        fields = [
            'id', 
            'username', 
            'password',
            'current_password',
            'email', 
            'training_level', 
            'personality_type',
            'language_preference',
            'fitness_goals',
            'bio',
            'avatar',
            'preferred_gym',
            'current_program' 
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'email': {'required': False},
            'fitness_goals': {'required': False},
            'bio': {'required': False},
            'avatar': {'required': False},
            'preferred_gym': {'required': False},
            'language_preference': {'required': False},
        }
        
    def create(self, validated_data):
        try:
            user = User.objects.create_user(
                username=validated_data['username'],
                password=validated_data['password'],
                email=validated_data.get('email', ''),
                training_level=validated_data.get('training_level', 'beginner'),
                personality_type=validated_data.get('personality_type', 'versatile'),
                language_preference=validated_data.get('language_preference', 'en'),
                fitness_goals=validated_data.get('fitness_goals', ''),
                bio=validated_data.get('bio', '')
            )
            return user
        except Exception as e:
            print("Error creating user:", str(e))  # Debug print
            raise

    def update(self, instance, validated_data):
        # Handle password change if provided
        current_password = validated_data.pop('current_password', None)
        new_password = validated_data.pop('password', None)
        
        if current_password and new_password:
            if not instance.check_password(current_password):
                raise serializers.ValidationError({"current_password": "Wrong password"})
            instance.set_password(new_password)

        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance

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