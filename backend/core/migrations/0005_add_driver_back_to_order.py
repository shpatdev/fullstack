from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ("core", "0004_add_user_back_to_order"),  
    ]

    operations = [
        migrations.AddField(
            model_name="order",
            name="driver",
            field=models.ForeignKey(
                to="core.driverprofile",
                null=True,
                blank=True,
                on_delete=models.SET_NULL,
                related_name="orders",
            ),
        ),
    ]