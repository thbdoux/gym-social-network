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
    comments_count = serializers.SerializerMethodField()
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    user_profile_picture = serializers.ImageField(source='user.profile_picture', read_only=True)
    workout_log_details = serializers.SerializerMethodField()
    program_details = serializers.SerializerMethodField()
    workout_invite_details = serializers.SerializerMethodField()
    invited_users_details = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id', 'content', 'image', 'created_at', 'post_type',
            'user_username','user_id', 'user_profile_picture', 'comments',
            'likes_count', 'comments_count', 'workout_log_details', 'program_details',
            'workout_invite_details', 'invited_users_details'
        ]

    # Copy over the get_* methods from PostSerializer
    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_comments_count(self, obj):
        return obj.comments.count()

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
            return WorkoutInstanceSerializer(obj.workout_instance).data 
        return None


    def get_invited_users_details(self, obj):
        from users.serializers import UserSerializer
        return UserSerializer(obj.invited_users.all(), many=True).data
        
class PostSerializer(serializers.ModelSerializer):

    comments = CommentSerializer(many=True, read_only=True)
    likes_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)
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

    def get_comments_count(self, obj):
        return obj.comments.count()
    
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
            'workout_log', 'program',
            'updated_at', 'user_username', 'user_id','user_profile_picture',
            'comments', 'likes_count','comments_count', 'is_liked',
            'workout_log_details', 'program_details', 
            'workout_invite_details', 'invited_users_details',
            'is_share', 'original_post', 'shares_count',
            'original_post_details', 'shared_by'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_shared_by(self, obj):
        if obj.is_share:
            from users.serializers import UserSerializer
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

class PostCreateSerializer(serializers.ModelSerializer):
    program_id = serializers.IntegerField(required=False, write_only=True)
    workout_log_id = serializers.IntegerField(required=False, write_only=True)
    
    class Meta:
        model = Post
        fields = [
            'id','content', 'image', 'post_type', 
            'program_id', 'workout_log_id'
        ]
        read_only_fields = ['id']
    
    def create(self, validated_data):
        # Extract IDs
        program_id = validated_data.pop('program_id', None)
        workout_log_id = validated_data.pop('workout_log_id', None)
        
        # Get the user from context
        user = self.context['request'].user
        
        # Explicitly create post with only the fields we want
        post = Post.objects.create(
            user=user,
            content=validated_data.get('content', ''),
            image=validated_data.get('image'),
            post_type=validated_data.get('post_type', 'regular')
        )
        
        # Link program
        if program_id:
            try:
                from workouts.models import Program
                program = Program.objects.get(id=program_id)
                
                # Make the program public when it's shared in a post
                if not program.is_public:
                    program.is_public = True
                    program.save()
                    print(f"Made program {program_id} public upon sharing")
                
                post.program = program
                post.save()
                print(f"Successfully linked post {post.id} to program {program_id}")
            except Exception as e:
                print(f"Error linking program: {str(e)}")
        
        # Link workout log
        if workout_log_id:
            try:
                from workouts.models import WorkoutLog
                workout_log = WorkoutLog.objects.get(id=workout_log_id)
                post.workout_log = workout_log
                post.save()
                print(f"Successfully linked post {post.id} to workout log {workout_log_id}")
            except Exception as e:
                print(f"Error linking workout log: {str(e)}")
        
        return post
