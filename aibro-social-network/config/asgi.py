# asgi.py
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from notifications.middleware import JWTAuthMiddlewareStack
from notifications.routing import websocket_urlpatterns  # Import your actual websocket URL patterns

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": JWTAuthMiddlewareStack(
        URLRouter(
            websocket_urlpatterns
        )
    ),
})