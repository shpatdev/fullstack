from django.core.cache import cache
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Restaurant, CuisineType
from . import cache_utils # Importo modulin tonë ndihmës


@receiver([post_save, post_delete], sender=Restaurant)
def invalidate_restaurant_related_cache(sender, instance, **kwargs):
    """
    Ky sinjal thirret kur një restorant ruhet ose fshihet.
    Incrementon versionin e cache-it për listën publike të restoranteve.
    """
    print(f"Sinjal: Restoranti '{instance.name}' u modifikua.")
    cache_utils.increment_restaurants_list_public_cache_version()
    
    # Nëse keni cache për restorante individuale (p.sh., GET /api/restaurants/{id}/),
    # do të duhej të fshinit edhe atë çelës specifik këtu.
    # P.sh.: individual_restaurant_cache_key = f"restaurant_detail_{instance.pk}_v1"
    # cache.delete(individual_restaurant_cache_key)

@receiver([post_save, post_delete], sender=CuisineType)
def invalidate_cuisine_type_related_cache(sender, instance, **kwargs):
    """
    Ky sinjal thirret kur një lloj kuzhine ruhet ose fshihet.
    Incrementon versionin e cache-it për listën e llojeve të kuzhinave.
    """
    print(f"Sinjal: Lloji i kuzhinës '{instance.name}' u modifikua.")
    cache_utils.increment_cuisine_types_list_cache_version()

