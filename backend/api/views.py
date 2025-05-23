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
from rest_framework.views import APIView # Sigurohu që është importuar
from rest_framework_simplejwt.tokens import RefreshToken, TokenError # Sigurohu që janë importuar


from .models import (
    User, Address, CuisineType, Restaurant, OperatingHours, 
    MenuCategory, MenuItem, Order, OrderItem, Review, DriverProfile, # Shto DriverProfile
    ReviewReply, PageViewLog # Shto ReviewReply dhe PageViewLog
)
from .serializers import (
    UserDetailSerializer, UserRegistrationSerializer, AddressSerializer,
    CuisineTypeSerializer, RestaurantListSerializer, RestaurantDetailSerializer,
    OperatingHoursSerializer, MenuCategorySerializer, MenuItemSerializer,
    CustomTokenObtainPairSerializer,
    OrderListSerializer, OrderDetailSerializer, OrderItemSerializer,
    ReviewSerializer, DriverProfileSerializer, ReviewReplySerializer # Shto DriverProfileSerializer dhe ReviewReplySerializer
)
from .permissions import (
    IsOwnerOrAdmin, 
    IsRestaurantOwnerOrAdmin, 
    IsCustomer,
    IsAuthorOrAdminOrReadOnly, 
    IsDriverProfileOwnerOrAdmin,
    IsAdminOrReadOnly, 
    IsOwnerOrAdminOrReadOnly,
    IsDriverPermission, # SHTO KËTË IMPORT
    IsDriverOfOrderPermission # Shto edhe këtë nëse përdoret diku tjetër
)
from django.db.models import Count, Sum # Sigurohu që Sum është importuar


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
    """
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserDetailSerializer 
    permission_classes = [permissions.IsAdminUser]

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
    queryset = Restaurant.objects.all() 

    def get_serializer_class(self):
        if self.action == 'list':
            return RestaurantListSerializer
        return RestaurantDetailSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            if user.is_staff: # Admini sheh gjithçka
                return Restaurant.objects.all().order_by('-is_approved', '-created_at')
            if user.role == User.Role.RESTAURANT_OWNER:
                # Pronari sheh restorantet e veta
                return Restaurant.objects.filter(owner=user).order_by('-created_at')
        # Përdoruesit e tjerë (klientë, anonimë) shohin vetëm aktivët dhe të aprovuarit
        return Restaurant.objects.filter(is_active=True, is_approved=True).order_by('name')

    def get_permissions(self):
        if self.action == 'list' or self.action == 'retrieve' or \
           self.action == 'menu_items_for_restaurant' or \
           self.action == 'menu_categories_for_restaurant':
            # Këto veprime janë publike për të gjithë
            return [permissions.AllowAny()]
        
        if self.action == 'create':
            # Për të krijuar një restorant, duhet të jesh i kyçur dhe të kesh rolin e duhur
            # ose të jesh admin.
            # Leja IsRestaurantOwnerOrAdmin do të kontrollojë rolin më tej nëse është IsAuthenticated.
            # IsAdminUser është më specifik.
            if self.request.user and self.request.user.is_authenticated:
                if self.request.user.role == User.Role.RESTAURANT_OWNER or self.request.user.is_staff:
                    # IsRestaurantOwnerOrAdmin do të lejojë pronarin ose adminin.
                    # IsAuthenticated është mjaftueshëm këtu pasi IsRestaurantOwnerOrAdmin do të thirret më pas.
                    return [permissions.IsAuthenticated(), IsRestaurantOwnerOrAdmin()] 
            return [permissions.IsAdminUser()] # Nëse nuk plotësohen kushtet e mësipërme, vetëm admini
            
        if self.action == 'approve_restaurant':
            # Vetëm adminët mund të aprovojnë
            return [permissions.IsAdminUser()]
        
        # Për veprimet e tjera si update, partial_update, destroy, toggle_active_status, etj.
        # Kërkohet që përdoruesi të jetë i kyçur DHE të jetë pronari i restorantit ose admin.
        return [permissions.IsAuthenticated(), IsRestaurantOwnerOrAdmin()]

    # @method_decorator(cache_page(60 * 15)) # Hiq këtë
    def list(self, request, *args, **kwargs):
        user = request.user
        # Cache vetëm për pamjet publike (përdorues të paautorizuar ose klientë)
        # Adminët dhe pronarët e restoranteve do të marrin gjithmonë të dhëna të freskëta për listat e tyre specifike.
        
        is_public_view_eligible_for_cache = not user.is_authenticated or user.role == User.Role.CUSTOMER

        cache_key = None
        if is_public_view_eligible_for_cache: # TANI KJO VARIABËL EKZISTON
            cache_key = cache_utils.get_restaurants_list_public_cache_key(request)
            cached_response_data = cache.get(cache_key)
            if cached_response_data:
                print(f"Cache HIT for Restaurants (public): {cache_key}")
                return Response(cached_response_data)
            print(f"Cache MISS for Restaurants (public): {cache_key}")

        queryset = self.filter_queryset(self.get_queryset())

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            response = self.get_paginated_response(serializer.data)
            if is_public_view_eligible_for_cache and cache_key:
                cache.set(cache_key, response.data, 60 * 15) # Cache përgjigjen e paginuar
            return response

        # Rasti kur nuk ka paginim (ose paginatori nuk është konfiguruar)
        serializer = self.get_serializer(queryset, many=True)
        response_data = serializer.data
        if is_public_view_eligible_for_cache: # Për këtë rast, duhet një çelës tjetër
            all_items_cache_key = cache_utils.get_restaurants_list_public_all_items_cache_key()
            # Kontrollo cache-in përsëri me çelësin e duhur
            cached_all_items = cache.get(all_items_cache_key)
            if cached_all_items:
                print(f"Cache HIT for Restaurants (public, all items): {all_items_cache_key}")
                return Response(cached_all_items)
            
            print(f"Cache MISS for Restaurants (public, all items): {all_items_cache_key}")
            cache.set(all_items_cache_key, response_data, 60 * 15)
        return Response(response_data)

    def perform_create(self, serializer):
        if not self.request.user.is_staff and self.request.user.role == User.Role.RESTAURANT_OWNER:
            serializer.save(owner=self.request.user, is_approved=False, is_active=False)
        elif self.request.user.is_staff:
            # Admini mund të caktojë owner_id nga payload-i
            # Serializeri jonë tashmë e ka 'owner_id' si source='owner', write_only=True
            serializer.save() 
        else:
            # Kjo nuk duhet të ndodhë nëse get_permissions është e saktë
            raise permissions.PermissionDenied("Nuk keni leje të krijoni restorant.")

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
        Vendos `is_approved = True` dhe `is_active = True`.
        """
        restaurant = self.get_object() 
        restaurant.is_approved = True
        restaurant.is_active = True 
        restaurant.save()
        serializer = self.get_serializer(restaurant) # Përdor serializerin e viewset-it (RestaurantDetailSerializer)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    @action(detail=True, methods=['patch'], url_path='toggle-active', permission_classes=[IsRestaurantOwnerOrAdmin])
    def toggle_active_status(self, request, pk=None):
        """
        Ndryshon statusin aktiv/joaktiv të një restoranti.
        Vetëm për pronarin e restorantit ose adminin.
        Restoranti duhet të jetë i aprovuar për t'u bërë aktiv.
        Mund të dërgohet `{"is_active": true/false}` në payload, ose do bëjë toggle.
        """
        restaurant = self.get_object() 

        new_active_status = request.data.get('is_active')
        if new_active_status is None: # Nëse nuk jepet, bëj toggle
            new_active_status = not restaurant.is_active
        
        if not restaurant.is_approved and new_active_status == True:
            return Response({"detail": "Restoranti duhet të aprovohet nga administratori para se të mund të aktivizohet."}, status=status.HTTP_400_BAD_REQUEST)

        restaurant.is_active = new_active_status
        restaurant.save()
        serializer = self.get_serializer(restaurant)
        return Response(serializer.data, status=status.HTTP_200_OK)


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
    """
    Menaxhimi i Artikujve të Menusë për një restorant specifik (nested).
    Mund të jetë nested edhe nën një kategori menuje.
    Lejon pronarët e restoranteve dhe adminët të menaxhojnë artikujt.
    Të tjerët mund t'i lexojnë.
    """
    serializer_class = MenuItemSerializer
    # Lejo pronarin e restorantit ose adminin të modifikojë, të tjerët lexojnë.
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsRestaurantOwnerOrAdmin]

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




