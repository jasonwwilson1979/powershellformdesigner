from rest_framework import serializers
from .models import Form, CodeSnippet, VisualLogic


class VisualLogicSerializer(serializers.ModelSerializer):
    """Serializer for VisualLogic model"""
    class Meta:
        model = VisualLogic
        fields = ['id', 'control_name', 'event_type', 'script', 'conditions', 'actions', 'visual_logic_html']


class FormSerializer(serializers.ModelSerializer):
    """Serializer for Form model with nested visual logics"""
    visual_logics = VisualLogicSerializer(many=True, read_only=True)

    class Meta:
        model = Form
        fields = ['id', 'name', 'text', 'size', 'location', 'back_color', 'fore_color', 
                  'font', 'controls', 'visual_logics', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class CodeSnippetSerializer(serializers.ModelSerializer):
    """Serializer for CodeSnippet model"""
    class Meta:
        model = CodeSnippet
        fields = ['id', 'name', 'description', 'code', 'tags', 'created_at', 'updated_at']
