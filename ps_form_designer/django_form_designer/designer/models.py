from django.db import models
from django.utils import timezone


class Form(models.Model):
    """Model to store PowerShell form designs"""
    name = models.CharField(max_length=255, unique=True)
    text = models.CharField(max_length=255, default='PowerShell Form')
    size = models.CharField(max_length=50, default='800, 600')
    location = models.CharField(max_length=50, default='100, 100')
    back_color = models.CharField(max_length=20, default='#ffffff')
    fore_color = models.CharField(max_length=20, default='#000000')
    font = models.CharField(max_length=100, default='Microsoft Sans Serif')
    controls = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return self.name


class CodeSnippet(models.Model):
    """Model to store reusable code snippets"""
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True, default='')
    code = models.TextField()
    tags = models.CharField(max_length=500, blank=True, default='')  # Comma-separated tags
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class VisualLogic(models.Model):
    """Model to store visual logic entries for controls"""
    form = models.ForeignKey(Form, on_delete=models.CASCADE, related_name='visual_logics')
    control_name = models.CharField(max_length=255)
    event_type = models.CharField(max_length=100, default='Click')
    conditions = models.JSONField(default=list, blank=True)
    actions = models.JSONField(default=list, blank=True)
    script = models.TextField(blank=True, default='')
    visual_logic_html = models.TextField(blank=True, default='')  # Store the visual logic HTML
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['control_name', 'event_type']

    def __str__(self):
        return f"{self.control_name} - {self.event_type}"