class OrderViewSet(viewsets.ModelViewSet):
    """
    Menaxhimi i Porosive.
    - Klientët mund të krijojnë dhe shohin porositë e tyre.
    - Pronarët e restoranteve mund të shohin dhe menaxhojnë statusin e porosive për restorantet e tyre.
    - Shoferët mund të shohin porositë e disponueshme, të pranojnë dërgesa dhe të përditësojnë statusin e dërgesave të tyre.
    - Adminët kanë akses të plotë.
    """
    queryset = Order.objects.all().select_related('customer', 'restaurant', 'driver')

    def get_serializer_class(self):
        if self.action == 'list':
            return OrderListSerializer
        return OrderDetailSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Order.objects.none()

        if user.is_staff:
            return Order.objects.all().order_by('-created_at')
        elif user.role == User.Role.CUSTOMER:
            return Order.objects.filter(customer=user).order_by('-created_at')
        elif user.role == User.Role.RESTAURANT_OWNER:
            # Supozojmë se `owned_restaurants` është një related_name ose një fushë ManyToMany
            # Për një ForeignKey nga Restaurant te User (owner), bëj:
            return Order.objects.filter(restaurant__owner=user).order_by('-created_at')
        elif user.role == User.Role.DRIVER:
            return Order.objects.filter(driver=user).order_by('-created_at')
        return Order.objects.none()

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.IsAuthenticated(), IsCustomer()] 
        if self.action in ['update_status_restaurant', 'update_status_driver', 'accept_delivery', 'available_for_driver', 'my_active_delivery']:
            # Lejet specifike për këto veprime janë të definuara direkt te @action decorator.
            # Kjo degë mund të hiqet ose të lihet si fallback nëse @action nuk ka permission_classes.
            # Por praktika më e mirë është që @action të ketë gjithmonë permission_classes.
            # Për siguri, kthejmë lejet default të @action nëse ka, ose një leje bazë.
            # ViewSet do të përdorë permission_classes të @action nëse janë specifikuar.
            return super().get_permissions() # Kthen permission_classes të ViewSet-it ose të @action
        if self.action == 'destroy':
            return [permissions.IsAdminUser()]
        
        # Për retrieve, list (GET)
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()] # get_queryset do të bëjë filtrimin e duhur

        # Për update, partial_update (PUT, PATCH) standarde (jo ato të mbuluara nga @action)
        # Këto duhet të jenë të kufizuara. P.sh., vetëm admini, ose lejo IsAuthenticated
        # dhe lëre logjikën e serializer.update() të bëjë kontrollet e fushave.
        # Duke pasur parasysh logjikën ekzistuese te OrderDetailSerializer.update,
        # lejimi i IsAuthenticated këtu është i pranueshëm.
        return [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(customer=self.request.user)

    @action(detail=True, methods=['patch'], url_path='update-status-restaurant', permission_classes=[permissions.IsAuthenticated, IsRestaurantOwnerOrAdmin])
    def update_status_restaurant(self, request, pk=None):
        """
        Përditëson statusin e një porosie nga ana e restorantit.
        Statuset e lejuara: CONFIRMED, PREPARING, READY_FOR_PICKUP, CANCELLED_BY_RESTAURANT.
        """
        order = self.get_object() 
        
        new_status = request.data.get('status')
        allowed_statuses = [Order.OrderStatus.CONFIRMED, Order.OrderStatus.PREPARING, Order.OrderStatus.READY_FOR_PICKUP, Order.OrderStatus.CANCELLED_BY_RESTAURANT]
        if new_status not in allowed_statuses:
            return Response({"detail": f"Status invalid. Të lejuara: {', '.join(allowed_statuses)}"}, status=status.HTTP_400_BAD_REQUEST)
        
        order.status = new_status
        order.save()
        return Response(OrderDetailSerializer(order, context={'request': request}).data)

    @action(detail=False, methods=['get'], url_path='available-for-driver', permission_classes=[permissions.IsAuthenticated, IsDriverPermission])
    def available_for_driver(self, request):
        """
        Liston të gjitha porositë që janë gati për marrje ('READY_FOR_PICKUP') dhe nuk kanë ende një shofer të caktuar.
        Vetëm për shoferët e kyçur.
        """
        user = request.user
        # if not user.is_available_for_delivery: # Kjo logjikë mund të jetë më mirë brenda shërbimit/modelit
        #     return Response([], status=status.HTTP_200_OK)
        available_orders = Order.objects.filter(status=Order.OrderStatus.READY_FOR_PICKUP, driver__isnull=True).order_by('created_at')
        serializer = OrderListSerializer(available_orders, many=True, context={'request': request})
        return Response(serializer.data)

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
        
        # Mund të dërgosh një notifikim këtu
        serializer = OrderDetailSerializer(order, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['patch'], url_path='update-status-driver', permission_classes=[permissions.IsAuthenticated, IsDriverOfOrderPermission])
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
        
        # Mund të dërgosh notifikime këtu
        return Response(OrderDetailSerializer(order, context={'request': request}).data)


class ReviewViewSet(viewsets.ModelViewSet):
    """
    Menaxhimi i Vlerësimeve për restorantet (nested).
    - Përdoruesit e kyçur mund të krijojnë vlerësime.
    - Autori i vlerësimit ose admini mund ta modifikojë/fshijë atë.
    - Të gjithë mund t'i lexojnë vlerësimet.
    """
    serializer_class = ReviewSerializer
    # permission_classes = [permissions.IsAuthenticatedOrReadOnly] # Do e specifikojmë më poshtë

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
        # Sigurohemi që restoranti nuk ndryshohet gjatë përditësimit
        serializer.save(user=self.request.user) # Autori mbetet i njëjti

    # Nuk ka nevojë për perform_destroy të personalizuar zakonisht


class DriverProfileViewSet(viewsets.ModelViewSet):
    """
    Menaxhimi i Profileve të Shoferëve.
    - Shoferët mund të shohin dhe modifikojnë profilin e tyre.
    - Adminët mund të menaxhojnë të gjitha profilet e shoferëve.
    """
    queryset = DriverProfile.objects.all()
    serializer_class = DriverProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsDriverProfileOwnerOrAdmin]

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


