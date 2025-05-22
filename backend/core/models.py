from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.core.exceptions import ValidationError # Added for custom validation

class User(AbstractUser):
    # Added RESTAURANT_OWNER role
    ROLE_CUSTOMER = "CUSTOMER"
    ROLE_DRIVER = "DRIVER"
    ROLE_RESTAURANT_OWNER = "RESTAURANT_OWNER" # New role
    ROLE_ADMIN = "ADMIN" # Platform super-admin

    ROLE_CHOICES = [
        (ROLE_CUSTOMER, "Customer"),
        (ROLE_DRIVER, "Driver"),
        (ROLE_RESTAURANT_OWNER, "Restaurant Owner"), # New role added
        (ROLE_ADMIN, "Admin"),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_CUSTOMER) # Increased max_length for new role

    # Helper properties updated
    @property
    def is_customer(self):
        return self.role == self.ROLE_CUSTOMER

    @property
    def is_driver(self):
        return self.role == self.ROLE_DRIVER

    @property
    def is_restaurant_owner(self): # New helper property
        return self.role == self.ROLE_RESTAURANT_OWNER

    @property
    def is_admin(self): # This now clearly refers to platform admin
        return self.role == self.ROLE_ADMIN

# General categories for restaurants (e.g., Italian, Chinese)
class RestaurantCategory(models.Model):
    name = models.CharField(max_length=100, unique=True) # Made name unique

    def __str__(self):
        return self.name

class Restaurant(models.Model):
    name = models.CharField(max_length=255)
    address = models.TextField()
    phone = models.CharField(max_length=20)
    image = models.ImageField(upload_to='restaurant_images/', null=True, blank=True)
    # General categories for the restaurant itself
    categories = models.ManyToManyField(RestaurantCategory, blank=True, related_name='restaurants')
    # Link to the User who owns/manages this restaurant
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT, # Prevent deleting owner if they own restaurants; handle manually
        related_name='owned_restaurants',
        limit_choices_to={'role__in': [User.ROLE_RESTAURANT_OWNER, User.ROLE_ADMIN]}, # Only owners or admins can own
        null=True, # Temporarily allow null for existing restaurants, make False after assigning owners
        blank=True # Temporarily allow blank
    )
    is_active = models.BooleanField(default=True) # To activate/deactivate a restaurant
    is_approved = models.BooleanField(default=False) # For admin approval flow

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
    open_time = models.TimeField(null=True, blank=True) # Allow null if is_closed is True
    close_time = models.TimeField(null=True, blank=True) # Allow null if is_closed is True
    is_closed = models.BooleanField(default=False)

    class Meta:
        unique_together = ('restaurant', 'day_of_week')
        ordering = ['restaurant', 'day_of_week']

    def __str__(self):
        if self.is_closed:
            return f"{self.restaurant.name} - {self.get_day_of_week_display()} (Closed)"
        return f"{self.restaurant.name} - {self.get_day_of_week_display()}: {self.open_time.strftime('%H:%M')} - {self.close_time.strftime('%H:%M')}"

    def clean(self):
        super().clean()
        if not self.is_closed:
            if self.open_time is None or self.close_time is None:
                raise ValidationError("Open time and close time must be set if the restaurant is not marked as closed for the day.")
            if self.open_time and self.close_time and self.close_time <= self.open_time:
                raise ValidationError("Close time must be after open time.")
        else:
            # If closed, times can be null
            self.open_time = None
            self.close_time = None


# Categories for items within a restaurant's menu (e.g., Appetizers, Main Courses)
class MenuCategory(models.Model):
    # This category is now specific to a Restaurant
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='menu_categories')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    order = models.PositiveIntegerField(default=0, help_text="Order in which categories appear") # For ordering categories

    class Meta:
        unique_together = ('restaurant', 'name') # Category names should be unique per restaurant
        ordering = ['restaurant', 'order', 'name']

    def __str__(self):
        return f"{self.name} ({self.restaurant.name})"

