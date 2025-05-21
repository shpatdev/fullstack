from rest_framework import viewsets
from .models import *
from .serializers import *
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.exceptions import ValidationError, PermissionDenied
from .models import CustomerProfile, DriverProfile
from .serializers import CustomerProfileSerializer, DriverProfileSerializer
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.core.cache import cache
from django.conf import settings
from rest_framework.response import Response
import decimal



class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def perform_create(self, serializer):
        user = serializer.save()
        password = self.request.data.get('password')
        if password:
            user.set_password(password)
            user.save()


class RestaurantViewSet(viewsets.ModelViewSet):
    queryset = Restaurant.objects.all()
    serializer_class = RestaurantSerializer
    # permission_classes will be set by get_permissions

    CACHE_KEY_PREFIX = "restaurants_list"
    CACHE_TIMEOUT = settings.CACHES['default'].get('TIMEOUT', 300) # Get default timeout

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            # Lets allow anyone to list/retrieve for now for simplicity with caching
            
            permission_classes = [AllowAny]
        else: # create, update, partial_update, destroy
            permission_classes = [IsAdminUser]
        return [permission() for permission in permission_classes]

    def list(self, request, *args, **kwargs):
        """
        List all restaurants. Tries to fetch from cache first.
        """
        cached_restaurants = cache.get(self.CACHE_KEY_PREFIX)

        if cached_restaurants is not None:
            print("--- Serving restaurants from CACHE ---") # For debugging
            return Response(cached_restaurants)
        
        print("--- Serving restaurants from DB ---") # For debugging
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            # Cache the paginated response data
            cache.set(self.CACHE_KEY_PREFIX, serializer.data, self.CACHE_TIMEOUT)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        # Cache the serialized data
        cache.set(self.CACHE_KEY_PREFIX, serializer.data, self.CACHE_TIMEOUT)
        return Response(serializer.data)

    def perform_create(self, serializer):
        super().perform_create(serializer)
        cache.delete(self.CACHE_KEY_PREFIX) # Invalidate cache on create
        print("--- Restaurant cache invalidated (create) ---")

    def perform_update(self, serializer):
        super().perform_update(serializer)
        cache.delete(self.CACHE_KEY_PREFIX) # Invalidate cache on update
        
        print("--- Restaurant cache invalidated (update) ---")

    def perform_destroy(self, instance):
        
        super().perform_destroy(instance)
        cache.delete(self.CACHE_KEY_PREFIX) # Invalidate cache on delete
        print("--- Restaurant cache invalidated (destroy) ---")
        

class OpeningHourViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = OpeningHour.objects.all()
    serializer_class = OpeningHourSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['restaurant', 'day_of_week']
    permission_classes = [AllowAny]


class RestaurantCategoryViewSet(viewsets.ModelViewSet):
    queryset = RestaurantCategory.objects.all()
    serializer_class = RestaurantCategorySerializer


class MenuViewSet(viewsets.ModelViewSet):
    queryset = Menu.objects.all()
    serializer_class = MenuSerializer


class MenuItemViewSet(viewsets.ModelViewSet):
    queryset = MenuItem.objects.all()
    serializer_class = MenuItemSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticated]
        else: # create, update, partial_update, destroy
            permission_classes = [IsAdminUser] 
        return [permission() for permission in permission_classes]


class MenuCategoryViewSet(viewsets.ModelViewSet):
    queryset = MenuCategory.objects.all()
    serializer_class = MenuCategorySerializer


class CustomerProfileViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = CustomerProfileSerializer
    
    def perform_create(self, serializer):
        if serializer.validated_data["user"].role != "CUSTOMER":
            raise ValidationError("Ky përdorues nuk është CUSTOMER.")
        serializer.save()


class DriverProfileViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = DriverProfileSerializer

    def perform_create(self, serializer):
        if serializer.validated_data["user"].role != "DRIVER":
            raise ValidationError("Ky përdorues nuk është DRIVER.")
        serializer.save() 

