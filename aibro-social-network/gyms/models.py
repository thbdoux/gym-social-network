from django.db import models

class Gym(models.Model):
    name = models.CharField(max_length=100)
    location = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    amenities = models.JSONField(default=dict, blank=True)  # Store features like "24/7", "Cardio Area", etc.
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['name', 'location']
        ordering = ['name', 'location']

    def __str__(self):
        return f"{self.name} - {self.location}"

    @property
    def member_count(self):
        return self.user_set.count()