# Menus of a restaurant (e.g., Lunch Menu, Dinner Menu)
class Menu(models.Model):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='menus')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True) # A restaurant might have inactive menus

    class Meta:
        unique_together = ('restaurant', 'title') # Menu titles should be unique per restaurant
        ordering = ['restaurant', 'title']

    def __str__(self):
        return f"{self.title} ({self.restaurant.name})"

# Items within a menu
class MenuItem(models.Model):
    menu = models.ForeignKey(Menu, on_delete=models.CASCADE, related_name='items')
    # This category now refers to the restaurant-specific MenuCategory
    category = models.ForeignKey(MenuCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='menu_items')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2) # Increased max_digits
    image = models.ImageField(upload_to='menu_item_images/', null=True, blank=True)
    is_available = models.BooleanField(default=True) # Availability toggle for the item
    preparation_time_minutes = models.PositiveIntegerField(null=True, blank=True, help_text="Estimated preparation time in minutes")

    class Meta:
        ordering = ['menu', 'category', 'name']

    def __str__(self):
        return f"{self.name} ({self.menu.title}) - ${self.price}"

    def clean(self):
        super().clean()
        if self.price <= 0:
            raise ValidationError({'price': "Price must be a positive number."})
        # Ensure category belongs to the same restaurant as the menu
        if self.category and self.menu and self.category.restaurant != self.menu.restaurant:
            raise ValidationError({'category': "Category must belong to the same restaurant as the menu."})


class CustomerProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, primary_key=True, related_name='customer_profile')
    phone = models.CharField(max_length=20, blank=True, null=True)
    # Default address can be linked here, or handled via Address.is_default
    # profile_picture = models.ImageField(upload_to='customer_profiles/', null=True, blank=True)

    def __str__(self):
        return self.user.username

class DriverProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, primary_key=True, related_name='driver_profile')
    company_name = models.CharField(max_length=100, blank=True, null=True)
    license_number = models.CharField(max_length=50, blank=True, null=True)
    vehicle_details = models.CharField(max_length=255, blank=True, null=True)
    # profile_picture = models.ImageField(upload_to='driver_profiles/', null=True, blank=True)
    is_available = models.BooleanField(default=True) # Driver's availability status
    current_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    current_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    last_location_update = models.DateTimeField(null=True, blank=True)


    def __str__(self):
        return self.company_name if self.company_name else self.user.username

class Coupon(models.Model):
    code = models.CharField(max_length=50, unique=True)
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, help_text="Discount as a percentage, e.g., 10.00 for 10%")
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Fixed discount amount. Use either percentage or amount.")
    min_purchase_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    valid_from = models.DateTimeField()
    valid_to = models.DateTimeField()
    active = models.BooleanField(default=True)
    max_uses = models.PositiveIntegerField(null=True, blank=True, help_text="Maximum number of times this coupon can be used in total")
    uses_per_user = models.PositiveIntegerField(null=True, blank=True, help_text="Maximum number of times a single user can use this coupon")
    # applicable_restaurants = models.ManyToManyField(Restaurant, blank=True)
    # applicable_categories = models.ManyToManyField(MenuCategory, blank=True) # Restaurant-specific MenuCategory

    def __str__(self):
        return self.code

    def clean(self):
        super().clean()
        if self.discount_percentage is not None and self.discount_amount is not None:
            raise ValidationError("Coupon cannot have both a percentage discount and a fixed amount discount.")
        if self.discount_percentage is None and self.discount_amount is None:
            raise ValidationError("Coupon must have either a percentage discount or a fixed amount discount.")
        if self.discount_percentage is not None and (self.discount_percentage <= 0 or self.discount_percentage > 100):
            raise ValidationError({'discount_percentage': "Discount percentage must be between 0 and 100."})
        if self.discount_amount is not None and self.discount_amount <= 0:
            raise ValidationError({'discount_amount': "Discount amount must be positive."})
        if self.valid_to <= self.valid_from:
            raise ValidationError({'valid_to': "Valid to date must be after valid from date."})


