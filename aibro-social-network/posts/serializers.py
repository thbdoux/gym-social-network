# posts/serializers.py
from rest_framework import serializers
from .models import Post, Comment, Like

class CommentSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_profile_picture = serializers.ImageField(source='user.profile_picture', read_only=True)
    
    class Meta:
        model = Comment
        fields = [
            'id', 'content', 'created_at', 
            'user_username', 'user_profile_picture'
        ]
        read_only_fields = ['id', 'created_at']

class OriginalPostSerializer(serializers.ModelSerializer):
    """Serializer for original posts when shown in shares"""
    comments = CommentSerializer(many=True, read_only=True)
    likes_count = serializers.SerializerMethodField()
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_profile_picture = serializers.ImageField(source='user.profile_picture', read_only=True)
    workout_log_details = serializers.SerializerMethodField()
    program_details = serializers.SerializerMethodField()
    workout_invite_details = serializers.SerializerMethodField()
    invited_users_details = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id', 'content', 'image', 'created_at', 'post_type',
            'user_username', 'user_profile_picture', 'comments',
            'likes_count', 'workout_log_details', 'program_details',
            'workout_invite_details', 'invited_users_details'
        ]

    # Copy over the get_* methods from PostSerializer
    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_workout_log_details(self, obj):
        if obj.workout_log:
            from workouts.serializers import WorkoutLogSerializer
            return WorkoutLogSerializer(obj.workout_log).data
        return None

    def get_program_details(self, obj):
        if obj.program:
            from workouts.serializers import ProgramSerializer
            return ProgramSerializer(obj.program).data
        return None

    def get_workout_invite_details(self, obj):
        if obj.workout_instance:
            from workouts.serializers import WorkoutInstanceSerializer
            return {
                'workout': WorkoutInstanceSerializer(obj.workout_instance).data,
                'planned_date': obj.planned_date
            }
        return None

    def get_invited_users_details(self, obj):
        from users.serializers import UserSerializer
        return UserSerializer(obj.invited_users.all(), many=True).data
        
class PostSerializer(serializers.ModelSerializer):
    comments = CommentSerializer(many=True, read_only=True)
    likes_count = serializers.SerializerMethodField()
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_profile_picture = serializers.ImageField(source='user.profile_picture', read_only=True)
    is_liked = serializers.SerializerMethodField()
    shares_count = serializers.IntegerField(source='share_count', read_only=True)
    original_post_details = serializers.SerializerMethodField()
    shared_by = serializers.SerializerMethodField()
    
    # Additional fields for different post types
    workout_log_details = serializers.SerializerMethodField()
    program_details = serializers.SerializerMethodField()
    workout_invite_details = serializers.SerializerMethodField()
    invited_users_details = serializers.SerializerMethodField()
    
    def get_original_post_details(self, obj):
        if obj.is_share and obj.original_post:
            return OriginalPostSerializer(
                obj.original_post,
                context=self.context
            ).data
        return None

    class Meta:
        model = Post
        fields = [
            'id', 'content', 'image', 'created_at', 'post_type',
            'updated_at', 'user_username', 'user_profile_picture',
            'comments', 'likes_count', 'is_liked',
            'workout_log_details', 'program_details', 
            'workout_invite_details', 'invited_users_details',
            'is_share', 'original_post', 'shares_count',
            'original_post_details', 'shared_by'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_shared_by(self, obj):
        if obj.is_share:
            return {
                'username': obj.user.username,
                'id': obj.user.id,
                # 'profile_picture': obj.user.profile_picture.url if obj.user.profile_picture else None
            }
        return None
        
    def get_workout_log_details(self, obj):
        if obj.workout_log:
            from workouts.serializers import WorkoutLogSerializer
            return WorkoutLogSerializer(obj.workout_log).data
        return None

    def get_program_details(self, obj):
        if obj.program:
            from workouts.serializers import ProgramSerializer
            return ProgramSerializer(obj.program).data
        return None

    def get_workout_invite_details(self, obj):
        if obj.workout_instance:
            from workouts.serializers import WorkoutInstanceSerializer
            return {
                'workout': WorkoutInstanceSerializer(obj.workout_instance).data,
                'planned_date': obj.planned_date
            }
        return None

    def get_invited_users_details(self, obj):
        from users.serializers import UserSerializer
        return UserSerializer(obj.invited_users.all(), many=True).data


    def get_likes_count(self, obj):
        return obj.likes.count()
    
    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False