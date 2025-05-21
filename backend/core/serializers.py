from rest_framework import serializers
from rest_framework.exceptions import ValidationError
import decimal
from .models import (
    User, Restaurant, RestaurantCategory, Menu, MenuItem, MenuCategory,
    CustomerProfile, DriverProfile, Order, OrderItem, Delivery,
    Payment, Review, Address, Cart, CartItem, Notification,
    Coupon, Transaction, Schedule, FavoriteRestaurant, FavoriteItem,
    OpeningHour
)


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'role']

class RestaurantCategorySerializer(serializers.ModelSerializer): 
    class Meta:
        model = RestaurantCategory
        fields = '__all__'

class RestaurantSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False, allow_null=True)
    categories = RestaurantCategorySerializer(many=True, read_only=True) # For listing
    category_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=RestaurantCategory.objects.all(), source='categories', write_only=True, required=False
    ) # For creating/updating

    class Meta:
        model = Restaurant
        fields = ['id', 'name', 'address', 'phone', 'image', 'categories', 'category_ids']

class OpeningHourSerializer(serializers.ModelSerializer):
    day_of_week_display = serializers.CharField(source='get_day_of_week_display', read_only=True)
    
    class Meta:
        model = OpeningHour
        fields = '__all__'

class MenuCategorySerializer(serializers.ModelSerializer): 
    class Meta:
        model = MenuCategory
        fields = '__all__'

class MenuItemSerializer(serializers.ModelSerializer):
    category = MenuCategorySerializer(read_only=True) # For listing
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=MenuCategory.objects.all(), source='category', write_only=True, allow_null=True, required=False
    ) # For creating/updating

    class Meta:
        model = MenuItem
        fields = ['id', 'menu', 'name', 'description', 'price', 'category', 'category_id']

    def validate_price(self, value):
        if value <= 0:
            raise ValidationError("Price must be a positive number.")
        return value

class MenuSerializer(serializers.ModelSerializer):
    items = MenuItemSerializer(many=True, read_only=True) # Nested items for easy listing

    class Meta:
        model = Menu
        fields = ['id', 'restaurant', 'title', 'description', 'items']


class CustomerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerProfile
        fields = '__all__'

class DriverProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = DriverProfile
        fields = '__all__'

class OrderItemSerializer(serializers.ModelSerializer):
    menu_item_details = MenuItemSerializer(source='menu_item', read_only=True) # For richer display

    class Meta:
        model = OrderItem
        fields = ['id', 'order', 'menu_item', 'menu_item_details', 'quantity', 'price_at_purchase']
        read_only_fields = ['price_at_purchase'] # Set by backend logic

class CouponSerializer(serializers.ModelSerializer): 
    class Meta:
        model = Coupon
        fields = '__all__'

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True) # For creating order with items
    user_details = UserSerializer(source='user', read_only=True)
    restaurant_details = RestaurantSerializer(source='restaurant', read_only=True)
    coupon_applied_details = CouponSerializer(source='coupon_applied', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'user', 'user_details', 'restaurant', 'restaurant_details', 'created_at', 'status', 'driver',
            'items', 'coupon_applied', 'coupon_applied_details',
            'total_amount', 'discount_amount', 'final_amount'
        ]
        read_only_fields = ['user', 'created_at', 'status', 'total_amount', 'discount_amount', 'final_amount']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        order = Order.objects.create(**validated_data)
        total_order_amount = 0
        for item_data in items_data:
            menu_item = item_data['menu_item']
            quantity = item_data['quantity']
            price_at_purchase = menu_item.price # Store current price
            OrderItem.objects.create(order=order, menu_item=menu_item, quantity=quantity, price_at_purchase=price_at_purchase)
            total_order_amount += (price_at_purchase * quantity)
        
        order.total_amount = total_order_amount
        
        
        coupon_code = self.context['request'].data.get('coupon_code')
        if coupon_code:
            try:
                coupon = Coupon.objects.get(code=coupon_code, active=True)
                # Add more validation: valid_from, valid_to, usage limits, etc.
                discount_percentage = coupon.discount_percentage / 100.0
                order.discount_amount = total_order_amount * decimal.Decimal(discount_percentage)
                order.coupon_applied = coupon
            except Coupon.DoesNotExist:
                pass 

        order.final_amount = order.total_amount - order.discount_amount
        order.save()
        return order


class DeliverySerializer(serializers.ModelSerializer):
    class Meta:
        model = Delivery
        fields = '__all__'

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'

class ReviewSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'restaurant', 'user', 'user_details', 'rating', 'comment', 'created_at']
        read_only_fields = ['user'] # User set from request

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = '__all__'
        read_only_fields = ['user']

class CartItemSerializer(serializers.ModelSerializer):
    menu_item_details = MenuItemSerializer(source='menu_item', read_only=True)

    class Meta:
        model = CartItem
        fields = ['id', 'cart', 'menu_item', 'menu_item_details', 'quantity']

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    user_details = UserSerializer(source='user', read_only=True)

    class Meta:
        model = Cart
        fields = ['id', 'user', 'user_details', 'items', 'created_at', 'updated_at']


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = '__all__'

class ScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Schedule
        fields = '__all__'

class FavoriteRestaurantSerializer(serializers.ModelSerializer):
    class Meta:
        model = FavoriteRestaurant
        fields = '__all__'
        read_only_fields = ['user']

class FavoriteItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = FavoriteItem
        fields = '__all__'
        read_only_fields = ['user']