class Order(models.Model):
    STATUS_PENDING = "PENDING"
    STATUS_CONFIRMED = "CONFIRMED"
    STATUS_PREPARING = "PREPARING" # Changed from COOKING for more general term
    STATUS_READY_FOR_PICKUP = "READY_FOR_PICKUP" # New status
    STATUS_ON_THE_WAY = "ON_THE_WAY"
    STATUS_DELIVERED = "DELIVERED"
    STATUS_CANCELLED_BY_USER = "CANCELLED_BY_USER" # More specific
    STATUS_CANCELLED_BY_RESTAURANT = "CANCELLED_BY_RESTAURANT" # More specific
    STATUS_FAILED = "FAILED" # For payment or other failures

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_CONFIRMED, "Confirmed by Restaurant"),
        (STATUS_PREPARING, "Preparing Order"),
        (STATUS_READY_FOR_PICKUP, "Ready for Pickup"),
        (STATUS_ON_THE_WAY, "On-the-way"),
        (STATUS_DELIVERED, "Delivered"),
        (STATUS_CANCELLED_BY_USER, "Cancelled by User"),
        (STATUS_CANCELLED_BY_RESTAURANT, "Cancelled by Restaurant"),
        (STATUS_FAILED, "Failed"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='orders') # Customer who placed order
    restaurant = models.ForeignKey(Restaurant, on_delete=models.PROTECT, related_name='orders')
    driver = models.ForeignKey(DriverProfile, null=True, blank=True, on_delete=models.SET_NULL, related_name='assigned_orders')
    
    # Delivery Address details denormalized for historical record, in case user changes their default addresses
    delivery_address_street = models.CharField(max_length=255, blank=True, null=True)
    delivery_address_city = models.CharField(max_length=100, blank=True, null=True)
    delivery_address_zip_code = models.CharField(max_length=20, blank=True, null=True)
    delivery_address_country = models.CharField(max_length=100, blank=True, null=True)
    delivery_instructions = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True) # Track last update
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default=STATUS_PENDING) # Increased max_length

    # Monetary fields
    subtotal_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00) # Sum of item prices * quantity
    delivery_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    service_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00) # Optional
    coupon_applied = models.ForeignKey(Coupon, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders_applied_to')
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00) # Amount discounted by coupon
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00) # subtotal + delivery_fee + service_fee - discount_amount

    # Estimated times
    estimated_preparation_time_at_order = models.PositiveIntegerField(null=True, blank=True, help_text="Snapshot of total prep time in minutes at order creation")
    estimated_delivery_time_at_order = models.DateTimeField(null=True, blank=True, help_text="Calculated delivery ETA at time of order")
    pickup_time = models.DateTimeField(null=True, blank=True)
    delivered_time = models.DateTimeField(null=True, blank=True)

    # Payment related (simple link, actual payment processing is complex)
    payment_status = models.CharField(max_length=20, default="PENDING", choices=[("PENDING", "Pending"), ("PAID", "Paid"), ("FAILED", "Failed")])
    
    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Order #{self.pk} by {self.user.username} from {self.restaurant.name}"

    def can_be_cancelled_by_user(self):
        return self.status in [self.STATUS_PENDING, self.STATUS_CONFIRMED]

    def can_be_cancelled_by_restaurant(self):
        return self.status in [self.STATUS_PENDING, self.STATUS_CONFIRMED, self.STATUS_PREPARING]

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    menu_item = models.ForeignKey(MenuItem, on_delete=models.PROTECT, related_name='order_items') # PROTECT to prevent deleting item if in orders
    menu_item_name_at_purchase = models.CharField(max_length=255) # Denormalized for history
    quantity = models.PositiveIntegerField(default=1)
    price_at_purchase = models.DecimalField(max_digits=8, decimal_places=2) # Price per item at time of order
    # special_instructions = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = ('order', 'menu_item') # Usually, one line item per menu item in an order

    def __str__(self):
        return f"{self.quantity} x {self.menu_item_name_at_purchase} (Order #{self.order_id})"

    @property
    def total_price(self):
        return self.quantity * self.price_at_purchase

