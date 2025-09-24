# authentication/urls.py - Authentication URL patterns
from django.urls import path
from . import views

app_name = 'authentication'

urlpatterns = [
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('check/', views.check_auth_view, name='check'),
    path('guest/generate/', views.GuestTokenGenerateView.as_view(), name='guest_generate'),
    path('guest/validate/', views.GuestTokenValidateView.as_view(), name='guest_validate'),
]