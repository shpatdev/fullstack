# backend/api/permissions.py
from rest_framework import permissions
from django.contrib.auth import get_user_model
from .models import User # Ensure User model is imported if needed for roles

User = get_user_model()

class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Leje e personalizuar për të lejuar vetëm pronarët e një objekti ose adminët ta modifikojnë atë.
    """
    def has_object_permission(self, request, view, obj):
        # Lejet për shkrim jepen vetëm pronarit të objektit ose adminit.
        if hasattr(obj, 'owner'): # Për modele si Restaurant
            return obj.owner == request.user or request.user.is_staff
        elif hasattr(obj, 'user'): # Për modele si Address, Review, DriverProfile
            return obj.user == request.user or request.user.is_staff
        # Për UserViewSet, ku objekti është vetë useri
        elif isinstance(obj, get_user_model()):
            return obj == request.user or request.user.is_staff
        return False


class IsOwnerOrAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS: return True
        return request.user and request.user.is_authenticated
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS: return True
        is_admin = request.user and request.user.is_staff
        if hasattr(obj, 'user') and obj.user == request.user: return True
        if hasattr(obj, 'owner') and obj.owner == request.user: return True
        if is_admin: return True
        return False


class IsRestaurantOwnerOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS: return True
        if not (request.user and request.user.is_authenticated): return False
        if request.user.is_staff: return True
        
        # Për CREATE actions
        if view.action == 'create' and view.basename == 'restaurant': # Krijimi i një restoranti të ri
            return request.user.role == User.Role.RESTAURANT_OWNER
        
        # Për nested resources OSE actions që operojnë mbi një instancë të lidhur me restorantin
        # si p.sh. add_reply te ReviewViewSet (ku pk është i review)
        # ose create/update/delete te MenuCategoryViewSet/MenuItemViewSet/OperatingHoursViewSet
        # (ku restaurant_pk është te kwargs)
        restaurant_pk = view.kwargs.get('restaurant_pk')
        
        # Nëse jemi duke shtuar reply te një review, review_pk është te kwargs['pk']
        # dhe restaurant_pk nuk është direkt te view.kwargs, por te review_instance.restaurant.id
        # Këtë rast e trajtojmë te has_object_permission
        if not restaurant_pk and view.action == 'add_reply' and view.basename.startswith('restaurant-reviews'):
            # Për add_reply, has_object_permission do të bëjë kontrollin
            return True 

        if restaurant_pk:
            from .models import Restaurant # Import i vonuar
            try:
                restaurant = Restaurant.objects.get(pk=restaurant_pk)
                return restaurant.owner == request.user
            except Restaurant.DoesNotExist:
                return False
        # Për veprime të tjera që nuk janë SAFE dhe nuk kanë restaurant_pk ose nuk janë create restaurant
        # duhet të kthejë False nëse nuk është admin.
        # Kjo mbulon rastet kur view nuk është nested ose nuk ka lidhje direkte me restaurant_pk në kwargs.
        # Për shembull, një action në UserViewSet nuk do të kalonte këtu.
        return False


    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS: return True
        if request.user and request.user.is_staff: return True
        
        target_restaurant = None
        # from .models import Restaurant, MenuCategory, MenuItem, OperatingHours, Review, Order # Import i vonuar
        
        obj_class_name = obj.__class__.__name__

        if obj_class_name == 'Restaurant': 
            target_restaurant = obj
        elif hasattr(obj, 'restaurant'): # Për MenuCategory, MenuItem, OperatingHours, Review, ReviewReply
            target_restaurant = obj.restaurant
        # elif obj_class_name == 'Order' and hasattr(obj, 'restaurant'): # Për OrderViewSet, tashmë mbulohet nga hasattr(obj, 'restaurant')
            # target_restaurant = obj.restaurant

        if target_restaurant:
            return target_restaurant.owner == request.user
        return False

class IsCustomer(permissions.BasePermission):
    """
    Lejon aksesin vetëm për përdoruesit me rolin CUSTOMER.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == User.Role.CUSTOMER)

class IsDriverPermission(permissions.BasePermission):
    """
    Lejon akses vetëm nëse përdoruesi është shofer (ose admin).
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role == User.Role.DRIVER or request.user.is_staff

class IsDriverOfOrderPermission(permissions.BasePermission):
    """
    Lejon akses vetëm nëse përdoruesi është shoferi i caktuar për atë porosi, ose admin.
    Përdoret për has_object_permission.
    """
    def has_object_permission(self, request, view, obj): # obj këtu është instanca e Order
        # Lejet për të lexuar mund të jenë më të gjera nëse dëshiron
        # if request.method in permissions.SAFE_METHODS:
        #     return obj.driver == request.user or obj.customer == request.user or \
        #            (obj.restaurant and obj.restaurant.owner == request.user) or \
        #            request.user.is_staff
        
        if request.user and request.user.is_staff: # Admini ka akses të plotë
            return True
        # Vetëm shoferi i caktuar mund të modifikojë (p.sh., statusin e dërgesës)
        return obj.driver == request.user

class IsAuthorOrAdminOrReadOnly(permissions.BasePermission):
    """
    Leje e personalizuar për të lejuar vetëm autorët e një objekti ose adminët ta modifikojnë atë.
    Të tjerët kanë qasje vetëm për lexim.
    """
    def has_permission(self, request, view):
        # Lejo metodat e sigurta (GET, HEAD, OPTIONS) për të gjithë.
        if request.method in permissions.SAFE_METHODS:
            return True
        # Për metodat e tjera (POST, PUT, DELETE), përdoruesi duhet të jetë i kyçur.
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Lejo metodat e sigurta (GET, HEAD, OPTIONS) për të gjithë.
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Lejet për shkrim (PUT, PATCH, DELETE) jepen vetëm autorit të objektit ose adminit.
        # Supozojmë se objekti ka një atribut 'user' ose 'owner'.
        # Për modelin Review, do të jetë 'user'.
        return obj.user == request.user or request.user.is_staff

class IsDriverProfileOwnerOrAdmin(permissions.BasePermission):
    """
    Lejon aksesin për të modifikuar profilin e shoferit vetëm nga vetë shoferi ose nga një admin.
    Të tjerët (nëse viewset-i do lejonte GET pa qenë admin/pronar) do kishin akses vetëm për lexim.
    """
    def has_object_permission(self, request, view, obj):
        # Adminët mund të bëjnë gjithçka
        if request.user and request.user.is_staff:
            return True
        # Shoferi mund të modifikojë vetëm profilin e tij
        return obj.user == request.user