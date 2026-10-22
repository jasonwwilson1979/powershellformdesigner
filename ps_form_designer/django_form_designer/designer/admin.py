from django.contrib import admin
from .models import Form, CodeSnippet, VisualLogic


@admin.register(Form)
class FormAdmin(admin.ModelAdmin):
    list_display = ('name', 'text', 'created_at', 'updated_at')
    search_fields = ('name', 'text')
    list_filter = ('created_at', 'updated_at')


@admin.register(CodeSnippet)
class CodeSnippetAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'created_at', 'updated_at')
    search_fields = ('name', 'description', 'code')


@admin.register(VisualLogic)
class VisualLogicAdmin(admin.ModelAdmin):
    list_display = ('control_name', 'event_type', 'form', 'created_at', 'updated_at')
    search_fields = ('control_name', 'event_type')
    list_filter = ('event_type', 'form')
