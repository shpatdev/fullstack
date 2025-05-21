from django.conf import settings
from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ("core", "0003_remove_user_is_admin_remove_user_is_customer_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="order",
            name="user",
            field=models.ForeignKey(
                to=settings.AUTH_USER_MODEL,
                null=True,
                on_delete=models.CASCADE,
                related_name="orders",
            ),
        ),
    ]