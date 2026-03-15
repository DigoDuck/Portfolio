from rest_framework import serializers
from .models import Profile, Skill, Project

class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = [ 'id', 'name', 'icon_name', 'category', 'order']
        
    
class ProfileSerializer(serializers.ModelSerializer):
    #Campors virtuais
    role = serializers.SerializerMethodField()
    bio = serializers.SerializerMethodField()
    seal_text =  serializers.SerializerMethodField()
    
    class Meta:
        model = Profile
        fields = ['id', 'full_name', 'role', 'bio', 'photo', 'github_url', 'linkedin_url', 'email', 'seal_text']
        
    def _lang(self):
        request = self.context.get('request')
        return request.query_params.get('lang', 'pt') if request else 'pt'

    def get_role(self, obj):
        return obj.role_en if self._lang() == 'en' else obj.role_pt

    def get_bio(self, obj):
        return obj.bio_en if self._lang() == 'en' else obj.bio_pt

    def get_seal_text(self, obj):
        return obj.seal_text_en if self._lang() == 'en' else obj.seal_text_pt
    
class ProjectListSerializer(serializers.ModelSerializer):
    """Versão leve para a listagem"""
    title = serializers.SerializerMethodField()
    short_description = serializers.SerializerMethodField()
    skills = SkillSerializer(many=True, read_only=True)
    
    class Meta:
        model = Project
        fields = ['id', 'slug', 'featured', 'title', 'short_description', 'thumbnail', 'repo_url', 'live_url', 'skills']
        
    def _lang(self):
        request = self.context.get('request')
        return request.query_params.get('lang', 'pt') if request else 'pt'

    def get_title(self, obj):
        return obj.title_en if self._lang() == 'en' else obj.title_pt

    def get_short_description(self, obj):
        return obj.short_description_en if self._lang() == 'en' else obj.short_description_pt
    
class ProjectDetailSerializer(ProjectListSerializer):
    """Versão completa com o case study — usada ao abrir o modal."""
    case_study = serializers.SerializerMethodField()

    class Meta(ProjectListSerializer.Meta):
        fields = ProjectListSerializer.Meta.fields + ['case_study']

    def get_case_study(self, obj):
        return obj.case_study_en if self._lang() == 'en' else obj.case_study_pt    