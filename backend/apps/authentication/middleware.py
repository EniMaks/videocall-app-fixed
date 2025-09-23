# apps/authentication/middleware.py
import logging
from urllib.parse import parse_qs
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import AccessToken, TokenError

logger = logging.getLogger(__name__)

class GuestJwtAuthMiddleware:
    """
    Custom middleware for Django Channels to authenticate guests via JWT in query string.
    """

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        query_string = scope.get('query_string', b'').decode()
        params = parse_qs(query_string)
        guest_token = params.get('guest_token', [None])[0]

        if guest_token:
            from django.contrib.auth.models import AnonymousUser
            try:
                token = AccessToken(guest_token)
                payload = token.payload

                if payload.get('is_guest') and payload.get('room_id'):
                    # This is a valid guest user
                    # We can create a temporary user object or just store info in the scope
                    scope['is_guest'] = True
                    scope['room_id'] = payload['room_id']
                    scope['user'] = AnonymousUser() # Still an anonymous user in terms of Django auth
                    logger.info(f"Guest user authenticated for room {payload['room_id']}")
                else:
                    logger.warning("Guest token is missing required claims.")
                    scope['is_guest'] = False

            except TokenError as e:
                logger.warning(f"Invalid guest token: {e}")
                scope['is_guest'] = False
        else:
            scope['is_guest'] = False

        return await self.app(scope, receive, send)
