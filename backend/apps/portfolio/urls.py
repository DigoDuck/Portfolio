from django.urls import path
from . import views

urlpatterns = [
    path('profile/', views.ProfileView.as_view()),
    path('skills/', views.SkillListView.as_view()),
    path('projects/', views.ProjectListView.as_view()),
    path('projects/<slug:slug>', views.ProjectDetailView.as_view()),
]
