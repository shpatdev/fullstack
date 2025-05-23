# backend/api/views.py
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.utils import timezone 
from django.utils.decorators import method_decorator 
from django.core.cache import cache # Importo cache direkt
from . import cache_utils # Importo modulin tonë ndihmës

from rest_framework import generics, permissions, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken, TokenError


from .models import (
    User, Address, CuisineType, Restaurant, OperatingHours, 
    MenuCategory, MenuItem, Order, OrderItem, Review, DriverProfile,
    ReviewReply, PageViewLog,
    Cart, CartItem # SHTO MODELET E SHPORTËS
)
from .serializers import (
    UserDetailSerializer, UserRegistrationSerializer, AddressSerializer,
    CuisineTypeSerializer, RestaurantListSerializer, RestaurantDetailSerializer,
    OperatingHoursSerializer, MenuCategorySerializer, MenuItemSerializer,
    CustomTokenObtainPairSerializer,
    OrderListSerializer, OrderDetailSerializer, OrderItemSerializer,
    ReviewSerializer, DriverProfileSerializer, ReviewReplySerializer,
    CartSerializer, CartItemSerializer, UserAdminManagementSerializer # SHTO SERIALIZERS E SHPORTËS DHE UserAdminManagementSerializer
)
from .permissions import (
    IsOwnerOrAdmin, IsRestaurantOwnerOrAdmin, IsCustomer,
    IsAuthorOrAdminOrReadOnly, 
    IsDriverProfileOwnerOrAdmin,
    IsAdminOrReadOnly, 
    IsOwnerOrAdminOrReadOnly,
    IsDriverPermission, IsDriverOfOrderPermission # Ensure IsRestaurantOwnerOrAdmin, IsCustomer, IsDriverPermission, IsDriverOfOrderPermission are here
)
from django.db.models import Count, Sum, F, ExpressionWrapper, fields # SHTO F, ExpressionWrapper, fields

User = get_user_model()

