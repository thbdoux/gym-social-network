# gyms/models.py - Updated version
from django.db import models

class Gym(models.Model):
    EQUIPMENT_TYPES = [
        ('cardio', 'Cardio Equipment'),
        ('weights', 'Free Weights'),
        ('machines', 'Weight Machines'),
        ('functional', 'Functional Training'),
        ('crossfit', 'CrossFit Equipment')
    ]
    
    # Basic info
    name = models.CharField(max_length=100)
    location = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    
    # Geographic data (ESSENTIAL for search)
    latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    
    # Contact info
    phone = models.CharField(max_length=20, blank=True, default='')
    website = models.URLField(blank=True, default='')
    
    # External API tracking
    external_id = models.CharField(max_length=100, blank=True, default='')
    source = models.CharField(max_length=50, blank=True, default='manual')  # 'openstreetmap', 'google', 'manual'
    
    # Structured data
    amenities = models.JSONField(default=dict, blank=True, null=True)
    equipment = models.JSONField(default=dict, blank=True, null=True)
    opening_hours = models.JSONField(default=dict, blank=True, null=True)
    photos = models.JSONField(default=list, blank=True, null=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['name', 'location']
        ordering = ['name', 'location']
        indexes = [
            models.Index(fields=['latitude', 'longitude']),  # For location searches
            models.Index(fields=['name']),  # For name searches
        ]

    def __str__(self):
        return f"{self.name} - {self.location}"