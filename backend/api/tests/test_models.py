from django.test import TestCase
from django.contrib.auth import get_user_model
from api.models import CuisineType, Restaurant, Address

User = get_user_model()

class UserModelTests(TestCase):

    def test_create_user(self):
        user = User.objects.create_user(
            email='testuser@example.com',
            password='password123',
            first_name='Test',
            last_name='User',
            role=User.Role.CUSTOMER
        )
        self.assertEqual(user.email, 'testuser@example.com')
        self.assertTrue(user.check_password('password123'))
        self.assertEqual(user.role, User.Role.CUSTOMER)
        self.assertEqual(user.full_name, 'Test User')

    def test_create_superuser(self):
        admin_user = User.objects.create_superuser(
            email='super@example.com',
            password='password123',
            first_name='Super',
            last_name='User'
        )
        self.assertEqual(admin_user.email, 'super@example.com')
        self.assertTrue(admin_user.is_staff)
        self.assertTrue(admin_user.is_superuser)
        self.assertEqual(admin_user.role, User.Role.ADMIN)

class CuisineTypeModelTests(TestCase):

    def test_create_cuisine_type(self):
        cuisine = CuisineType.objects.create(name="Italian", description="Delicious Italian food")
        self.assertEqual(cuisine.name, "Italian")
        self.assertEqual(str(cuisine), "Italian")

class RestaurantModelTests(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            email='owner@example.com', password='password123', role=User.Role.RESTAURANT_OWNER
        )
        self.address = Address.objects.create(
            user=self.owner, street="123 Main St", city="Testville", postal_code="12345", country="Testland"
        )

    def test_create_restaurant(self):
        restaurant = Restaurant.objects.create(
            owner=self.owner,
            name="Test Restaurant",
            address=self.address,
            phone_number="1234567890"
        )
        self.assertEqual(restaurant.name, "Test Restaurant")
        self.assertEqual(restaurant.owner, self.owner)
        self.assertEqual(str(restaurant), "Test Restaurant")

