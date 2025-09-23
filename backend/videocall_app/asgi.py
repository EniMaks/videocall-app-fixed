# videocall_app/asgi.py - ASGI configuration for WebSocket support
import os

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'videocall_app.settings')
# Initialize Django ASGI application early to ensure the AppRegistry
# is populated before importing code that may import ORM models.
django_asgi_app = get_asgi_application()

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator

from apps.authentication.middleware import GuestJwtAuthMiddleware
from apps.rooms.routing import websocket_urlpatterns


application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        GuestJwtAuthMiddleware(
            AuthMiddlewareStack(
                URLRouter(websocket_urlpatterns)
            )
        )
    ),
})
