from django.db import models

# Create your models here.
from django.contrib.auth.models import AbstractUser

from django.conf import settings

class User(AbstractUser):
    ROLE_CHOICES = [
        ("CUSTOMER", "Customer"),
        ("DRIVER",   "Driver"),
        ("ADMIN",    "Admin"),
    ]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="CUSTOMER")

    # --------- shto helper-property në vend të kolonave ---------
    @property
    def is_customer(self):
        return self.role == "CUSTOMER"

    @property
    def is_driver(self):
        return self.role == "DRIVER"

    @property
    def is_admin(self):
        return self.role == "ADMIN"

# kategorite e restaurantit
class RestaurantCategory(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name
    
class Restaurant(models.Model):
    name = models.CharField(max_length=255)
    address = models.TextField()
    phone = models.CharField(max_length=20)
    image = models.ImageField(upload_to='restaurant_images/', null=True, blank=True)
    categories = models.ManyToManyField(RestaurantCategory, blank=True, related_name='restaurants')
    
    def __str__(self):
        return self.name

class OpeningHour(models.Model):
    WEEKDAYS = [
        (0, 'Monday'),  
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'), 
        (4, 'Friday'),
        (5, 'Saturday'),
        (6, 'Sunday'),
    ]

    restaurant = models.ForeignKey(Restaurant, related_name='opening_hours', on_delete=models.CASCADE)
    day_of_week = models.IntegerField(choices=WEEKDAYS)
    open_time = models.TimeField()
    close_time = models.TimeField()
    is_closed = models.BooleanField(default=False)

    class Meta:
        unique_together = ('restaurant', 'day_of_week')

    def __str__(self):
        return f"{self.restaurant.name} - {self.get_day_of_week_display()}"    

class MenuCategory(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name
    
# menyt e nje restauranti
class Menu(models.Model):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='menus')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.title} ({self.restaurant.name})"

# artikujt ne nje meny
class MenuItem(models.Model):
    menu = models.ForeignKey(Menu, on_delete=models.CASCADE, related_name='items')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=6, decimal_places=2)
    category = models.ForeignKey('MenuCategory', null=True, blank=True, on_delete=models.SET_NULL, related_name='menu_items')


    def __str__(self):
        return f"{self.name} - ${self.price}"
    
    
    
    
class CustomerProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='customer_profile')
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)

    def __str__(self):
        return self.user.username


class DriverProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='driver_profile')
    company_name = models.CharField(max_length=100, blank=True)  # fusha e re
    license_number = models.CharField(max_length=50, blank=True)
    vehicle_details = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return self.company_name if self.company_name else self.user.username

# Coupons
class Coupon(models.Model):
    code = models.CharField(max_length=50, unique=True)
    discount_percentage = models.PositiveIntegerField()
    valid_from = models.DateTimeField()
    valid_to = models.DateTimeField()
    active = models.BooleanField(default=True)

    def __str__(self):
        return self.code

# porosit e perdoruesit
class Order(models.Model):
    STATUS_CHOICES = [
        ("PENDING",    "Pending"),
        ("CONFIRMED",  "Confirmed"),
        ("COOKING",    "Cooking"),
        ("ON_THE_WAY", "On-the-way"),
        ("DELIVERED",  "Delivered"),
        ("CANCELLED",  "Cancelled"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='orders')
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='orders')
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=12,
        choices=STATUS_CHOICES,
        default="PENDING",
    )
    driver = models.ForeignKey(DriverProfile, null=True, blank=True, on_delete=models.SET_NULL, related_name='orders')
    coupon_applied = models.ForeignKey(Coupon, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders_applied_to') #<-- ADDED
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00) # Store original total
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    final_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00) # Store amount after discount

    def __str__(self):
        return f"Order {self.id} by {self.user.username}"

    def can_be_cancelled(self):
        return self.status == "PENDING"

# artikujt e porosis
class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE, related_name='order_items')
    quantity = models.PositiveIntegerField(default=1)
    price_at_purchase = models.DecimalField(max_digits=6, decimal_places=2) # To store price when ordered

    def __str__(self):
        return f"{self.quantity} x {self.menu_item.name}"

# Delivery
class Delivery(models.Model):
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='delivery')
    delivery_person = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='deliveries')
    delivery_status = models.CharField(max_length=50, default='pending')  # p.sh. pending, en route, delivered
    delivered_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Delivery for Order {self.order.id} - {self.delivery_status}"

class Payment(models.Model):
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='payment')
    amount = models.DecimalField(max_digits=8, decimal_places=2)
    payment_method = models.CharField(max_length=50)  # card, cash, etc
    paid_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Payment for Order {self.order.id}"

# Review
class Review(models.Model):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews')
    rating = models.PositiveIntegerField()
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Review by {self.user.username} - {self.rating} stars"

# Address
class Address(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='addresses')
    street = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    zip_code = models.CharField(max_length=20)
    country = models.CharField(max_length=100)
    is_default = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.street}, {self.city}"

# Cart
class Cart(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='cart')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Cart of {self.user.username}"

# Cart Items
class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE, related_name='cart_items')
    quantity = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.quantity} x {self.menu_item.name}"

# Notifications
class Notification(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    message = models.CharField(max_length=255)
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.user.username}"



# Transactions
class Transaction(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='transactions')
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions') # Optional link to order
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    transaction_type = models.CharField(max_length=50)  # PAYMENT, REFUND, WALLET_DEPOSIT, etc.
    status = models.CharField(max_length=20, default="SUCCESS") # PENDING, SUCCESS, FAILED
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.transaction_type} - {self.amount}"

# Schedules (for delivery times)
class Schedule(models.Model):
    delivery = models.OneToOneField(Delivery, on_delete=models.CASCADE, related_name='schedule')
    estimated_delivery_time = models.DateTimeField()

    def __str__(self):
        return f"Schedule for {self.delivery.order.id}"

# Favorites (restaurants)
class FavoriteRestaurant(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='favorite_restaurants')
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='favorited_by')

    class Meta:
        unique_together = ('user', 'restaurant') # Prevent duplicate favorites

    def __str__(self):
        return f"{self.user.username} favorites {self.restaurant.name}"

# Favorites (menu items)
class FavoriteItem(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='favorite_items')
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE, related_name='favorited_by')

    class Meta:
        unique_together = ('user', 'menu_item') # Prevent duplicate favorites

    def __str__(self):
        return f"{self.user.username} favorites {self.menu_item.name}"