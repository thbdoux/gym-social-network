from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)
    bio = models.TextField(max_length=500, blank=True)
    friends = models.ManyToManyField('self', blank=True, symmetrical=True)
    schedule = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['-date_joined']