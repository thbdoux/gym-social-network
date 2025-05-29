# notifications/middleware.py
from urllib.parse import parse_qs
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

User = get_user_model()

@database_sync_to_async
def get_user_from_token(token_key):
    try:
        # Verify and decode the token
        token = AccessToken(token_key)
        user_id = token['user_id']
        
        # Get the user from the database
        user = User.objects.get(id=user_id)
        return user
    except (InvalidToken, TokenError, User.DoesNotExist) as e:
        print(f"Token authentication error: {str(e)}")
        return AnonymousUser()

class JWTAuthMiddleware:
    """
    Custom middleware for JWT authentication in Django Channels
    """
    def __init__(self, inner):
        self.inner = inner
        
    async def __call__(self, scope, receive, send):
        # Extract token from query string
        query_string = scope.get('query_string', b'').decode()
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]
        
        # Log for debugging
        print(f"WebSocket connection attempt with token: {token is not None}")
        
        if token:
            # Authenticate the user with the token
            user = await get_user_from_token(token)
            scope['user'] = user
            
            # Log successful authentication
            if user.is_authenticated:
                print(f"WebSocket authenticated as user: {user.username}")
            else:
                print("WebSocket authentication failed: Invalid token")
        else:
            # No token provided
            scope['user'] = AnonymousUser()
            print("WebSocket connection without token")
        
        return await self.inner(scope, receive, send)

# Convenience function for including middleware in ASGI applications
def JWTAuthMiddlewareStack(inner):
    return JWTAuthMiddleware(inner)