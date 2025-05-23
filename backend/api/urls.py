# backend/api/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers # Importo nested routers
from rest_framework_simplejwt.views import TokenRefreshView
from .views import OrderViewSet # Shto importin

from .views import (
    # Auth & User
    UserRegistrationAPIView, 
    CustomTokenObtainPairView, 
    UserMeAPIView, 
    UserViewSet, # Për adminin
    AddressViewSet,
    # Restaurant & Menu
    CuisineTypeViewSet,
    RestaurantViewSet,
    MenuCategoryViewSet,
    MenuItemViewSet,
    OrderViewSet, # Ensure OrderViewSet is imported
    ReviewViewSet, # Shto ReviewViewSet
    OperatingHoursViewSet, # Sigurohu që OperatingHoursViewSet është këtu
    DriverProfileViewSet, # Shto DriverProfileViewSet
    LogoutAPIView, # Shto LogoutAPIView
    ReviewReplyViewSet, # Shto këtë
    CartViewSet # SHTO IMPORTIN E CARTVIEWSET
)

# Router kryesor
router = DefaultRouter()
router.register(r'admin/users', UserViewSet, basename='user-admin-management') # Për menaxhim nga Admini
router.register(r'addresses', AddressViewSet, basename='address') # Për adresat e userit të kyçur
router.register(r'cuisine-types', CuisineTypeViewSet, basename='cuisinetype') # CRUD për llojet e kuzhinave (Admin)
router.register(r'restaurants', RestaurantViewSet, basename='restaurant') # SHTO basename='restaurant'
router.register(r'orders', OrderViewSet, basename='order') 
router.register(r'driver-profiles', DriverProfileViewSet, basename='driverprofile')
router.register(r'cart', CartViewSet, basename='cart') # SHTO REGJISTRIMIN E CARTVIEWSET

# Nested Router për MenuCategories nën Restaurants
# /api/restaurants/{restaurant_pk}/categories/
restaurants_router = routers.NestedSimpleRouter(router, r'restaurants', lookup='restaurant')
restaurants_router.register(r'menu-categories', MenuCategoryViewSet, basename='restaurant-menucategory')

# Nested Router për MenuItems nën Restaurants
# /api/restaurants/{restaurant_pk}/menu-items/
# Kjo do të listojë të gjithë artikujt e restorantit, pavarësisht kategorisë.
# Filtimi sipas kategorisë mund të bëhet me query params ose një nested route tjetër nëse dëshirohet.
restaurants_router.register(r'menu-items', MenuItemViewSet, basename='restaurant-menuitem')

# Nested router për OperatingHours nën Restaurant
restaurants_router.register(r'operating-hours', OperatingHoursViewSet, basename='restaurant-operating-hours')
restaurants_router.register(r'reviews', ReviewViewSet, basename='restaurant-reviews') # Regjistro ReviewViewSet

# Nested router për MenuItem nën MenuCategory (që është nën Restaurant)
menu_categories_router = routers.NestedSimpleRouter(restaurants_router, r'menu-categories', lookup='menu_category')
menu_categories_router.register(r'menu-items', MenuItemViewSet, basename='restaurant-menu-category-items') # Mund ta heqësh nëse nuk e përdor këtë nivel nesting-u për items

# Nested router për ReviewReply nën Review
reviews_router = routers.NestedSimpleRouter(restaurants_router, r'reviews', lookup='review')
reviews_router.register(r'replies', ReviewReplyViewSet, basename='review-replies')


# Duhet të ketë një nested router edhe për CartItem nën Cart
# cart_items_router = routers.NestedSimpleRouter(router, r'cart', lookup='cart')
# cart_items_router.register(r'items', CartItemViewSet, basename='cart-items')


urlpatterns = [
    # Auth endpoints
    path('auth/register/', UserRegistrationAPIView.as_view(), name='auth_register'),
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='auth_login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', UserMeAPIView.as_view(), name='auth_me'),
    path('auth/logout/', LogoutAPIView.as_view(), name='auth_logout'),
    
    # API endpoints të menaxhuara nga router-i kryesor dhe ato nested
    path('', include(router.urls)),
    path('', include(restaurants_router.urls)),
    path('', include(reviews_router.urls)), # Shto këtë
    # path('', include(menu_categories_router.urls)), # Komentoje nëse nuk e përdor nesting-un e thellë për items
]