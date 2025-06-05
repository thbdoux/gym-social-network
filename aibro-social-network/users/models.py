# users/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.crypto import get_random_string

class User(AbstractUser):
    """Extended user model with fitness-specific fields"""
    TRAINING_LEVELS = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced')
    ]
    PERSONALITY_TYPES = [
        ('optimizer', 'Optimizer'),
        ('diplomate', 'Diplomate'),
        ('mentor', 'Mentor'),
        ('versatile', 'Versatile'),
        ('casual','Casual')
    ]
    LANGUAGE_CHOICES = [
        ('en', 'English'),
        ('fr', 'French')
    ]
    
    preferred_gym = models.ForeignKey('gyms.Gym', on_delete=models.SET_NULL, 
                                    null=True, related_name='regular_users')
    training_level = models.CharField(max_length=20, choices=TRAINING_LEVELS)
    personality_type = models.CharField(max_length=20, choices=PERSONALITY_TYPES)
    language_preference = models.CharField(max_length=2, choices=LANGUAGE_CHOICES, default='en')
    fitness_goals = models.TextField(blank=True)
    friends = models.ManyToManyField('self', through='Friendship',
                                   symmetrical=False)
    current_program = models.ForeignKey('workouts.Program', 
                                      on_delete=models.SET_NULL,
                                      null=True, related_name='active_users')
    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)

    email_verified = models.BooleanField(default=True) # set to False in the future
    verification_token = models.CharField(max_length=100, blank=True, null=True)
    verification_token_created = models.DateTimeField(null=True, blank=True)
    
    # Social authentication fields
    google_id = models.CharField(max_length=100, blank=True, null=True)
    instagram_id = models.CharField(max_length=100, blank=True, null=True)
    
    # NEW: Personality assessment responses storage
    personality_assessment_responses = models.JSONField(null=True, blank=True, help_text="Stores user responses from personality wizard")

    def generate_verification_token(self):
        """Generate a unique token for email verification"""
        import datetime
        self.verification_token = get_random_string(64)
        self.verification_token_created = datetime.datetime.now()
        self.save(update_fields=['verification_token', 'verification_token_created'])
        return self.verification_token
    

class Friendship(models.Model):
    """Represents a friendship between users"""
    from_user = models.ForeignKey(User, on_delete=models.CASCADE, 
                                related_name='friendships_initiated')
    to_user = models.ForeignKey(User, on_delete=models.CASCADE,
                              related_name='friendships_received')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['from_user', 'to_user']

class FriendRequest(models.Model):
    """Pending friend request"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected')
    ]
    
    from_user = models.ForeignKey(User, on_delete=models.CASCADE,
                                related_name='friend_requests_sent')
    to_user = models.ForeignKey(User, on_delete=models.CASCADE,
                              related_name='friend_requests_received')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES,
                            default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['from_user', 'to_user']