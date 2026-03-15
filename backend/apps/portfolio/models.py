from django.db import models

class Profile(models.Model):
    """
    Dados Pessoais.
    """
    full_name = models.CharField(max_length=200)
    
    role_pt = models.CharField(max_length=200)
    role_en = models.CharField(max_length=200)
    bio_pt = models.TextField()
    bio_en = models.TextField()
    
    photo = models.ImageField(upload_to='profile/', blank=True, null=True)
    
    github_url = models.URLField(blank=True)
    linkedin_url = models.URLField(blank=True)
    email = models.EmailField(blank=True)
    
    # Texto circular animado
    seal_text_pt = models.CharField(max_length=100, default="Disponível para oportunidades · ")
    seal_text_en = models.CharField(max_length=100, default="Open to opportunities · ")
    
    class Meta:
        verbose_name = 'Perfil'
        
    def save(self, *args, **kwargs):
            if not self.pk and Profile.objects.exists():
                raise ValueError("Apenas um perfil pode existir.")
            super().save(*args, **kwargs)
            
    def __str__(self):
            return self.full_name
        
class Skill(models.Model):
    """Habilidades Técnicas"""

    CATEGORY_CHOICES = [
        ('backend', 'Back-end'),
        ('frontend', 'Front-end'),
        ('infra', 'Infraestrutura / DB'),
    ]
    
    name = models.CharField(max_length=100)
    # Nome do ícone
    icon_name = models.CharField(max_length=100)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['category','order',]
        
    def __str__(self):
        return f"{self.name} ({self.category})"

class Project(models.Model):
    """projetos do Github"""

    slug = models.SlugField(unique=True)
    featured = models.BooleanField(default=False)
    order = models.PositiveBigIntegerField(default=0)

    title_pt = models.CharField(max_length=200)
    title_en = models.CharField(max_length=200)
    short_description_pt = models.TextField(max_length=300)
    short_description_en = models.TextField(max_length=300)
    
    case_study_pt = models.TextField()
    case_study_en = models.TextField()
    
    repo_url = models.URLField(blank=True) # Link do repositório
    live_url = models.URLField(blank=True) # Link do projeto rodando
    
    skills = models.ManyToManyField(Skill, blank=True)
    thumbnail = models.ImageField(upload_to='projects/', blank=True, null=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.title_pt