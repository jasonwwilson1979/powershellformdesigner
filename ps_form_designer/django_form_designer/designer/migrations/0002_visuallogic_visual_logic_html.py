from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('designer', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='visuallogic',
            name='visual_logic_html',
            field=models.TextField(blank=True, default=''),
        ),
    ]
