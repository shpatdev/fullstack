from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from django.contrib.auth import get_user_model
from api.models import CuisineType, Restaurant, Address

User = get_user_model()

class CuisineTypeViewSetTests(APITestCase):

    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_superuser(
            email='admin@example.com', password='password123', first_name='Admin', last_name='User'
        )
        self.user = User.objects.create_user(
            email='test@example.com', password='password123', first_name='Test', last_name='User'
        )
        self.cuisine1 = CuisineType.objects.create(name='Italian')
        self.cuisine2 = CuisineType.objects.create(name='Mexican')
        self.list_url = reverse('cuisinetype-list') # Emri nga router.register(..., basename='cuisinetype')
        self.detail_url = lambda pk: reverse('cuisinetype-detail', kwargs={'pk': pk})

    def test_list_cuisine_types_unauthenticated(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2) # Ose numri i faqosur nëse ka paginim

    def test_list_cuisine_types_authenticated_user(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_retrieve_cuisine_type(self):
        response = self.client.get(self.detail_url(self.cuisine1.pk))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], self.cuisine1.name)

    def test_create_cuisine_type_unauthenticated(self):
        data = {'name': 'French', 'description': 'Classic French cuisine'}
        response = self.client.post(self.list_url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED) # Ose 403 nëse AllowAny por pa leje shkrimi

    def test_create_cuisine_type_authenticated_non_admin(self):
        self.client.force_authenticate(user=self.user)
        data = {'name': 'French', 'description': 'Classic French cuisine'}
        response = self.client.post(self.list_url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_cuisine_type_admin(self):
        self.client.force_authenticate(user=self.admin_user)
        data = {'name': 'French', 'description': 'Classic French cuisine'}
        response = self.client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(CuisineType.objects.count(), 3)
        self.assertEqual(response.data['name'], 'French')

    def test_update_cuisine_type_admin(self):
        self.client.force_authenticate(user=self.admin_user)
        data = {'name': 'Italian Updated', 'description': 'Even more delicious'}
        response = self.client.put(self.detail_url(self.cuisine1.pk), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.cuisine1.refresh_from_db()
        self.assertEqual(self.cuisine1.name, 'Italian Updated')

    def test_delete_cuisine_type_admin(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.delete(self.detail_url(self.cuisine1.pk))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(CuisineType.objects.count(), 1)

class RestaurantViewSetPublicTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.owner = User.objects.create_user(email="owner@test.com", password="password", role=User.Role.RESTAURANT_OWNER)
        self.address = Address.objects.create(user=self.owner, street="1 Main", city="Test", postal_code="10000")
        self.restaurant1 = Restaurant.objects.create(owner=self.owner, name="Approved Active", address=self.address, phone_number="111", is_active=True, is_approved=True)
        Restaurant.objects.create(owner=self.owner, name="Inactive", address=None, phone_number="222", is_active=False, is_approved=True)
        Restaurant.objects.create(owner=self.owner, name="Unapproved", address=None, phone_number="333", is_active=True, is_approved=False)
        self.list_url = reverse('restaurant-list') # Emri nga router.register(r'restaurants', RestaurantViewSet)

    def test_list_restaurants_public_view(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Vetëm restorantet aktive dhe të aprovuara duhet të shfaqen
        self.assertEqual(len(response.data), 1) # Ose numri i faqosur
        self.assertEqual(response.data[0]['name'], "Approved Active")

    def test_retrieve_restaurant_public_view(self):
        detail_url = reverse('restaurant-detail', kwargs={'pk': self.restaurant1.pk})
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], self.restaurant1.name)

# Këtu mund të shtoni më shumë teste për RestaurantViewSet duke simuluar role të ndryshme,
# krijimin, modifikimin, fshirjen, dhe veprimet e personalizuara si 'approve_restaurant'.
