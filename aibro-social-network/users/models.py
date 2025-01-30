# users/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    FITNESS_CHOICES = [
        ('bodybuilding', 'Bodybuilding'),
        ('crossfit', 'CrossFit'),
        ('powerlifting', 'Powerlifting'),
        ('hyrox', 'Hyrox Prep'),
    ]
    
    LEVEL_CHOICES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    ]
    
    PERSONALITY_CHOICES = [
        ('lone_wolf', 'Lone Wolf'),
        ('extrovert', 'Extrovert Bro'),
        ('mentor', 'Mentor'),
        ('student', 'Student'),
    ]

    # All fields should be optional except username and password
    surname = models.CharField(max_length=50, blank=True)
    bio = models.TextField(blank=True)
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    gym = models.ForeignKey('gyms.Gym', on_delete=models.SET_NULL, null=True, blank=True)
    fitness_practice = models.CharField(max_length=20, choices=FITNESS_CHOICES, blank=True, null=True)
    training_level = models.CharField(max_length=20, choices=LEVEL_CHOICES, blank=True, null=True)
    personality = models.CharField(max_length=20, choices=PERSONALITY_CHOICES, blank=True, null=True)
    goals = models.TextField(blank=True)
    friends = models.ManyToManyField('self', symmetrical=True, blank=True)

    class Meta:
        ordering = ['username']

class Schedule(models.Model):
    DAYS_OF_WEEK = [
        (0, 'Monday'),
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
        (5, 'Saturday'),
        (6, 'Sunday'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='schedule')
    day = models.IntegerField(choices=DAYS_OF_WEEK)
    preferred_time = models.TimeField()
    
    class Meta:
        unique_together = ['user', 'day']
        ordering = ['day']