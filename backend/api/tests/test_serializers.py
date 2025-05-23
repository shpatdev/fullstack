from django.test import TestCase
from django.contrib.auth import get_user_model
from api.serializers import UserRegistrationSerializer, CuisineTypeSerializer, RestaurantDetailSerializer
from api.models import CuisineType, Address # Importo Address

User = get_user_model()

class UserRegistrationSerializerTests(TestCase):

    def test_valid_registration(self):
        data = {
            'email': 'newuser@example.com',
            'first_name': 'New',
            'last_name': 'User',
            'password': 'newpassword123',
            'password_confirm': 'newpassword123',
            'role': User.Role.CUSTOMER
        }
        serializer = UserRegistrationSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        user = serializer.save()
        self.assertEqual(user.email, data['email'])
        self.assertEqual(user.role, User.Role.CUSTOMER)

    def test_password_mismatch(self):
        data = {
            'email': 'anotheruser@example.com',
            'first_name': 'Another',
            'last_name': 'User',
            'password': 'password123',
            'password_confirm': 'password456'
        }
        serializer = UserRegistrationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('password_confirm', serializer.errors)

    def test_existing_email(self):
        User.objects.create_user(email='exists@example.com', password='password123')
        data = {
            'email': 'exists@example.com',
            'first_name': 'Existing',
            'last_name': 'Email',
            'password': 'password123',
            'password_confirm': 'password123'
        }
        serializer = UserRegistrationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)

class CuisineTypeSerializerTests(TestCase):
    def test_valid_cuisine_type_serializer(self):
        valid_data = {'name': 'Mexican', 'description': 'Spicy and flavorful'}
        serializer = CuisineTypeSerializer(data=valid_data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        cuisine_type = serializer.save()
        self.assertEqual(cuisine_type.name, valid_data['name'])

    def test_invalid_cuisine_type_serializer_missing_name(self):
        invalid_data = {'description': 'No name here'}
        serializer = CuisineTypeSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

class RestaurantDetailSerializerTests(TestCase):
    def setUp(self):
        self.owner_user = User.objects.create_user(
            email="owner_res@example.com", password="password", role=User.Role.RESTAURANT_OWNER
        )
        self.cuisine1 = CuisineType.objects.create(name="Italiana")
        self.cuisine2 = CuisineType.objects.create(name="Shqiptare")

    def test_create_restaurant_with_serializer(self):
        data = {
            "owner_id": self.owner_user.pk,
            "name": "My New Restaurant",
            "description": "Best food in town.",
            "phone_number": "045123123",
            "address": {
                "street": "Rruga B",
                "city": "Prishtine",
                "postal_code": "10000",
                "country": "Kosovo"
            },
            "operating_hours": [
                {"day_of_week": 1, "open_time": "09:00:00", "close_time": "22:00:00", "is_closed": False},
                {"day_of_week": 0, "is_closed": True}
            ],
            "cuisine_type_ids": [self.cuisine1.pk, self.cuisine2.pk],
            "price_range": "€€"
        }
        serializer = RestaurantDetailSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        restaurant = serializer.save()

        self.assertEqual(restaurant.name, "My New Restaurant")
        self.assertEqual(restaurant.owner, self.owner_user)
        self.assertIsNotNone(restaurant.address)
        self.assertEqual(restaurant.address.street, "Rruga B")
        self.assertEqual(restaurant.operating_hours.count(), 2)
        self.assertEqual(restaurant.cuisine_types.count(), 2)

