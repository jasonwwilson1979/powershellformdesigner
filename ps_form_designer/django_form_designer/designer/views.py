from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.http import JsonResponse
from django.db.models import Q
from .models import Form, CodeSnippet, VisualLogic
from .serializers import FormSerializer, CodeSnippetSerializer, VisualLogicSerializer
import logging
import json

logger = logging.getLogger(__name__)


class FormViewSet(viewsets.ModelViewSet):
    """ViewSet for Form CRUD operations"""
    queryset = Form.objects.all()
    serializer_class = FormSerializer
    lookup_field = 'name'  # Use name instead of ID for lookup

    def get_queryset(self):
        """Optionally filter forms by query params"""
        queryset = Form.objects.all()
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(text__icontains=search)
            )
        return queryset

    def create(self, request, *args, **kwargs):
        """Handle form creation - use update_or_create to avoid duplicates"""
        name = request.data.get('name')
        if not name:
            return Response({'error': 'Name is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            logger.info(f'Creating/updating form: {name}')
            form, created = Form.objects.update_or_create(
                name=name,
                defaults={
                    'text': request.data.get('text', 'PowerShell Form'),
                    'size': request.data.get('size', '800, 600'),
                    'location': request.data.get('location', '100, 100'),
                    'back_color': request.data.get('back_color', '#ffffff'),
                    'fore_color': request.data.get('fore_color', '#000000'),
                    'font': request.data.get('font', 'Microsoft Sans Serif'),
                    'controls': request.data.get('controls', [])
                }
            )
            logger.info(f'Form {"created" if created else "updated"}: {name}')
            
            serializer = self.get_serializer(form)
            return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
        except Exception as e:
            logger.error(f'Error creating form: {e}')
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def update(self, request, *args, **kwargs):
        """Handle form update"""
        return self.create(request, *args, **kwargs)  # Use same logic as create

    def retrieve(self, request, *args, **kwargs):
        """Retrieve a form by name"""
        instance = self.get_object()
        # Prefetch visual_logics to ensure they're included
        from django.db.models import Prefetch
        instance = Form.objects.prefetch_related('visual_logics').get(name=kwargs.get('name'))
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class CodeSnippetViewSet(viewsets.ModelViewSet):
    """ViewSet for CodeSnippet CRUD operations"""
    queryset = CodeSnippet.objects.all()
    serializer_class = CodeSnippetSerializer
    lookup_field = 'name'

    def get_queryset(self):
        """Filter snippets by search query"""
        queryset = CodeSnippet.objects.all()
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search) | Q(code__icontains=search)
            )
        return queryset


class VisualLogicViewSet(viewsets.ModelViewSet):
    """ViewSet for VisualLogic CRUD operations"""
    queryset = VisualLogic.objects.all()
    serializer_class = VisualLogicSerializer

    def create(self, request, *args, **kwargs):
        """Handle visual logic creation with better error handling"""
        try:
            form_id = request.data.get('form')
            control_name = request.data.get('control_name')
            event_type = request.data.get('event_type')
            script = request.data.get('script', '')
            
            if not form_id or not control_name:
                return Response({'error': 'form and control_name are required'}, 
                              status=status.HTTP_400_BAD_REQUEST)
            
            # Get the form
            try:
                form = Form.objects.get(id=form_id)
            except Form.DoesNotExist:
                return Response({'error': f'Form with ID {form_id} not found'}, 
                              status=status.HTTP_404_NOT_FOUND)
            
            # Create or update visual logic
            vl, created = VisualLogic.objects.update_or_create(
                form=form,
                control_name=control_name,
                event_type=event_type,
                defaults={
                    'script': script,
                    'conditions': request.data.get('conditions', []),
                    'actions': request.data.get('actions', []),
                    'visual_logic_html': request.data.get('visual_logic_html', '')
                }
            )
            
            serializer = self.get_serializer(vl)
            return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f'Error creating visual logic: {e}')
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def get_queryset(self):
        """Filter visual logic by form or control"""
        queryset = VisualLogic.objects.all()
        form_id = self.request.query_params.get('form_id', None)
        control_name = self.request.query_params.get('control_name', None)

        if form_id:
            queryset = queryset.filter(form_id=form_id)
        if control_name:
            queryset = queryset.filter(control_name__icontains=control_name)

        return queryset


@api_view(['POST'])
def backup_data(request):
    """Export all data as JSON backup"""
    try:
        forms = Form.objects.all()
        snippets = CodeSnippet.objects.all()
        
        backup_data = {
            'version': '1.0',
            'forms': FormSerializer(forms, many=True).data,
            'code_snippets': CodeSnippetSerializer(snippets, many=True).data,
        }
        
        return Response(backup_data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def import_data(request):
    """Import data from JSON backup"""
    try:
        data = request.data
        
        # Import forms
        forms_imported = 0
        for form_data in data.get('forms', []):
            name = form_data.get('name')
            if name:
                form, created = Form.objects.update_or_create(
                    name=name,
                    defaults={
                        'text': form_data.get('text', 'PowerShell Form'),
                        'size': form_data.get('size', '800, 600'),
                        'location': form_data.get('location', '100, 100'),
                        'back_color': form_data.get('back_color', '#ffffff'),
                        'fore_color': form_data.get('fore_color', '#000000'),
                        'font': form_data.get('font', 'Microsoft Sans Serif'),
                        'controls': form_data.get('controls', []),
                    }
                )
                forms_imported += 1
                
                # Import visual logics for this form
                for vl_data in form_data.get('visual_logics', []):
                    VisualLogic.objects.update_or_create(
                        form=form,
                        control_name=vl_data.get('control_name'),
                        event_type=vl_data.get('event_type'),
                        defaults={
                            'conditions': vl_data.get('conditions', []),
                            'actions': vl_data.get('actions', []),
                            'script': vl_data.get('script', ''),
                        }
                    )
        
        # Import code snippets
        snippets_imported = 0
        for snippet_data in data.get('code_snippets', []):
            name = snippet_data.get('name')
            if name:
                CodeSnippet.objects.update_or_create(
                    name=name,
                    defaults={
                        'description': snippet_data.get('description', ''),
                        'code': snippet_data.get('code', ''),
                    }
                )
                snippets_imported += 1
        
        return Response({
            'message': 'Import successful',
            'forms_imported': forms_imported,
            'snippets_imported': snippets_imported
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
