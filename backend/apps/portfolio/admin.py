from django.contrib import admin
from .models import Profile, Skill, Project

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    fieldsets = (
        ('Identidade', {'fields': ('full_name', 'photo')}),
        ('Cargo', {'fields': ('role_pt', 'role_en')}),
        ('Bio', {'fields': ('bio_pt', 'bio_en')}),
        ('Selo Rotativo', {'fields': ('seal_text_pt', 'seal_text_en')}),
        ('Links', {'fields': ('github_url', 'linkedin_url', 'email')}),
    )

@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'order']
    list_editable = ['order']
    list_filter = ['category']

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['title_pt', 'featured', 'order']
    list_editable = ['featured', 'order']
    prepopulated_fields = {'slug': ('title_pt',)}
    filter_horizontal = ['skills']