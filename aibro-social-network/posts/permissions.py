# posts/permissions.py
from rest_framework import permissions

class IsAuthorOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # Always allow GET, HEAD, or OPTIONS requests
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # Allow POST for comments and likes actions
        if view.action in ['comment', 'like']:
            return True

        # Otherwise, only allow if user is the author
        return obj.user == request.user