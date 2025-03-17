# users/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models

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