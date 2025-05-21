from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'restaurants', RestaurantViewSet)
router.register(r'restaurant-categories', RestaurantCategoryViewSet)
router.register(r'menus', MenuViewSet)
router.register(r'menu-items', MenuItemViewSet)
router.register(r'menu-categories', MenuCategoryViewSet)
router.register(r'customer-profiles', CustomerProfileViewSet, basename='customerprofile')
router.register(r'driver-profiles', DriverProfileViewSet, basename='driverprofile')
# router.register(r'orders', OrderViewSet)
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'order-items', OrderItemViewSet)
# router.register(r'deliveries', DeliveryViewSet)
# router.register(r'payments', PaymentViewSet)
router.register(r'reviews', ReviewViewSet)
router.register(r'addresses', AddressViewSet, basename='address')
router.register(r'carts', CartViewSet, basename='cart')
router.register(r'cart-items', CartItemViewSet, basename='cartitem')
# router.register(r'notifications', NotificationViewSet)
# router.register(r'coupons', CouponViewSet)
# router.register(r'transactions', TransactionViewSet)
# router.register(r'schedules', ScheduleViewSet)
router.register(r'favorite-restaurants', FavoriteRestaurantViewSet)
router.register(r'favorite-items', FavoriteItemViewSet)
router.register(r'opening-hours', OpeningHourViewSet)


from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
