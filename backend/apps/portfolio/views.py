from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Profile, Skill, Project
from .serializers import ProfileSerializer, SkillSerializer, ProjectListSerializer, ProjectDetailSerializer

class ProfileView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, req):
        try:
            profile = Profile.objects.first()
            if not profile:
                return Response({'detaild': 'Profile not configured.'}, status=404)
            serializer = ProfileSerializer(profile, context={'request': req})
            return Response(serializer.data)
        except Exception as e:
            return Response({'detail': str(e)}, status=500)

class SkillListView(generics.ListAPIView):
    permission_classes = {permissions.AllowAny}
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer
    
    
class ProjectListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ProjectListSerializer
    
    def get_queryset(self):
        return Project.objects.prefetch_related('skills')

    def get_serializer_context(self):
        return {'request': self.request}
    
class ProjectDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ProjectDetailSerializer
    lookup_field = 'slug'
    queryset = Project.objects.prefetch_related('skills')

    def get_serializer_context(self):
        return {'request': self.request}