# Note: The `Delivery` model might be redundant if `Order` itself tracks driver and delivery times/status.
# If detailed delivery logistics are needed (multiple stops, route optimization), a separate Delivery model is good.
# For simplicity, I'm commenting it out and assuming Order tracks key delivery info.
# class Delivery(models.Model):
#     order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='delivery_info') # Changed related_name
#     # delivery_person FK is now on Order model as 'driver'
#     # delivery_status is now on Order model as 'status' (ON_THE_WAY, DELIVERED)
#     # delivered_at is now on Order model as 'delivered_time'
#     # pickup_at = models.DateTimeField(null=True, blank=True) # This is on Order as 'pickup_time'
#     # notes = models.TextField(blank=True, null=True)
#     # tracking_id = models.CharField(max_length=100, blank=True, null=True, unique=True)

#     def __str__(self):
#         return f"Delivery for Order {self.order.id}"

# Payment model might be simplified or expanded based on payment gateway integration
class Payment(models.Model):
    order = models.ForeignKey(Order, on_delete=models.PROTECT, related_name='payments') # An order might have multiple payment attempts
    transaction_id_gateway = models.CharField(max_length=255, unique=True, help_text="Transaction ID from payment gateway")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=50)  # E.g., "stripe_card", "paypal", "cash_on_delivery"
    status = models.CharField(max_length=20, choices=[("PENDING", "Pending"), ("SUCCESS", "Success"), ("FAILED", "Failed"), ("REFUNDED", "Refunded")])
    paid_at = models.DateTimeField(auto_now_add=True)
    # payment_gateway_response = models.JSONField(null=True, blank=True) # To store raw response

    def __str__(self):
        return f"Payment {self.transaction_id_gateway} for Order #{self.order_id} - {self.status}"

class Review(models.Model):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='given_reviews') # Changed related_name
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviews', help_text="Link review to a specific order if applicable")
    rating = models.PositiveIntegerField(choices=[(i, str(i)) for i in range(1, 6)]) # Rating 1-5
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    # reply_from_restaurant = models.TextField(blank=True, null=True)
    # reply_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('order', 'user') # A user can review an order once
        ordering = ['-created_at']

    def __str__(self):
        return f"Review by {self.user.username} for {self.restaurant.name} - {self.rating} stars"

class Address(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='addresses')
    address_label = models.CharField(max_length=100, blank=True, null=True, help_text="e.g., Home, Work")
    street = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state_province = models.CharField(max_length=100, blank=True, null=True)
    zip_code = models.CharField(max_length=20)
    country = models.CharField(max_length=100, default="YourDefaultCountry") # Consider a default
    # latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    # longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    is_default_shipping = models.BooleanField(default=False)
    # is_default_billing = models.BooleanField(default=False) # If you differentiate billing/shipping

    class Meta:
        verbose_name_plural = "Addresses"
        ordering = ['user', '-is_default_shipping']

    def __str__(self):
        return f"{self.address_label or self.street}, {self.city} ({self.user.username})"

    def save(self, *args, **kwargs):
        # Ensure only one default shipping address per user
        if self.is_default_shipping:
            Address.objects.filter(user=self.user, is_default_shipping=True).exclude(pk=self.pk).update(is_default_shipping=False)
        super().save(*args, **kwargs)


class Cart(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, primary_key=True, related_name='cart')
    # restaurant = models.ForeignKey(Restaurant, on_delete=models.SET_NULL, null=True, blank=True, help_text="Current restaurant for the cart if items are from one place")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Cart of {self.user.username}"

