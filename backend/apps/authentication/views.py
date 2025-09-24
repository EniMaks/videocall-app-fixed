class GuestTokenGenerateView(APIView):
    """
    Generates a guest JWT for room access.
    """
    permission_classes = [AllowAny] # Should be IsAuthenticated

    def post(self, request, *args, **kwargs):
        if not request.session.get('authenticated', False):
            return Response({'error': 'Authentication required to generate guest links.'}, status=status.HTTP_403_FORBIDDEN)

        room_id = request.data.get('room_id')
        if not room_id:
            return Response({'error': 'Room ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Ensure the room exists
            room = Room.objects.get(room_id=room_id)
        except Room.DoesNotExist:
            return Response({'error': 'Room not found'}, status=status.HTTP_404_NOT_FOUND)

        # Create a unique guest user that is not saved to the database
        guest_user = User(username=f'guest_{uuid.uuid4().hex[:10]}')
        guest_user.is_guest_user = True # Dynamic attribute

        # Generate a simple JWT
        refresh = RefreshToken.for_user(guest_user)
        refresh['is_guest'] = True
        refresh['room_id'] = str(room.room_id)

        return Response({'guest_token': str(refresh.access_token)}, status=status.HTTP_201_CREATED)


class GuestTokenValidateView(APIView):
    """
    Validates a guest JWT and logs the user in via session.
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        token = request.data.get('token')
        if not token:
            return Response({'error': 'Token is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            access_token = AccessToken(token)
            access_token.verify()

            if not access_token.get('is_guest'):
                return Response({'error': 'Not a guest token'}, status=status.HTTP_403_FORBIDDEN)

            # Create or get a user object for the guest
            # Note: This user is not persisted with a password and can only be logged in via this flow
            user, _ = User.objects.get_or_create(username=access_token['username'])

            # Log the user in, creating a session
            login(request, user)
            request.session['is_guest'] = True
            request.session['authenticated'] = True

            return Response({'validated': True, 'is_guest': True}, status=status.HTTP_200_OK)

        except TokenError as e:
            return Response({'error': f'Invalid token: {str(e)}'}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            logger.error(f"Guest token validation failed: {e}")
            return Response({'error': 'An unexpected error occurred'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