# --- Auth & User Views ---
class UserRegistrationAPIView(generics.CreateAPIView):
    """
    Endpoint për regjistrimin e përdoruesve të rinj.
    Lejon këdo të krijojë një llogari të re.
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class LogoutAPIView(APIView):
    """
    Endpoint për logout. Invalidon (shton në blacklist) refresh token-in e dhënë.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token is None:
                return Response({"detail": "Refresh token kërkohet."}, status=status.HTTP_400_BAD_REQUEST)
            
            token = RefreshToken(refresh_token)
            token.blacklist()
            
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except TokenError as e:
            # Kthejmë një përgjigje më standarde për TokenError
            return Response({"detail": "Token invalid ose i skaduar."}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            # Mund të shtosh logging më të mirë këtu për production
            print(f"Logout error: {e}") 
            return Response({"detail": "Gabim gjatë procesit të logout."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ...
class UserMeAPIView(generics.RetrieveUpdateAPIView):
    """
    Endpoint për të marrë dhe përditësuar detajet e përdoruesit të kyçur aktualisht.
    Lejon modifikimin e fushave si emri, mbiemri, bio, foto profili, dhe disponueshmëria për shoferët.
    """
    serializer_class = UserDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', True) # Bëje PATCH default për /me/
        instance = self.get_object()
        
        # Lejo vetëm disa fusha të modifikohen nga vetë useri
        allowed_fields_to_update = ['first_name', 'last_name', 'phone_number', 'bio', 'profile_picture'] # Ndryshuar nga profile_picture_url_placeholder
        if instance.role == User.Role.DRIVER: # Shoferi mund të modifikojë edhe disponueshmërinë
            allowed_fields_to_update.append('is_available_for_delivery')

        data_to_update = {}
        for field in allowed_fields_to_update:
            if field in request.data:
                data_to_update[field] = request.data[field]
        
        serializer = self.get_serializer(instance, data=data_to_update, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if getattr(instance, '_prefetched_objects_cache', None):
            instance._prefetched_objects_cache = {}
        return Response(serializer.data)

    # Mund të shtosh një @action specifik nëse preferon një endpoint të dedikuar
    # @action(detail=False, methods=['patch'], url_path='set-availability')
    # def set_availability(self, request):
    #     user = request.user
    #     if user.role != User.Role.DRIVER:
    #         return Response({"detail": "Vetëm shoferët mund të ndryshojnë disponueshmërinë."}, status=status.HTTP_403_FORBIDDEN)
    #     
    #     is_available = request.data.get('is_available')
    #     if not isinstance(is_available, bool):
    #         return Response({"detail": "Fusha 'is_available' (boolean) kërkohet."}, status=status.HTTP_400_BAD_REQUEST)
    #     
    #     user.is_available_for_delivery = is_available
    #     user.save(update_fields=['is_available_for_delivery'])
    #     return Response(UserDetailSerializer(user).data)

# ...

class UserViewSet(viewsets.ModelViewSet): 
    """
    Menaxhimi i përdoruesve (Vetëm për Adminët).
    Ky ViewSet lejon adminët të listojnë, marrin, përditësojnë dhe fshijnë përdorues.
    Për create dhe update përdoret UserAdminManagementSerializer.
    Për list dhe retrieve përdoret UserDetailSerializer.
    """
    queryset = User.objects.all().order_by('-date_joined')
    # serializer_class = UserAdminManagementSerializer # Hiq këtë, përdor get_serializer_class
    permission_classes = [permissions.IsAdminUser]

    def get_serializer_class(self):
        if self.action == 'list' or self.action == 'retrieve':
            return UserDetailSerializer # Për pamje të detajuar kur listohet ose merret një user
        return UserAdminManagementSerializer # Për create, update, partial_update

    def perform_create(self, serializer):
        # UserAdminManagementSerializer.create tashmë e trajton logjikën e krijimit,
        # përfshirë fjalëkalimin nëse dërgohet në payload.
        # Sigurohu që UserAdminManagementSerializer.create pret 'password' në validated_data
        # dhe e bën hash. Frontend-i duhet ta dërgojë atë.
        serializer.save()

    # Mund të shtosh actions të tjera këtu, p.sh., për të ndryshuar fjalëkalimin e një useri nga admini
    @action(detail=True, methods=['post'], url_path='set-password-admin', permission_classes=[permissions.IsAdminUser])
    def set_password_admin(self, request, pk=None):
        user_to_update = self.get_object()
        new_password = request.data.get('new_password')
        if not new_password or len(new_password) < 6: # Shto validime më të mira
            return Response({"detail": "Fjalëkalimi i ri kërkohet dhe duhet të jetë të paktën 6 karaktere."}, status=status.HTTP_400_BAD_REQUEST)
        
        user_to_update.set_password(new_password)
        user_to_update.save()
        return Response({"message": f"Fjalëkalimi për {user_to_update.email} është ndryshuar me sukses."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='reset-password-admin', permission_classes=[permissions.IsAdminUser])
    def reset_password_admin(self, request, pk=None):
        user_to_reset = self.get_object()
        # KËTU IMPLEMENTO LOGJIKËN REALE PËR RESETIM
        # P.sh., gjenero token, dërgo email.
        # Për testim:
        # from django.contrib.auth.tokens import default_token_generator
        # from django.utils.http import urlsafe_base64_encode
        # from django.utils.encoding import force_bytes
        # token = default_token_generator.make_token(user_to_reset)
        # uid = urlsafe_base64_encode(force_bytes(user_to_reset.pk))
        # reset_link = f"http://your-frontend.com/auth/reset-password-confirm/{uid}/{token}/" # Përshtate
        # print(f"RESET LINK (SIMULATED): {reset_link}")
        # Dergo email me këtë link
        return Response({"message": f"Kërkesa për resetimin e fjalëkalimit për {user_to_reset.email} është simuluar."}, status=status.HTTP_200_OK)


class AddressViewSet(viewsets.ModelViewSet):
    """
    Menaxhimi i adresave për përdoruesit e kyçur.
    Përdoruesit mund të krijojnë, listojnë, marrin, përditësojnë dhe fshijnë adresat e tyre.
    Adminët mund të menaxhojnë të gjitha adresat.
    """
    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdminOrReadOnly] # Përdor këtë leje

    def get_queryset(self):
        # Kthe vetëm adresat e përdoruesit të kyçur
        # Admini mund të shohë të gjitha adresat nëse e konfiguron ndryshe (p.sh., në një endpoint tjetër)
        if self.request.user.is_staff: # Lejo adminin të shohë/menaxhojë të gjitha adresat
             return Address.objects.all().order_by('-user__id', '-is_default_shipping', '-created_at')
        return Address.objects.filter(user=self.request.user).order_by('-is_default_shipping', '-created_at')

    def perform_create(self, serializer):
        # Cakto userin e adresës të jetë përdoruesi i kyçur
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        # Sigurohu që useri nuk ndryshohet gjatë update, përveç nga admini
        # Leja IsOwnerOrAdminOrReadOnly e trajton këtë në has_object_permission
        # Nëse useri në payload është i ndryshëm dhe request.user nuk është admin, do të refuzohet.
        # Por, për siguri, mund ta heqim userin nga validated_data nëse nuk është admin.
        if not self.request.user.is_staff and 'user' in serializer.validated_data:
            serializer.validated_data.pop('user')
        serializer.save() # Useri nuk duhet të jetë pjesë e payload-it për update nga një user normal

class CuisineTypeViewSet(viewsets.ModelViewSet):
    """
    Menaxhimi i Llojeve të Kuzhinave.
    Adminët mund të krijojnë, modifikojnë, fshijnë llojet e kuzhinave.
    Të gjithë përdoruesit (edhe anonimë) mund t'i listojnë dhe t'i shohin ato.
    """
    queryset = CuisineType.objects.all().order_by('name')
    serializer_class = CuisineTypeSerializer
    permission_classes = [IsAdminOrReadOnly] 

    # @method_decorator(cache_page(60 * 15)) # Hiq këtë
    def list(self, request, *args, **kwargs):
        cache_key = cache_utils.get_cuisine_types_list_cache_key()
        cached_data = cache.get(cache_key)

        if cached_data:
            print(f"Cache HIT for CuisineTypes: {cache_key}")
            return Response(cached_data)
        
        print(f"Cache MISS for CuisineTypes: {cache_key}")
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        response_data = serializer.data
        cache.set(cache_key, response_data, timeout=60 * 15) # Cache për 15 minuta
        return Response(response_data)


class RestaurantViewSet(viewsets.ModelViewSet):
    """
    Menaxhimi i Restoranteve.
    - Liston restorantet aktive dhe të aprovuara për publikun.
    - Pronarët e restoranteve mund të menaxhojnë restorantet e tyre.
    - Adminët mund të menaxhojnë të gjitha restorantet dhe të aprovojnë restorantet e reja.
    """
    queryset = Restaurant.objects.all().select_related('owner', 'address').prefetch_related('cuisine_types', 'operating_hours')

    def get_serializer_class(self):
        if self.action == 'list':
            return RestaurantListSerializer
        return RestaurantDetailSerializer

    def get_queryset(self):
        user = self.request.user
        # Fillo me queryset-in bazë të viewset-it
        queryset = self.queryset # Përdor queryset-in e definuar në klasë

        if user.is_authenticated:
            if user.is_staff: # Admini sheh gjithçka, por mund të filtrojë
                name_filter = self.request.query_params.get('name__icontains')
                approval_filter_str = self.request.query_params.get('is_approved')
                activity_filter_str = self.request.query_params.get('is_active')
                owner_filter = self.request.query_params.get('owner_id')

                if name_filter:
                    queryset = queryset.filter(name__icontains=name_filter)
                if approval_filter_str is not None:
                    is_approved_param = approval_filter_str.lower() == 'true'
                    queryset = queryset.filter(is_approved=is_approved_param)
                if activity_filter_str is not None:
                    is_active_param = activity_filter_str.lower() == 'true'
                    queryset = queryset.filter(is_active=is_active_param)
                if owner_filter:
                    queryset = queryset.filter(owner_id=owner_filter)
                
                return queryset.order_by('-is_approved', 'is_active', '-created_at')

            if user.role == User.Role.RESTAURANT_OWNER:
                # Pronari sheh restorantet e veta
                return queryset.filter(owner=user).order_by('-created_at')
        
        # Përdoruesit e tjerë (klientë, anonimë) shohin vetëm aktivët dhe të aprovuarit
        return queryset.filter(is_active=True, is_approved=True).order_by('name')

    def get_permissions(self):
        # 'log_page_view' duhet të jetë një action i definuar në këtë ViewSet
        if self.action in ['list', 'retrieve', 'menu_items_for_restaurant', 'menu_categories_for_restaurant', 'log_page_view']:
            return [permissions.AllowAny()]
        
        if self.action == 'create':
            # Për të krijuar një restorant, duhet të jesh i kyçur dhe të kesh rolin e duhur
            # ose të jesh admin. IsRestaurantOwnerOrAdmin do të kontrollojë këtë.
            return [permissions.IsAuthenticated(), IsRestaurantOwnerOrAdmin()] 
            
        if self.action == 'approve_restaurant':
            # Vetëm adminët mund të aprovojnë
            return [permissions.IsAdminUser()]
        
        # Për veprimet e tjera si update, partial_update, destroy, toggle_active_status, etj.
        return [permissions.IsAuthenticated(), IsRestaurantOwnerOrAdmin()]

    # @method_decorator(cache_page(60 * 15)) # Hiq këtë
    def list(self, request, *args, **kwargs):
        # ----- FILLIMI I KODIT TE CACHE PER TA KOMENTUAR PERKOHESISHT -----
        # user = request.user
        # is_public_view_eligible_for_cache = not user.is_authenticated or user.role == User.Role.CUSTOMER

        # cache_key = None
        # if is_public_view_eligible_for_cache: 
        #     cache_key = cache_utils.get_restaurants_list_public_cache_key(request)
        #     cached_response_data = cache.get(cache_key)
        #     if cached_response_data:
        #         print(f"Cache HIT for Restaurants (public): {cache_key}")
        #         return Response(cached_response_data)
        #     print(f"Cache MISS for Restaurants (public): {cache_key}")
        # ----- FUNDI I KODIT TE CACHE PER TA KOMENTUAR PERKOHESISHT -----

        queryset = self.filter_queryset(self.get_queryset())

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            response = self.get_paginated_response(serializer.data)
            # ----- FILLIMI I KODIT TE CACHE PER TA KOMENTUAR PERKOHESISHT -----
            # if is_public_view_eligible_for_cache and cache_key:
            #     cache.set(cache_key, response.data, timeout=cache_utils.RESTAURANT_LIST_CACHE_TTL) 
            # ----- FUNDI I KODIT TE CACHE PER TA KOMENTUAR PERKOHESISHT -----
            return response

        serializer = self.get_serializer(queryset, many=True)
        # ----- FILLIMI I KODIT TE CACHE PER TA KOMENTUAR PERKOHESISHT -----
        # response_data = serializer.data
        # if is_public_view_eligible_for_cache: 
        #     all_items_cache_key = cache_utils.get_restaurants_list_public_all_items_cache_key()
        #     cached_all_items = cache.get(all_items_cache_key)
        #     if cached_all_items:
        #         print(f"Cache HIT for Restaurants (public, all items): {all_items_cache_key}")
        #         return Response(cached_all_items)
            
        #     print(f"Cache MISS for Restaurants (public, all items): {all_items_cache_key}")
        #     cache.set(all_items_cache_key, response_data, timeout=cache_utils.RESTAURANT_LIST_CACHE_TTL)
        # ----- FUNDI I KODIT TE CACHE PER TA KOMENTUAR PERKOHESISHT -----
        return Response(serializer.data) # Sigurohu që kjo kthen serializer.data direkt

    def perform_create(self, serializer):
        # RestaurantDetailSerializer.create e trajton logjikën e caktimit të owner-it
        # dhe statuset fillestare (is_approved, is_active) bazuar në rolin e userit.
        # Ai përdor self.context['request'].user.
        serializer.save()
        # Invalido cache pas krijimit të një restoranti të ri
        cache_utils.increment_restaurants_list_public_cache_version()


    @action(detail=True, methods=['get'], url_path='menu-items', permission_classes=[permissions.AllowAny])
    def menu_items_for_restaurant(self, request, pk=None):
        restaurant = get_object_or_404(Restaurant, pk=pk, is_active=True, is_approved=True) # Vetëm nga restorantet publike
        items = MenuItem.objects.filter(restaurant=restaurant, is_available=True).order_by('category__display_order', 'name')
        serializer = MenuItemSerializer(items, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='menu-categories', permission_classes=[permissions.AllowAny])
    def menu_categories_for_restaurant(self, request, pk=None):
        restaurant = get_object_or_404(Restaurant, pk=pk, is_active=True, is_approved=True)
        categories = MenuCategory.objects.filter(restaurant=restaurant).order_by('display_order', 'name')
        # Përdor MenuCategorySerializer që i ka menu_items nested
        serializer = MenuCategorySerializer(categories, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'], url_path='approve', permission_classes=[permissions.IsAdminUser]) 
    def approve_restaurant(self, request, pk=None):
        """
        Aprovon një restorant. Vetëm për Adminët.
        Vendos `is_approved = True`. Mund të vendosë edhe `is_active = True` nëse dërgohet.
        """
        restaurant = self.get_object() 
        
        # Admini mund të dërgojë "make_active_on_approval": true/false në payload
        make_active_str = request.data.get('make_active_on_approval', 'true') # Default e bën aktiv
        make_active = str(make_active_str).lower() == 'true'

        restaurant.is_approved = True
        if make_active: # Bëje aktiv vetëm nëse kërkohet dhe është aprovuar
            restaurant.is_active = True 
        
        restaurant.save()
        # Invalido cache
        cache_utils.increment_restaurants_list_public_cache_version()
        cache_utils.invalidate_restaurant_detail_cache(restaurant.id)
        return Response(RestaurantDetailSerializer(restaurant, context={'request': request}).data)
        
    @action(detail=True, methods=['patch'], url_path='toggle-active', permission_classes=[IsRestaurantOwnerOrAdmin])
    def toggle_active_status(self, request, pk=None):
        """
        Ndryshon statusin aktiv/joaktiv të një restoranti.
        Vetëm për pronarin e restorantit ose adminin.
        Restoranti duhet të jetë i aprovuar për t'u bërë aktiv.
        Mund të dërgohet `{"is_active": true/false}` në payload, ose do bëjë toggle.
        """
        restaurant = self.get_object() 

        new_active_status_str = request.data.get('is_active')
        if new_active_status_str is None: # Nëse nuk jepet, bëj toggle
            new_is_active = not restaurant.is_active
        else:
            new_is_active = str(new_active_status_str).lower() == 'true'
        
        if not restaurant.is_approved and new_is_active is True:
            return Response({"detail": "Restoranti duhet të aprovohet nga administratori para se të mund të aktivizohet."}, status=status.HTTP_400_BAD_REQUEST)

        restaurant.is_active = new_is_active
        restaurant.save()
        # Invalido cache
        cache_utils.increment_restaurants_list_public_cache_version()
        cache_utils.invalidate_restaurant_detail_cache(restaurant.id)
        return Response(RestaurantDetailSerializer(restaurant, context={'request': request}).data)

    def perform_destroy(self, instance):
        # Sigurohu që vetëm adminët mund të fshijnë
        if not self.request.user.is_staff:
            # Kjo duhet të jetë e mbuluar nga IsRestaurantOwnerOrAdmin në get_permissions
            # por si një shtresë shtesë sigurie.
            raise permissions.PermissionDenied("Vetëm administratorët mund të fshijnë restorante.")
        
        restaurant_id_for_cache = instance.id # Merr ID para fshirjes
        super().perform_destroy(instance)
        
        # Invalido cache
        cache_utils.increment_restaurants_list_public_cache_version()
        cache_utils.invalidate_restaurant_detail_cache(restaurant_id_for_cache)

    @action(detail=True, methods=['post'], url_path='log-view', permission_classes=[permissions.AllowAny])
    def log_page_view(self, request, pk=None):
        restaurant = get_object_or_404(Restaurant, pk=pk, is_active=True, is_approved=True)
        
        # Përdoruesi (mund të jetë anonim)
        user = request.user if request.user.is_authenticated else None
        
        # IP Adresa
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[0]
        else:
            ip_address = request.META.get('REMOTE_ADDR')
            
        # User Agent
        user_agent = request.META.get('HTTP_USER_AGENT', '')

        # Krijo log entry
        PageViewLog.objects.create(
            restaurant=restaurant,
            user=user,
            ip_address=ip_address,
            user_agent=user_agent
        )
        return Response({"message": "Page view logged successfully."}, status=status.HTTP_201_CREATED)


class OperatingHoursViewSet(viewsets.ModelViewSet):
    """
    Menaxhimi i Orarit të Punës për një restorant specifik (nested).
    Lejon pronarët e restoranteve dhe adminët të menaxhojnë orarin.
    Të tjerët mund ta lexojnë.
    """
    serializer_class = OperatingHoursSerializer
    # Lejo pronarin e restorantit ose adminin të modifikojë, të tjerët lexojnë.
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsRestaurantOwnerOrAdmin]


    def get_queryset(self):
        restaurant_pk = self.kwargs.get('restaurant_pk')
        if restaurant_pk:
            # Sigurohu që restoranti ekziston
            get_object_or_404(Restaurant, pk=restaurant_pk)
            return OperatingHours.objects.filter(restaurant_id=restaurant_pk).order_by('day_of_week')
        return OperatingHours.objects.none()

    # def get_permissions(self):
    #     # IsRestaurantOwnerOrAdmin do të trajtojë këtë.
    #     # SAFE_METHODS lejohen nga IsRestaurantOwnerOrAdmin.
    #     # Për shkrim, IsRestaurantOwnerOrAdmin kontrollon pronësinë e restaurant_pk ose admin statusin.
    #     return [permissions.IsAuthenticated(), IsRestaurantOwnerOrAdmin()]

    def perform_create(self, serializer):
        restaurant_pk = self.kwargs.get('restaurant_pk')
        restaurant = get_object_or_404(Restaurant, pk=restaurant_pk)
        
        # Kontrolli për duplikim të ditës së javës bëhet nga unique_together në model.
        # Mund të shtosh validim shtesë këtu ose në serializer për mesazhe më të mira.
        # if OperatingHours.objects.filter(restaurant=restaurant, day_of_week=serializer.validated_data['day_of_week']).exists():
        #     raise serializers.ValidationError({"day_of_week": "Orari për këtë ditë tashmë ekziston."})
            
        serializer.save(restaurant=restaurant)

class MenuCategoryViewSet(viewsets.ModelViewSet):
    """
    Menaxhimi i Kategorive të Menusë për një restorant specifik (nested).
    Lejon pronarët e restoranteve dhe adminët të menaxhojnë kategoritë.
    Të tjerët mund t'i lexojnë.
    """
    serializer_class = MenuCategorySerializer
    # Lejo pronarin e restorantit ose adminin të modifikojë, të tjerët lexojnë.
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsRestaurantOwnerOrAdmin]

    def get_queryset(self):
        restaurant_pk = self.kwargs.get('restaurant_pk') # Supozon nested route
        if restaurant_pk:
            # Leja IsRestaurantOwnerOrAdmin te has_permission duhet të verifikojë pronësinë e restorantit
            return MenuCategory.objects.filter(restaurant_id=restaurant_pk).order_by('display_order', 'name')
        # Nëse nuk është nested route, admini mund të shohë të gjitha, ose filtro sipas restoranteve të userit
        elif self.request.user.is_staff:
            return MenuCategory.objects.all().order_by('restaurant__name', 'display_order')
        elif self.request.user.is_authenticated and self.request.user.role == User.Role.RESTAURANT_OWNER:
             return MenuCategory.objects.filter(restaurant__owner=self.request.user).order_by('restaurant__name', 'display_order')
        return MenuCategory.objects.none()

    def perform_create(self, serializer):
        restaurant_pk = self.kwargs.get('restaurant_pk')
        restaurant = get_object_or_404(Restaurant, pk=restaurant_pk)
        # Leja IsRestaurantOwnerOrAdmin te has_permission duhet ta ketë kontrolluar këtë tashmë
        serializer.save(restaurant=restaurant)

class MenuItemViewSet(viewsets.ModelViewSet):
    serializer_class = MenuItemSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly] # Default

    def get_queryset(self):
        restaurant_pk = self.kwargs.get('restaurant_pk')
        category_pk = self.kwargs.get('category_pk') # Opsionale, nëse do të filtrosh edhe sipas kategorisë

        if restaurant_pk:
            qs = MenuItem.objects.filter(restaurant_id=restaurant_pk)
            if category_pk:
                qs = qs.filter(category_id=category_pk)
            return qs.order_by('category__display_order', 'name')
        # Logjika për adminin ose pronarin nëse nuk është nested
        elif self.request.user.is_staff:
            return MenuItem.objects.all().order_by('restaurant__name', 'category__display_order')
        elif self.request.user.is_authenticated and self.request.user.role == User.Role.RESTAURANT_OWNER:
             return MenuItem.objects.filter(restaurant__owner=self.request.user).order_by('restaurant__name', 'category__display_order')
        return MenuItem.objects.none()

    def perform_create(self, serializer):
        restaurant_pk = self.kwargs.get('restaurant_pk')
        restaurant = get_object_or_404(Restaurant, pk=restaurant_pk)
        
        # Kategoria merret nga validated_data e serializerit
        category = serializer.validated_data.get('category')
        if category.restaurant != restaurant: # Sigurohu që kategoria i përket restorantit të duhur
            raise permissions.ValidationError("Kategoria e zgjedhur nuk i përket këtij restoranti.")
        
        serializer.save(restaurant=restaurant) # Serializeri tashmë e ka kategorinë
        
    def perform_update(self, serializer):
        restaurant = serializer.instance.restaurant # Merr restorantin nga instanca ekzistuese
        if 'category' in serializer.validated_data:
            new_category = serializer.validated_data.get('category')
            if new_category.restaurant != restaurant:
                 raise permissions.ValidationError("Kategoria e re nuk i përket këtij restoranti.")
        serializer.save()


# === VIEWSET PËR SHPORTËN ===
class CartViewSet(viewsets.GenericViewSet): # Përdorim GenericViewSet për më shumë kontroll
    serializer_class = CartSerializer
    permission_classes = [permissions.IsAuthenticated] # Vetëm përdoruesit e kyçur

    def get_cart_object(self, request):
        # Merr ose krijo shportën për përdoruesin e kyçur
        cart, created = Cart.objects.get_or_create(user=request.user)
        return cart

    @action(detail=False, methods=['get'], url_path='my-cart')
    def my_cart(self, request):
        """Kthen shportën aktuale të përdoruesit."""
        cart = self.get_cart_object(request)
        serializer = self.get_serializer(cart)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='add-item')
    def add_item(self, request):
        """Shton një artikull në shportë ose përditëson sasinë nëse ekziston."""
        cart = self.get_cart_object(request)
        menu_item_id = request.data.get('menu_item_id')
        quantity = int(request.data.get('quantity', 1))

        if not menu_item_id:
            return Response({"detail": "menu_item_id kërkohet."}, status=status.HTTP_400_BAD_REQUEST)
        if quantity <= 0:
            return Response({"detail": "Sasia duhet të jetë pozitive."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            menu_item = MenuItem.objects.get(id=menu_item_id, is_available=True)
        except MenuItem.DoesNotExist:
            return Response({"detail": "Artikulli i menusë nuk u gjet ose nuk është i disponueshëm."}, status=status.HTTP_404_NOT_FOUND)

        # Kontrollo nëse shporta është bosh ose nëse artikulli i ri është nga i njëjti restorant
        if cart.restaurant and cart.restaurant != menu_item.restaurant:
            return Response({
                "detail": "Nuk mund të shtoni artikuj nga restorante të ndryshme në të njëjtën shportë. Ju lutem pastroni shportën aktuale ose përfundoni porosinë para se të shtoni nga një restorant tjetër.",
                "current_cart_restaurant_id": cart.restaurant.id,
                "new_item_restaurant_id": menu_item.restaurant.id
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not cart.restaurant: # Nëse shporta ishte bosh, cakto restorantin
            cart.restaurant = menu_item.restaurant
            cart.save()

        cart_item, created = CartItem.objects.get_or_create(
            cart=cart, 
            menu_item=menu_item,
            defaults={'quantity': quantity}
        )

        if not created: # Nëse artikulli ekzistonte, shto sasinë
            cart_item.quantity += quantity
            cart_item.save()
        
        serializer = self.get_serializer(cart) # Kthe shportën e përditësuar
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['patch'], url_path='items/(?P<item_pk>[^/.]+)/update-quantity', serializer_class=CartItemSerializer) 
    def update_item_quantity(self, request, item_pk=None): 
        cart = self.get_cart_object(request)
        quantity_str = request.data.get('quantity')

        if quantity_str is None:
            return Response({"detail": "Sasia kërkohet."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            quantity = int(quantity_str)
            if quantity <= 0:
                raise ValueError("Sasia duhet të jetë pozitive.")
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            cart_item = CartItem.objects.get(id=item_pk, cart=cart)
        except CartItem.DoesNotExist:
            return Response({"detail": "Artikulli nuk u gjet në shportë."}, status=status.HTTP_404_NOT_FOUND)
        
        cart_item.quantity = quantity
        cart_item.save()
        
        cart_serializer = self.get_serializer(cart) # Kthe shportën e plotë
        return Response(cart_serializer.data)

    @action(detail=False, methods=['delete'], url_path='items/(?P<item_pk>[^/.]+)/remove') 
    def remove_item(self, request, item_pk=None):
        cart = self.get_cart_object(request)
        try:
            cart_item = CartItem.objects.get(id=item_pk, cart=cart)
            cart_item.delete()
            
            # Nëse shporta mbetet bosh pas fshirjes, hiq lidhjen me restorantin
            if not cart.items.exists():
                cart.restaurant = None
                cart.save()

        except CartItem.DoesNotExist:
            return Response({"detail": "Artikulli nuk u gjet në shportë."}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = self.get_serializer(cart) # Kthe shportën e plotë
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['delete'], url_path='clear')
    def clear_cart(self, request):
        """Fshin të gjithë artikujt nga shporta e përdoruesit."""
        cart = self.get_cart_object(request)
        cart.items.all().delete()
        cart.restaurant = None # Pastro restorantin
        cart.save()
        serializer = self.get_serializer(cart)
        return Response(serializer.data, status=status.HTTP_200_OK)

# === FUNDI I VIEWSET PËR SHPORTËN ===


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().select_related(
        'customer', 'restaurant', 'driver'
    ).prefetch_related(
        'items__menu_item' # Për të optimizuar query-n kur merren artikujt
    )

    def get_serializer_class(self):
        if self.action == 'list':
            return OrderListSerializer
        return OrderDetailSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Order.objects.none()

        if user.is_staff: # Admin sheh gjithçka
            # Mund të shtosh filtra nga query params këtu për adminin
            # p.sh., ?restaurant_id=X ose ?customer_id=Y
            restaurant_id_filter = self.request.query_params.get('restaurant_id')
            if restaurant_id_filter:
                return Order.objects.filter(restaurant_id=restaurant_id_filter).order_by('-created_at')
            return Order.objects.all().order_by('-created_at')
            
        elif user.role == User.Role.CUSTOMER:
            return Order.objects.filter(customer=user).order_by('-created_at')
            
        elif user.role == User.Role.RESTAURANT_OWNER:
            # Pronari sheh vetëm porositë për restorantet e tij
            # Nëse një pronar ka shumë restorante, mund të filtrosh sipas një ID specifike të restorantit
            # nga query params, por për fillim, le të shohë të gjitha të tijat.
            # Modifikoje këtë nëse RestaurantOwnerLayout në frontend dërgon gjithmonë ID-në e restorantit aktual.
            restaurant_id_filter = self.request.query_params.get('restaurant_id')
            if restaurant_id_filter:
                 # Sigurohu që pronari ka akses te ky restorant
                return Order.objects.filter(restaurant_id=restaurant_id_filter, restaurant__owner=user).order_by('-created_at')
            
            # Nëse nuk ka restaurant_id_filter, kthe porositë për të gjitha restorantet e pronarit
            return Order.objects.filter(restaurant__owner=user).order_by('-created_at')
            
        elif user.role == User.Role.DRIVER: # Ose User.Role.DELIVERY_PERSONNEL
            # Shoferi sheh porositë e tij aktive ose historikun (mund të filtrosh më tej)
            status_filter = self.request.query_params.get('status__in')
            if status_filter:
                statuses = status_filter.split(',')
                return Order.objects.filter(driver=user, status__in=statuses).order_by('-created_at')
            return Order.objects.filter(driver=user).order_by('-created_at')
            
        return Order.objects.none()

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.IsAuthenticated(), IsCustomer()]
        # Për `update_status_restaurant`, leja vendoset te vetë action-i.
        # Për `update_status_driver`, leja vendoset te vetë action-i.
        # Për `accept_delivery`, leja vendoset te vetë action-i.
        # Për `available_for_driver`, leja vendoset te vetë action-i.
        # Për `my_active_delivery`, leja vendoset te vetë action-i.
        if self.action == 'destroy': # Vetëm admini mund të fshijë porosi
            return [permissions.IsAdminUser()]
        
        # Për `list`, `retrieve` (metoda SAFE_METHODS)
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()] # get_queryset do të bëjë filtrimin e duhur bazuar në rol

        # Për `update`, `partial_update` standarde (që nuk janë actions specifike)
        # Këto duhet të jenë shumë të kufizuara. Zakonisht vetëm admini.
        # Serializer.update() ka gjithashtu logjikë për të limituar fushat.
        if self.action in ['update', 'partial_update']:
             return [permissions.IsAdminUser()] # Ose një leje më specifike nëse nevojitet
             
        return super().get_permissions() # Fallback te lejet default të ViewSet-it (IsAuthenticated)

    def perform_create(self, serializer):
        # Logjika e krijimit të porosisë është te OrderDetailSerializer.create
        # Ai tashmë e merr customer-in nga request.user dhe pastron shportën.
        # Restoranti dhe adresa e dërgesës vijnë nga payload-i.
        serializer.save() 


    @action(detail=True, methods=['patch'], url_path='update-status-restaurant', 
            permission_classes=[permissions.IsAuthenticated, IsRestaurantOwnerOrAdmin])
    def update_status_restaurant(self, request, pk=None):
        order = self.get_object() # get_object do të përdorë queryset-in e viewset-it dhe lejet e objektit

        # Sigurohu që useri që bën kërkesën është pronari i restorantit të kësaj porosie
        # IsRestaurantOwnerOrAdmin e bën këtë te has_object_permission
        # self.check_object_permissions(request, order) # Thërret has_object_permission eksplicitikisht

        new_status = request.data.get('status')
        
        # Statuset që restoranti mund t'i vendosë
        allowed_statuses_for_restaurant = [
            Order.OrderStatus.CONFIRMED, 
            Order.OrderStatus.PREPARING, 
            Order.OrderStatus.READY_FOR_PICKUP, 
            Order.OrderStatus.CANCELLED_BY_RESTAURANT
        ]

        # Logjika e tranzicionit të statusit (shembull bazik)
        # Mund ta bësh më të sofistikuar me një state machine
        current_status = order.status
        valid_transition = False

        if current_status == Order.OrderStatus.PENDING and new_status in [Order.OrderStatus.CONFIRMED, Order.OrderStatus.CANCELLED_BY_RESTAURANT]:
            valid_transition = True
        elif current_status == Order.OrderStatus.CONFIRMED and new_status in [Order.OrderStatus.PREPARING, Order.OrderStatus.CANCELLED_BY_RESTAURANT]:
            valid_transition = True
        elif current_status == Order.OrderStatus.PREPARING and new_status == Order.OrderStatus.READY_FOR_PICKUP:
            valid_transition = True
        # Lejo anulimin nga restoranti në disa faza të hershme
        elif current_status in [Order.OrderStatus.PENDING, Order.OrderStatus.CONFIRMED, Order.OrderStatus.PREPARING] and new_status == Order.OrderStatus.CANCELLED_BY_RESTAURANT:
             valid_transition = True
        
        # Mos lejo ndryshimin nëse porosia është marrë nga shoferi ose është finale
        if current_status in [Order.OrderStatus.ON_THE_WAY, Order.OrderStatus.DELIVERED, Order.OrderStatus.FAILED_DELIVERY, Order.OrderStatus.CANCELLED_BY_USER]:
            return Response({"detail": f"Statusi i porosisë nuk mund të ndryshohet nga restoranti pasi është '{order.get_status_display()}'."}, 
                            status=status.HTTP_400_BAD_REQUEST)


        if not valid_transition and new_status in allowed_statuses_for_restaurant:
            # Nëse statusi i ri është i lejuar për restorantin, por nuk është tranzicion valid nga statusi aktual
            # kthe një gabim më specifik
             return Response({"detail": f"Nuk mund të kalohet nga statusi '{current_status}' direkt në '{new_status}' nga restoranti."}, status=status.HTTP_400_BAD_REQUEST)
        elif new_status not in allowed_statuses_for_restaurant:
            return Response({"detail": f"Statusi '{new_status}' nuk është valid ose nuk lejohet të vendoset nga restoranti."}, status=status.HTTP_400_BAD_REQUEST)
        
        order.status = new_status
        # Thirr metodën save të modelit Order për të përditësuar kohët e statusit
        order.save() 
        
        # KËTU MUND TË SHTOSH DËRGIMIN E NJË SINJALI OSE NJË TASKU CELERY PËR TË NJOFGUAR KLIENTIN/SHOFERIN
        
        return Response(OrderDetailSerializer(order, context={'request': request}).data)

    @action(detail=True, methods=['patch'], url_path='accept-delivery', permission_classes=[permissions.IsAuthenticated, IsDriverPermission])
    def accept_delivery(self, request, pk=None):
        """
        Lejon një shofer të pranojë një porosi që është 'READY_FOR_PICKUP' dhe nuk ka shofer.
        Shoferi nuk duhet të ketë një dërgesë tjetër aktive.
        Statusi i porosisë ndryshohet në 'CONFIRMED'.
        """
        order = get_object_or_404(Order, pk=pk)
        user = request.user # Ky është shoferi potencial
        
        # if not user.is_available_for_delivery: # Kjo duhet të jetë pjesë e logjikës së shoferit, jo kusht për pranim
        #     return Response({"detail": "Duhet të jeni online për të pranuar dërgesa."}, status=status.HTTP_400_BAD_REQUEST)
            
        if order.driver is not None: 
            return Response({"detail": "Kjo porosi tashmë ka një shofer të caktuar."}, status=status.HTTP_400_BAD_REQUEST)
        
        if order.status != Order.OrderStatus.READY_FOR_PICKUP: 
            return Response({"detail": "Kjo porosi nuk është gati për dërgesë."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Kontrollo nëse shoferi ka tashmë një dërgesë aktive
        active_statuses_for_driver = [Order.OrderStatus.CONFIRMED, Order.OrderStatus.ON_THE_WAY]
        if Order.objects.filter(driver=user, status__in=active_statuses_for_driver).exists():
            return Response({"detail": "Ju tashmë keni një dërgesë aktive."}, status=status.HTTP_400_BAD_REQUEST)
            
        order.driver = user
        order.status = Order.OrderStatus.CONFIRMED # Kur shoferi pranon, statusi bëhet 'CONFIRMED' nga shoferi
        order.save()

        # Invalido cache
        cache_utils.invalidate_cache_for_user_orders(order.customer)
        if order.restaurant and order.restaurant.owner:
            cache_utils.invalidate_cache_for_user_orders(order.restaurant.owner)
        cache_utils.invalidate_cache_for_user_orders(request.user) # Shoferi

        return Response(OrderDetailSerializer(order, context={'request': request}).data)

    @action(detail=True, methods=['patch'], url_path='update-status/driver', permission_classes=[permissions.IsAuthenticated, IsDriverOfOrderPermission])
    def update_status_driver(self, request, pk=None):
        """
        Lejon shoferin e caktuar të përditësojë statusin e një porosie.
        Tranzicionet e lejuara:
        - Nga CONFIRMED -> ON_THE_WAY
        - Nga ON_THE_WAY -> DELIVERED ose FAILED_DELIVERY
        """
        order = self.get_object() 
        new_status = request.data.get('status')
        
        allowed_statuses_by_driver = [Order.OrderStatus.ON_THE_WAY, Order.OrderStatus.DELIVERED, Order.OrderStatus.FAILED_DELIVERY]
        
        if new_status not in allowed_statuses_by_driver: 
            return Response({"detail": f"Status invalid. Statuset e lejuara nga shoferi janë: {', '.join(allowed_statuses_by_driver)}"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Logjikë për tranzicionet e statusit
        if order.status == Order.OrderStatus.CONFIRMED and new_status != Order.OrderStatus.ON_THE_WAY:
            return Response({"detail": "Nga statusi 'CONFIRMED', hapi tjetër i lejuar është 'ON_THE_WAY'."}, status=status.HTTP_400_BAD_REQUEST)
        
        if order.status == Order.OrderStatus.ON_THE_WAY and new_status not in [Order.OrderStatus.DELIVERED, Order.OrderStatus.FAILED_DELIVERY]:
            return Response({"detail": "Nga statusi 'ON_THE_WAY', hapat e tjerë të lejuar janë 'DELIVERED' ose 'FAILED_DELIVERY'."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Parandalo ndryshimin e statusit nëse porosia tashmë është në një status final (p.sh., DELIVERED, CANCELLED)
        if order.status in [Order.OrderStatus.DELIVERED, Order.OrderStatus.CANCELLED_BY_CUSTOMER, Order.OrderStatus.CANCELLED_BY_RESTAURANT, Order.OrderStatus.FAILED_DELIVERY]:
             return Response({"detail": f"Porosia tashmë është në statusin '{order.get_status_display()}' dhe nuk mund të ndryshohet më tej nga shoferi."}, status=status.HTTP_400_BAD_REQUEST)

        order.status = new_status
        if new_status == Order.OrderStatus.DELIVERED:
            order.actual_delivery_time = timezone.now()
            if order.payment_method == Order.PaymentMethod.CASH_ON_DELIVERY:
                order.payment_status = Order.PaymentStatus.PAID
        order.save()

        # Invalido cache
        cache_utils.invalidate_cache_for_user_orders(order.customer)
        if order.restaurant and order.restaurant.owner:
            cache_utils.invalidate_cache_for_user_orders(order.restaurant.owner)
        cache_utils.invalidate_cache_for_user_orders(request.user) # Shoferi

        return Response(OrderDetailSerializer(order, context={'request': request}).data)
    
    @action(detail=False, methods=['get'], url_path='my-active-delivery', permission_classes=[permissions.IsAuthenticated, IsDriverPermission])
    def my_active_delivery(self, request):
        """
        Kthen porosinë aktive aktuale për shoferin e kyçur.
        Një porosi konsiderohet aktive për shoferin nëse statusi është CONFIRMED, ON_THE_WAY, ose PREPARING.
        """
        user = request.user
        active_statuses = [Order.OrderStatus.CONFIRMED, Order.OrderStatus.ON_THE_WAY, Order.OrderStatus.PREPARING] # Shoferi mund ta shohë edhe kur është PREPARING
        active_order = Order.objects.filter(driver=user, status__in=active_statuses).first()
        if active_order:
            serializer = OrderDetailSerializer(active_order, context={'request': request})
            return Response(serializer.data)
        return Response(None, status=status.HTTP_200_OK) 

class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    # permission_classes = [permissions.IsAuthenticatedOrReadOnly] # Default

    def get_queryset(self):
        # Kthe vlerësimet vetëm për restorantin e specifikuar në URL
        restaurant_pk = self.kwargs.get('restaurant_pk')
        if restaurant_pk:
            return Review.objects.filter(restaurant_id=restaurant_pk)
        return Review.objects.none() # Ose hidh një gabim nëse nuk pritet të aksesohet pa restaurant_pk

    def get_permissions(self):
        if self.action == 'create':
            # Vetëm përdoruesit e kyçur (dhe idealisht klientë që kanë porositur) mund të krijojnë
            # Për fillim, vetëm IsAuthenticated. Mund të shtosh IsCustomer.
            self.permission_classes = [permissions.IsAuthenticated] 
        elif self.action in ['update', 'partial_update', 'destroy']:
            self.permission_classes = [IsAuthorOrAdminOrReadOnly]
        else: # list, retrieve
            self.permission_classes = [permissions.AllowAny] # Ose IsAuthenticatedOrReadOnly
        return super().get_permissions()

    def perform_create(self, serializer):
        restaurant_pk = self.kwargs.get('restaurant_pk')
        restaurant = get_object_or_404(Restaurant, pk=restaurant_pk)
        
        # Kontrolli nëse përdoruesi tashmë ka lënë vlerësim bëhet te serializeri
        # ose nga unique_together në model.

        # Këtu mund të shtosh logjikën për të kontrolluar nëse përdoruesi ka porositur nga ky restorant
        # if not Order.objects.filter(customer=self.request.user, restaurant=restaurant, status=Order.Status.DELIVERED).exists():
        #     raise permissions.PermissionDenied("Ju mund të vlerësoni vetëm restorantet nga të cilat keni porositur.")

        serializer.save(user=self.request.user, restaurant=restaurant)

    def perform_update(self, serializer):
        # Sigurohu që useri nuk po ndryshon restorantin ose përdoruesin e review-së
        # Kjo zakonisht bëhet duke i bërë ato fusha read_only në serializer për update
        # ose duke i hequr nga validated_data para se të thirret super().perform_update()
        review = serializer.instance
        serializer.save(user=self.request.user) # Ruaj vetëm fushat e lejuara
        # Invalido cache për listën e restoranteve pasi mund të ndryshojë average_rating
        cache_utils.invalidate_restaurant_list_cache()
        cache_utils.invalidate_restaurant_detail_cache(review.restaurant.id)
    
    def perform_destroy(self, instance):
        restaurant_pk = instance.restaurant.id
        instance.delete()
        # Invalido cache për listën e restoranteve pasi mund të ndryshojë average_rating
        cache_utils.invalidate_restaurant_list_cache()
        cache_utils.invalidate_restaurant_detail_cache(restaurant_pk)


class ReviewReplyViewSet(viewsets.ModelViewSet):
    """
    Menaxhimi i Përgjigjeve të Vlerësimeve.
    - Adminët dhe autorët e përgjigjeve mund t'i menaxhojnë ato.
    - Të gjithë mund t'i lexojnë përgjigjet.
    """
    serializer_class = ReviewReplySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        # Kthe përgjigjet vetëm për vlerësimin e specifikuar në URL
        review_pk = self.kwargs.get('review_pk')
        if review_pk:
            return ReviewReply.objects.filter(review_id=review_pk)
        return ReviewReply.objects.none() # Ose hidh një gabim nëse nuk pritet të aksesohet pa review_pk

    def perform_create(self, serializer):
        review_pk = self.kwargs.get('review_pk')
        review = get_object_or_404(Review, pk=review_pk)
        serializer.save(user=self.request.user, review=review)

    def perform_update(self, serializer):
        # Sigurohu që përdoruesi nuk ndryshon vlerësimin ose përdoruesin e përgjigjes
        serializer.save(user=self.request.user) # Autori mbetet i njëjti

    # Nuk ka nevojë për perform_destroy të personalizuar zakonisht


class DriverProfileViewSet(viewsets.ModelViewSet):
    queryset = DriverProfile.objects.select_related('user').all()
    serializer_class = DriverProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsDriverProfileOwnerOrAdmin] # Rregullo sipas nevojës

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return DriverProfile.objects.all()
        if user.role == User.Role.DRIVER:
            return DriverProfile.objects.filter(user=user)
        return DriverProfile.objects.none()

    def perform_create(self, serializer):
        # Sigurohemi që useri i dhënë në payload (nëse lejohet) është i njëjti me userin e kyçur,
        # përveç nëse është admin.
        # Ose, më mirë, cakto userin automatikisht bazuar te request.user nëse nuk është admin.
        user_to_assign = serializer.validated_data.get('user')
        
        if not self.request.user.is_staff and user_to_assign != self.request.user:
            raise permissions.PermissionDenied("Ju mund të krijoni profil vetëm për veten tuaj.")

        if user_to_assign.role != User.Role.DRIVER:
             raise serializers.ValidationError({"user": "Përdoruesi i zgjedhur duhet të ketë rolin 'DRIVER'."})
        
        # Kontrolli për ekzistencën e profilit bëhet nga OneToOneField ose nga validimi i serializerit.
        serializer.save() # user është pjesë e validated_data nga serializeri

    def perform_update(self, serializer):
        # Useri nuk duhet të ndryshohet gjatë update.
        # Kjo sigurohet nga fakti që 'user' është primary_key dhe read_only pas krijimit,
        # ose nga logjika e lejeve.
        serializer.save()

