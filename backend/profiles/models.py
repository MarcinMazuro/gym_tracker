from django.db import models
from django.conf import settings

class Profile(models.Model):
    class Gender(models.TextChoices):
        MALE = 'M', 'Male'
        FEMALE = 'F', 'Female'
    
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='profile'
    )
    is_public = models.BooleanField(default=False)

    gender = models.CharField(
        max_length=1,
        choices=Gender.choices,
        null=True,
        blank=True
    )
    weight = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text='Weight in kg')
    height = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text='Height in cm')
    body_fat_percentage = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True, help_text='Percent of body fat')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile of {self.user.username}"
    