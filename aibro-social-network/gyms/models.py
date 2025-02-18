from django.db import models

class Gym(models.Model):
    EQUIPMENT_TYPES = [
        ('cardio', 'Cardio Equipment'),
        ('weights', 'Free Weights'),
        ('machines', 'Weight Machines'),
        ('functional', 'Functional Training'),
        ('crossfit', 'CrossFit Equipment')
    ]
    
    name = models.CharField(max_length=100)
    location = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    amenities = models.JSONField(default=dict, blank=True, null=True)
    equipment = models.JSONField(default=dict, blank=True, null=True)
    opening_hours = models.JSONField(default=dict, blank=True, null=True)
    photos = models.JSONField(default=list, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['name', 'location']
        ordering = ['name', 'location']

    def __str__(self):
        return f"{self.name} - {self.location}"

class GymAnnouncement(models.Model):
    gym = models.ForeignKey(Gym, on_delete=models.CASCADE, related_name='announcements')
    title = models.CharField(max_length=200)
    content = models.TextField()
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.gym.name} - {self.title}"