from django.urls import path
from .views import ProfileDetailView, PublicProfileListView, PublicProfileDetailView

urlpatterns = [
    path('me/', ProfileDetailView.as_view(), name='profile-me'),
    path('', PublicProfileListView.as_view(), name='profile-list-public'),
    path('<str:username>/', PublicProfileDetailView.as_view(), name='profile-detail-public'),
]