class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.is_driver:
            return Order.objects.all().order_by('-created_at')
        return Order.objects.filter(user=user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        order = self.get_object()
        user = self.request.user
        new_status = serializer.validated_data.get('status')
        new_driver = serializer.validated_data.get('driver')

        can_update = False
        if user.is_staff:
            can_update = True
        elif user.is_driver and hasattr(user, 'driver_profile') and order.driver == user.driver_profile: # Added hasattr check
            if new_status in ["ON_THE_WAY", "DELIVERED"] and not new_driver:
                can_update = True
        
        if not can_update:
            allowed_fields_for_customer = [] 
            is_valid_customer_update = True
            for field in serializer.validated_data.keys():
                if field not in allowed_fields_for_customer:
                    is_valid_customer_update = False
                    
                    if getattr(order, field) != serializer.validated_data[field]:
                        raise PermissionDenied(f"You do not have permission to update '{field}'.")
            if not is_valid_customer_update and not (new_status or new_driver): 
                pass 

        serializer.save()

    def perform_destroy(self, instance):
        if not self.request.user.is_staff:
            if instance.user != self.request.user or not instance.can_be_cancelled():
                raise PermissionDenied("You do not have permission to cancel this order.")
        instance.delete()

    
class OrderItemViewSet(viewsets.ModelViewSet):
    queryset = OrderItem.objects.all()
    serializer_class = OrderItemSerializer
    permission_classes = [IsAuthenticated] # Or more specific if needed

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return OrderItem.objects.all()
     
        return OrderItem.objects.filter(order__user=user)

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()] # Only admins can directly manipulate order items
        return [IsAuthenticated()]
    
class DeliveryViewSet(viewsets.ModelViewSet):
    queryset = Delivery.objects.all()
    serializer_class = DeliverySerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        user = self.request.user
        if user.is_staff: return Delivery.objects.all()
        if hasattr(user, 'driver_profile'): return Delivery.objects.filter(delivery_person=user)
        if hasattr(user, 'customer_profile'): return Delivery.objects.filter(order__user=user)
        return Delivery.objects.none()

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        user = self.request.user
        if user.is_staff: return Payment.objects.all()
        return Payment.objects.filter(order__user=user)

class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['restaurant']
    permission_classes = [IsAuthenticated]
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class AddressViewSet(viewsets.ModelViewSet):
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]
    queryset = Address.objects.all()
    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)
    def perform_create(self, serializer):
        if serializer.validated_data.get('is_default'):
            Address.objects.filter(user=self.request.user, is_default=True).update(is_default=False)
        serializer.save(user=self.request.user)
    def perform_update(self, serializer):
        if serializer.validated_data.get('is_default'):
            Address.objects.filter(user=self.request.user, is_default=True).exclude(pk=serializer.instance.pk).update(is_default=False)
        serializer.save()

class CartViewSet(viewsets.ModelViewSet):
    serializer_class = CartSerializer
    permission_classes = [IsAuthenticated]
    queryset = Cart.objects.all()
    def get_queryset(self):
        return Cart.objects.filter(user=self.request.user)
    def perform_create(self, serializer):
        if Cart.objects.filter(user=self.request.user).exists():
            raise ValidationError("Cart already exists for this user.")
        serializer.save(user=self.request.user)

class CartItemViewSet(viewsets.ModelViewSet):
    serializer_class = CartItemSerializer
    permission_classes = [IsAuthenticated]
    queryset = CartItem.objects.all()
    def get_queryset(self):
        return CartItem.objects.filter(cart__user=self.request.user)
    def perform_create(self, serializer):
        user_cart, _ = Cart.objects.get_or_create(user=self.request.user)
        menu_item = serializer.validated_data.get('menu_item')
        quantity = serializer.validated_data.get('quantity', 1)
        cart_item, created = CartItem.objects.get_or_create(
            cart=user_cart, menu_item=menu_item,
            defaults={'quantity': quantity}
        )
        if not created:
            cart_item.quantity += quantity
            cart_item.save()
        else:
            serializer.save(cart=user_cart) 
            if created:
                 pass 
            

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    queryset = Notification.objects.all()
    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

class CouponViewSet(viewsets.ModelViewSet):
    queryset = Coupon.objects.all()
    serializer_class = CouponSerializer
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAdminUser()]

class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    queryset = Transaction.objects.all()
    def get_queryset(self):
        if self.request.user.is_staff:
            return Transaction.objects.all()
        return Transaction.objects.filter(user=self.request.user)

class ScheduleViewSet(viewsets.ModelViewSet):
    queryset = Schedule.objects.all()
    serializer_class = ScheduleSerializer
    permission_classes = [IsAdminUser]

class FavoriteRestaurantViewSet(viewsets.ModelViewSet):
    serializer_class = FavoriteRestaurantSerializer
    permission_classes = [IsAuthenticated]
    queryset = FavoriteRestaurant.objects.all()
    def get_queryset(self):
        return FavoriteRestaurant.objects.filter(user=self.request.user)
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class FavoriteItemViewSet(viewsets.ModelViewSet):
    serializer_class = FavoriteItemSerializer
    permission_classes = [IsAuthenticated]
    queryset = FavoriteItem.objects.all()
    def get_queryset(self):
        return FavoriteItem.objects.filter(user=self.request.user)
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
