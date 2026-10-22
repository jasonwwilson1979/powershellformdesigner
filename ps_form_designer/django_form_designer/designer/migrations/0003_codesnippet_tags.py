from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('designer', '0002_visuallogic_visual_logic_html'),
    ]

    operations = [
        migrations.AddField(
            model_name='codesnippet',
            name='tags',
            field=models.CharField(blank=True, default='', max_length=500),
        ),
    ]
