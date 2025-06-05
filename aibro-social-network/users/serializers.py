# users/serializers.py
from rest_framework import serializers
from .models import User, Friendship, FriendRequest

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    current_password = serializers.CharField(write_only=True, required=False)
    # Use a SerializerMethodField to avoid circular imports
    current_program = serializers.SerializerMethodField()
    # NEW: Add personality assessment responses field
    personality_assessment_responses = serializers.JSONField(required=False, write_only=True)

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
            return ProgramSerializer(obj.current_program).data
        return None
    
    class Meta:
        model = User
        fields = [
            'id', 
            'username', 
            'password',
            'current_password',
            'email', 
            'email_verified',
            'training_level', 
            'personality_type',
            'language_preference',
            'fitness_goals',
            'bio',
            'avatar',
            'preferred_gym',
            'current_program', 
            'google_id',
            'instagram_id',
            'personality_assessment_responses',  # NEW
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'email': {'required': False},
            'fitness_goals': {'required': False},
            'bio': {'required': False},
            'avatar': {'required': False},
            'preferred_gym': {'required': False},
            'language_preference': {'required': False},
            'google_id': {'read_only': True},
            'instagram_id': {'read_only': True},
            'personality_assessment_responses': {'write_only': True},  # NEW
        }
        
    def create(self, validated_data):
        try:
            # Extract personality assessment responses
            personality_responses = validated_data.pop('personality_assessment_responses', None)
            
            user = User.objects.create_user(
                username=validated_data['username'],
                password=validated_data['password'],
                email=validated_data.get('email', ''),
                training_level=validated_data.get('training_level', 'beginner'),
                personality_type=validated_data.get('personality_type', 'versatile'),
                language_preference=validated_data.get('language_preference', 'en'),
                fitness_goals=validated_data.get('fitness_goals', ''),
                bio=validated_data.get('bio', ''),
                personality_assessment_responses=personality_responses  # NEW: Store responses
            )
            return user
        except Exception as e:
            print("Error creating user:", str(e))  # Debug print
            raise

    def update(self, instance, validated_data):
        # Handle password change if provided
        current_password = validated_data.pop('current_password', None)
        new_password = validated_data.pop('password', None)
        
        # Handle personality assessment responses update
        personality_responses = validated_data.pop('personality_assessment_responses', None)
        if personality_responses is not None:
            instance.personality_assessment_responses = personality_responses

        if 'email' in validated_data and validated_data['email'] != instance.email:
            instance.email_verified = False
            instance.verification_token = None
            # You might want to trigger sending a new verification email here... TODO
        
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