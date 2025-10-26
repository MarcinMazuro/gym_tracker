from rest_framework import serializers
from .models import Profile

class PublicProfileSerializer(serializers.ModelSerializer):
    """Serializer for public profile view. Exposes non-sensitive data."""
    username = serializers.CharField(source='user.username', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    gender = serializers.CharField(source='get_gender_display', read_only=True)
    date_joined = serializers.DateTimeField(source='user.date_joined', read_only=True)

    class Meta:
        model = Profile
        fields = [
            'username', 'first_name', 'last_name', 'gender', 'weight', 
            'height', 'body_fat_percentage', 'date_joined', 'about_me'
        ]

class ProfileSerializer(serializers.ModelSerializer):
    """Serializer for the owner's profile view. Allows updating nested User fields."""
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name')
    last_name = serializers.CharField(source='user.last_name')
    date_joined = serializers.DateTimeField(source='user.date_joined', read_only=True)

    class Meta:
        model = Profile
        fields = [
            'username', 'email', 'first_name', 'last_name', 'is_public', 'gender',
            'weight', 'height', 'body_fat_percentage', 'updated_at', 'date_joined', 'about_me'
        ]

    def update(self, instance, validated_data):
        # Handle nested User data
        user_data = validated_data.pop('user', {})
        first_name = user_data.get('first_name')
        last_name = user_data.get('last_name')

        # Update Profile instance
        instance = super().update(instance, validated_data)

        # Update User instance
        user = instance.user
        if first_name is not None:
            user.first_name = first_name
        if last_name is not None:
            user.last_name = last_name
        user.save()

        return instance