from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Profile
from .serializers import PublicProfileSerializer, ProfileSerializer

class ProfileDetailView(generics.RetrieveUpdateAPIView):
    """Retrieve or update the profile of the currently authenticated user."""
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user.profile
    
class PublicProfileListView(generics.ListAPIView):
    """List all profiles that are marked public."""
    queryset = Profile.objects.filter(is_public=True)
    serializer_class = PublicProfileSerializer
    permission_classes = [AllowAny]

class PublicProfileDetailView(generics.RetrieveAPIView):
    """Retrieve a specific public profile by username."""
    queryset = Profile.objects.filter(is_public=True)
    serializer_class = PublicProfileSerializer
    permission_classes = [AllowAny]
    lookup_field = 'user__username'
    lookup_url_kwarg = 'username'
