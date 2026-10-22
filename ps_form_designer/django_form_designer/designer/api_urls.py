from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FormViewSet, CodeSnippetViewSet, VisualLogicViewSet, backup_data, import_data

router = DefaultRouter()
router.register(r'forms', FormViewSet, basename='form')
router.register(r'snippets', CodeSnippetViewSet, basename='snippet')
router.register(r'visual-logic', VisualLogicViewSet, basename='visual-logic')

urlpatterns = [
    path('', include(router.urls)),
    path('backup/', backup_data, name='backup-data'),
    path('import/', import_data, name='import-data'),
]
