from django.utils.text import slugify
from rest_framework import serializers
from storages.backends.s3 import S3Storage

from .models import Profile, Skill, Project

CV_SUFFIX = {'pt': 'curriculo', 'en': 'resume'}

class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = [ 'id', 'name', 'icon_name', 'category', 'order']
        
    
class ProfileSerializer(serializers.ModelSerializer):
    #Campors virtuais
    role = serializers.SerializerMethodField()
    bio = serializers.SerializerMethodField()
    seal_text =  serializers.SerializerMethodField()
    cv = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = ['id', 'full_name', 'role', 'bio', 'photo', 'github_url', 'linkedin_url', 'email', 'seal_text', 'cv']

    def _lang(self):
        request = self.context.get('request')
        return request.query_params.get('lang', 'pt') if request else 'pt'

    def get_role(self, obj):
        return obj.role_en if self._lang() == 'en' else obj.role_pt

    def get_bio(self, obj):
        return obj.bio_en if self._lang() == 'en' else obj.bio_pt

    def get_seal_text(self, obj):
        return obj.seal_text_en if self._lang() == 'en' else obj.seal_text_pt

    def get_cv(self, obj):
        # Sem a versão do idioma pedido, entrega a outra: currículo em outra língua é melhor que nenhum.
        order = [('en', obj.cv_en), ('pt', obj.cv_pt)]
        if self._lang() != 'en':
            order.reverse()
        lang, cv = next(((lang, f) for lang, f in order if f), (None, None))
        if cv is None:
            return None

        if isinstance(cv.storage, S3Storage):
            # A URL assinada é de outro domínio, onde o atributo download do <a> é ignorado:
            # quem força o download, com nome legível, é o próprio bucket.
            filename = f"{slugify(obj.full_name)}-{CV_SUFFIX[lang]}.pdf"
            url = cv.storage.url(cv.name, parameters={
                'ResponseContentDisposition': f'attachment; filename="{filename}"',
            })
        else:
            url = cv.url
        request = self.context.get('request')
        return request.build_absolute_uri(url) if request else url

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