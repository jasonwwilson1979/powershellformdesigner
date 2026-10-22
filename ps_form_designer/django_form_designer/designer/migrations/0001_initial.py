from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Form',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255, unique=True)),
                ('text', models.CharField(default='PowerShell Form', max_length=255)),
                ('size', models.CharField(default='800, 600', max_length=50)),
                ('location', models.CharField(default='100, 100', max_length=50)),
                ('back_color', models.CharField(default='#ffffff', max_length=20)),
                ('fore_color', models.CharField(default='#000000', max_length=20)),
                ('font', models.CharField(default='Microsoft Sans Serif', max_length=100)),
                ('controls', models.JSONField(blank=True, default=list)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['-updated_at'],
            },
        ),
        migrations.CreateModel(
            name='CodeSnippet',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255, unique=True)),
                ('description', models.TextField(blank=True, default='')),
                ('code', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='VisualLogic',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('control_name', models.CharField(max_length=255)),
                ('event_type', models.CharField(default='Click', max_length=100)),
                ('conditions', models.JSONField(blank=True, default=list)),
                ('actions', models.JSONField(blank=True, default=list)),
                ('script', models.TextField(blank=True, default='')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('form', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='visual_logics', to='designer.form')),
            ],
            options={
                'ordering': ['control_name', 'event_type'],
            },
        ),
    ]
