from django.contrib import admin
from .models import (
    User,
    Address,
    CuisineType,
    Restaurant,
    OperatingHours,
    MenuCategory,
    MenuItem,
    Order,
    OrderItem,
    Review,
    ReviewReply,
    DriverProfile,
    PageViewLog
)

# Regjistrimi i thjeshtë i modeleve
admin.site.register(User)
admin.site.register(Address)
admin.site.register(CuisineType)
admin.site.register(Restaurant)
admin.site.register(OperatingHours)
admin.site.register(MenuCategory)
admin.site.register(MenuItem)
admin.site.register(Order)
admin.site.register(OrderItem)
admin.site.register(Review)
admin.site.register(ReviewReply)
admin.site.register(DriverProfile)
admin.site.register(PageViewLog)

# Shembull se si mund të personalizoni shfaqjen për një model (opsionale)
# class RestaurantAdmin(admin.ModelAdmin):
#     list_display = ('name', 'owner', 'is_active', 'is_approved', 'average_rating')
#     list_filter = ('is_active', 'is_approved', 'cuisine_types')
#     search_fields = ('name', 'owner__email', 'description')
#     # Për fusha ManyToMany, mund të përdorni filter_horizontal ose filter_vertical
#     filter_horizontal = ('cuisine_types',) 

# admin.site.register(Restaurant, RestaurantAdmin) # Nëse do të përdornit këtë, hiqni admin.site.register(Restaurant) më lart

# class OrderAdmin(admin.ModelAdmin):
#     list_display = ('id', 'customer', 'restaurant', 'status', 'order_total', 'created_at')
#     list_filter = ('status', 'payment_status', 'restaurant')
#     search_fields = ('id', 'customer__email', 'restaurant__name')
#     date_hierarchy = 'created_at'
#     # Për të shfaqur OrderItems inline brenda Order (opsionale)
#     # class OrderItemInline(admin.TabularInline):
#     #     model = OrderItem
#     #     extra = 0 # Sa forma boshe të shfaqen
#     # inlines = [OrderItemInline]

# admin.site.register(Order, OrderAdmin) # Nëse do të përdornit këtë, hiqni admin.site.register(Order) më lart