class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE, related_name='cart_items')
    quantity = models.PositiveIntegerField(default=1)
    # added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('cart', 'menu_item')

    def __str__(self):
        return f"{self.quantity} x {self.menu_item.name} in Cart of {self.cart.user.username}"

    @property
    def total_price(self):
        return self.quantity * self.menu_item.price

    def clean(self):
        super().clean()
        if self.quantity <= 0:
            raise ValidationError({'quantity': "Quantity must be positive."})
        # Optional: Check if adding item from different restaurant than already in cart
        # current_cart_restaurant = self.cart.restaurant
        # if current_cart_restaurant and self.menu_item.menu.restaurant != current_cart_restaurant:
        #     raise ValidationError("Items from different restaurants cannot be added to the same cart. Please clear your cart or complete your current order.")


class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ("ORDER_STATUS", "Order Status Update"),
        ("PROMOTION", "New Promotion"),
        ("ACCOUNT", "Account Activity"),
        ("GENERAL", "General Notification"),
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES, default="GENERAL")
    link_to = models.URLField(blank=True, null=True, help_text="Optional link for the notification target")
    # related_object_id = models.PositiveIntegerField(null=True, blank=True) # For generic relations
    # related_object_content_type = models.ForeignKey('contenttypes.ContentType', on_delete=models.SET_NULL, null=True, blank=True)
    # related_object = GenericForeignKey('related_object_content_type', 'related_object_id')
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification for {self.user.username}: {self.message[:50]}..."

# Transaction model might be part of Payment, or expanded for wallet systems.
# For simplicity, linking it more broadly.
class Transaction(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='transactions')
    payment = models.ForeignKey(Payment, on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions_detail') # If related to a specific payment attempt
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True, related_name='financial_transactions') # Optional direct link to order
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    transaction_type = models.CharField(max_length=50, choices=[("PAYMENT", "Payment"), ("REFUND", "Refund"), ("ADJUSTMENT", "Adjustment")])
    status = models.CharField(max_length=20, default="SUCCESS", choices=[("PENDING", "Pending"), ("SUCCESS", "Success"), ("FAILED", "Failed")])
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.transaction_type} for {self.user.username} - {self.amount} ({self.status})"

# Schedule might be too detailed if Order model tracks estimated delivery.
# Commenting out as its functionality is largely covered by enhancements to Order.
# class Schedule(models.Model):
#     order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='delivery_schedule')
#     # estimated_delivery_time field is now on Order model
#     scheduled_pickup_time = models.DateTimeField(null=True, blank=True)
#     scheduled_delivery_time = models.DateTimeField(null=True, blank=True)
#
#     def __str__(self):
#         return f"Schedule for Order #{self.order.id}"

class FavoriteRestaurant(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='favorite_restaurants')
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='favorited_by_users') # Changed related_name

    class Meta:
        unique_together = ('user', 'restaurant')
        ordering = ['user', 'restaurant__name']

    def __str__(self):
        return f"{self.user.username} favorites {self.restaurant.name}"

class FavoriteItem(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='favorite_menu_items') # Changed related_name
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE, related_name='favorited_by_users') # Changed related_name

    class Meta:
        unique_together = ('user', 'menu_item')
        ordering = ['user', 'menu_item__name']

    def __str__(self):
        return f"{self.user.username} favorites {self.menu_item.name}"

# Added a model for tracking coupon usage if needed for advanced coupon logic
# class CouponUsage(models.Model):
#     coupon = models.ForeignKey(Coupon, on_delete=models.CASCADE, related_name='usages')
#     user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='coupon_usages')
#     order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='coupon_applied_details') # The order where it was used
#     used_at = models.DateTimeField(auto_now_add=True)

#     class Meta:
#         unique_together = ('coupon', 'user', 'order') # Ensure a coupon is marked as used by a user for an order only once

#     def __str__(self):
#         return f"Coupon {self.coupon.code} used by {self.user.username} on Order #{self.order.id}"