class OrderViewSet(viewsets.ModelViewSet):
    """
    Menaxhimi i Porosive.
    - Klientët mund të krijojnë dhe shohin porositë e tyre.
    - Pronarët e restoranteve mund të shohin dhe menaxhojnë statusin e porosive për restorantet e tyre.
    - Shoferët mund të shohin porositë e disponueshme, të pranojnë dërgesa dhe të përditësojnë statusin e dërgesave të tyre.
    - Adminët kanë akses të plotë.
    """
    queryset = Order.objects.all().select_related('customer', 'restaurant', 'driver')

    def get_serializer_class(self):
        if self.action == 'list':
            return OrderListSerializer
        return OrderDetailSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Order.objects.none()

        if user.is_staff:
            return Order.objects.all().order_by('-created_at')
        elif user.role == User.Role.CUSTOMER:
            return Order.objects.filter(customer=user).order_by('-created_at')
        elif user.role == User.Role.RESTAURANT_OWNER:
            # Supozojmë se `owned_restaurants` është një related_name ose një fushë ManyToMany
            # Për një ForeignKey nga Restaurant te User (owner), bëj:
            return Order.objects.filter(restaurant__owner=user).order_by('-created_at')
        elif user.role == User.Role.DRIVER:
            return Order.objects.filter(driver=user).order_by('-created_at')
        return Order.objects.none()

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.IsAuthenticated(), IsCustomer()] 
        if self.action in ['update_status_restaurant', 'update_status_driver', 'accept_delivery', 'available_for_driver', 'my_active_delivery']:
            # Lejet specifike për këto veprime janë të definuara direkt te @action decorator.
            # Kjo degë mund të hiqet ose të lihet si fallback nëse @action nuk ka permission_classes.
            # Por praktika më e mirë është që @action të ketë gjithmonë permission_classes.
            # Për siguri, kthejmë lejet default të @action nëse ka, ose një leje bazë.
            # ViewSet do të përdorë permission_classes të @action nëse janë specifikuar.
            return super().get_permissions() # Kthen permission_classes të ViewSet-it ose të @action
        if self.action == 'destroy':
            return [permissions.IsAdminUser()]
        
        # Për retrieve, list (GET)
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()] # get_queryset do të bëjë filtrimin e duhur

        # Për update, partial_update (PUT, PATCH) standarde (jo ato të mbuluara nga @action)
        # Këto duhet të jenë të kufizuara. P.sh., vetëm admini, ose lejo IsAuthenticated
        # dhe lëre logjikën e serializer.update() të bëjë kontrollet e fushave.
        # Duke pasur parasysh logjikën ekzistuese te OrderDetailSerializer.update,
        # lejimi i IsAuthenticated këtu është i pranueshëm.
        return [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(customer=self.request.user)

    @action(detail=True, methods=['patch'], url_path='update-status-restaurant', permission_classes=[permissions.IsAuthenticated, IsRestaurantOwnerOrAdmin])
    def update_status_restaurant(self, request, pk=None):
        """
        Përditëson statusin e një porosie nga ana e restorantit.
        Statuset e lejuara: CONFIRMED, PREPARING, READY_FOR_PICKUP, CANCELLED_BY_RESTAURANT.
        """
        order = self.get_object() 
        
        new_status = request.data.get('status')
        allowed_statuses = [Order.OrderStatus.CONFIRMED, Order.OrderStatus.PREPARING, Order.OrderStatus.READY_FOR_PICKUP, Order.OrderStatus.CANCELLED_BY_RESTAURANT]
        if new_status not in allowed_statuses:
            return Response({"detail": f"Status invalid. Të lejuara: {', '.join(allowed_statuses)}"}, status=status.HTTP_400_BAD_REQUEST)
        
        order.status = new_status
        order.save()
        return Response(OrderDetailSerializer(order, context={'request': request}).data)

    @action(detail=False, methods=['get'], url_path='available-for-driver', permission_classes=[permissions.IsAuthenticated, IsDriverPermission])
    def available_for_driver(self, request):
        """
        Liston të gjitha porositë që janë gati për marrje ('READY_FOR_PICKUP') dhe nuk kanë ende një shofer të caktuar.
        Vetëm për shoferët e kyçur.
        """
        user = request.user
        # if not user.is_available_for_delivery: # Kjo logjikë mund të jetë më mirë brenda shërbimit/modelit
        #     return Response([], status=status.HTTP_200_OK)
        available_orders = Order.objects.filter(status=Order.OrderStatus.READY_FOR_PICKUP, driver__isnull=True).order_by('created_at')
        serializer = OrderListSerializer(available_orders, many=True, context={'request': request})
        return Response(serializer.data)

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
        
        # Mund të dërgosh një notifikim këtu
        serializer = OrderDetailSerializer(order, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['patch'], url_path='update-status-driver', permission_classes=[permissions.IsAuthenticated, IsDriverOfOrderPermission])
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
        
        # Mund të dërgosh notifikime këtu
        return Response(OrderDetailSerializer(order, context={'request': request}).data)

