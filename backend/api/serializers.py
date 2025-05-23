# backend/api/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer as BaseTokenObtainPairSerializer
from .models import Order, OrderItem # Shto importet
from .models import (
    Address, CuisineType, Restaurant, OperatingHours, 
    MenuCategory, MenuItem, Review, DriverProfile # Shto DriverProfile
)

User = get_user_model()

# --- Serializers Ekzistues (User, Address) ---
class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        # Përfshijmë 'id' që të mund të përdoret si nested dhe për update
        fields = ('id', 'street', 'city', 'state_province', 'postal_code', 'country', 'is_default_shipping')
        # 'user' do të vendoset nga view
        # 'is_primary_location' mund të menaxhohet nga RestaurantSerializer

class UserDetailSerializer(serializers.ModelSerializer):
    """
    Serializer për të shfaqur detajet e plota të një përdoruesi.
    Përfshin adresat dhe profilin e shoferit (nëse është shofer).
    """
    addresses = AddressSerializer(many=True, read_only=True)
    full_name = serializers.CharField(read_only=True)
    driver_profile = serializers.SerializerMethodField() 

    class Meta:
        model = User
        fields = (
            'id', 'email', 'first_name', 'last_name', 'full_name', 'role', 
            'phone_number', 'bio', 'profile_picture', # Ndryshuar nga profile_picture_url_placeholder
            'is_staff', 'is_active', 'date_joined', 'addresses',
            'is_available_for_delivery',
            'driver_profile' 
        )
        read_only_fields = ('id', 'email', 'role', 'is_staff', 'date_joined', 'addresses', 'full_name', 'driver_profile')

    def get_driver_profile(self, obj):
        if obj.role == User.Role.DRIVER:
            try:
                profile = obj.driver_profile # Qasja te related_name
                return DriverProfileSerializer(profile).data
            except DriverProfile.DoesNotExist:
                return None
        return None

class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer për regjistrimin e përdoruesve të rinj.
    Kërkon konfirmimin e fjalëkalimit dhe lejon caktimin e rolit.
    """
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'}, min_length=6)
    password_confirm = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = (
            'id', 'email', 'first_name', 'last_name', 
            'password', 'password_confirm', 'role', 
            'phone_number', 'bio', 'profile_picture' # Ndryshuar nga profile_picture_url_placeholder
        )
    
    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Një përdorues me këtë email tashmë ekziston.")
        return value

    def validate(self, attrs):
        if attrs.get('password') != attrs.get('password_confirm'): # Përdor .get() për siguri
            raise serializers.ValidationError({"password_confirm": "Fjalëkalimet nuk përputhen."})
        attrs.pop('password_confirm', None)
        return attrs

    def create(self, validated_data):
        role_to_set = validated_data.pop('role', User.Role.CUSTOMER)
        # Sigurohemi që vetëm rolet e lejuara mund të vendosen gjatë regjistrimit publik
        # P.sh., mos lejo 'ADMIN' direkt nga forma e regjistrimit publik
        allowed_registration_roles = [User.Role.CUSTOMER, User.Role.RESTAURANT_OWNER, User.Role.DRIVER]
        if role_to_set not in allowed_registration_roles:
            role_to_set = User.Role.CUSTOMER # Default nëse roli i dhënë nuk lejohet

        user = User.objects.create_user(
            email=validated_data.pop('email'),
            password=validated_data.pop('password'),
            role=role_to_set,
            **validated_data 
        )
        return user

# --- Serializers të Rinj për Restorantin dhe Menunë ---

class CuisineTypeSerializer(serializers.ModelSerializer):
    """Serializer për Llojet e Kuzhinave."""
    class Meta:
        model = CuisineType
        fields = ('id', 'name', 'description')

class OperatingHoursSerializer(serializers.ModelSerializer):
    day_of_week_display = serializers.CharField(source='get_day_of_week_display', read_only=True)

    class Meta:
        model = OperatingHours
        fields = ('id', 'day_of_week', 'day_of_week_display', 'open_time', 'close_time', 'is_closed')
        # 'restaurant' do të lidhet nga view ose RestaurantSerializer

class MenuItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category = serializers.PrimaryKeyRelatedField(queryset=MenuCategory.objects.all(), write_only=False)

    class Meta:
        model = MenuItem
        fields = (
            'id', 'category', 'category_name', 'name', 'description', 
            'price', 'image', 'is_available' # Ndryshuar nga image_url_placeholder
        )
        # 'restaurant' do të lidhet automatikisht ose nga view

class MenuCategorySerializer(serializers.ModelSerializer):
    # Për të shfaqur artikujt brenda kategorisë (vetëm për lexim)
    menu_items = MenuItemSerializer(many=True, read_only=True) 

    class Meta:
        model = MenuCategory
        fields = ('id', 'name', 'description', 'display_order', 'menu_items')
        # 'restaurant' do të lidhet nga view ose RestaurantSerializer


# Serializer për listimin e restoranteve (më pak detaje)
class RestaurantListSerializer(serializers.ModelSerializer):
    """
    Serializer për listimin e restoranteve me më pak detaje.
    Përdoret për pamjen e listës së restoranteve.
    """
    cuisine_types = CuisineTypeSerializer(many=True, read_only=True)
    address_summary = serializers.StringRelatedField(source='address', read_only=True) 

    class Meta:
        model = Restaurant
        fields = (
            'id', 'name', 'main_image', 'cuisine_types', # Ndryshuar nga main_image_url_placeholder
            'average_rating', 'delivery_time_estimate', 'price_range',
            'address_summary', 
            'is_active', 'is_approved' 
        )

# Serializer për detajet e restorantit, krijim, dhe përditësim
class RestaurantDetailSerializer(serializers.ModelSerializer):
    """
    Serializer për shfaqjen e detajeve të plota të një restoranti,
    si dhe për krijimin dhe përditësimin e restoranteve.
    Lejon menaxhimin e adresës, orarit të punës dhe llojeve të kuzhinës.
    """
    owner = UserDetailSerializer(read_only=True) 
    owner_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role__in=[User.Role.RESTAURANT_OWNER, User.Role.ADMIN]), # Lejon adminin të jetë edhe pronar
        source='owner', 
        write_only=True, 
        required=True,
        allow_null=False
    )
    address = AddressSerializer(write_only=True)
    operating_hours = OperatingHoursSerializer(many=True, write_only=True, source='operatinghours_set') # Korrigjuar source

    cuisine_types = CuisineTypeSerializer(many=True, read_only=True) # Për të shfaqur në GET
    cuisine_type_ids = serializers.PrimaryKeyRelatedField(
        queryset=CuisineType.objects.all(), 
        many=True, 
        write_only=True, 
        source='cuisine_types', # Lidh me fushën 'cuisine_types' të modelit
        required=False
    )

    class Meta:
        model = Restaurant
        fields = [
            'id', 'owner', 'owner_id', 'name', 'description', 'phone_number', 
            'main_image', 'cuisine_types', 'cuisine_type_ids', # Ndryshuar nga main_image_url_placeholder
            'price_range', 'delivery_time_estimate', 'average_rating', 
            'is_approved', 'is_active', 'created_at', 'updated_at',
            'address', 'operating_hours' 
        ]
        read_only_fields = ['id', 'average_rating', 'created_at', 'updated_at', 'owner', 'cuisine_types']

    def create(self, validated_data):
        # 1. Ndaj të dhënat për lidhjet nested dhe many-to-many
        address_data = validated_data.pop('address', None)
        # Përdor çelësin e saktë 'operatinghours_set' për shkak të source='operatinghours_set'
        hours_data = validated_data.pop('operatinghours_set', None) 
        # cuisine_types_data vjen nga source='cuisine_types' i cuisine_type_ids
        cuisine_types_instances = validated_data.pop('cuisine_types', []) 

        # Debug: Shiko çfarë ka mbetur te validated_data para krijimit të Restaurant
        print("Validated data para krijimit të Restaurant:", validated_data)

        # 2. Krijo instancën kryesore Restaurant
        # validated_data tani duhet të përmbajë vetëm fushat direkte të Restaurant
        # (p.sh., name, description, owner (instancë), etj.)
        restaurant = Restaurant.objects.create(**validated_data)

        # 3. Krijo dhe lidh objektet nested (OneToOne si Address)
        if address_data:
            address_instance = Address.objects.create(**address_data)
            restaurant.address = address_instance
            restaurant.save() # Ruaj restorantin pasi të jetë lidhur adresa

        # 4. Krijo objektet nested (nga ForeignKey te Restaurant, si OperatingHours)
        if hours_data:
            for hour_entry in hours_data:
                OperatingHours.objects.create(restaurant=restaurant, **hour_entry)
        
        # 5. Vendos lidhjet ManyToMany (CuisineType)
        if cuisine_types_instances:
            restaurant.cuisine_types.set(cuisine_types_instances) # .set() trajton ruajtjen për M2M
            
        return restaurant

    def update(self, instance, validated_data):
        address_data = validated_data.pop('address', None)
        # Përdor çelësin e saktë 'operatinghours_set' edhe këtu nëse e ke source='operatinghours_set'
        hours_data = validated_data.pop('operatinghours_set', None) 
        cuisine_types_data = validated_data.pop('cuisine_types', None)

        # Përditëso fushat standarde
        instance = super().update(instance, validated_data)

        if address_data:
            if instance.address:
                address_serializer = AddressSerializer(instance.address, data=address_data, partial=True)
                if address_serializer.is_valid(raise_exception=True):
                    address_serializer.save()
            else:
                new_address = Address.objects.create(**address_data)
                instance.address = new_address
                # instance.save() # Ruaj instancën pasi të jetë caktuar adresa e re
        
        if hours_data is not None: # Lejon pastrimin e orarit nëse dërgohet array bosh
            instance.operatinghours_set.all().delete() # Fshij oraret e vjetra
            for hour_entry in hours_data:
                OperatingHours.objects.create(restaurant=instance, **hour_entry)
        
        if cuisine_types_data is not None: # Lejon pastrimin e llojeve të kuzhinës
            instance.cuisine_types.set(cuisine_types_data)
        
        instance.save() # Ruaj instancën në fund për të gjitha ndryshimet e mundshme
        return instance


class ReviewSerializer(serializers.ModelSerializer):
    user = UserDetailSerializer(read_only=True)
    # restaurant = RestaurantListSerializer(read_only=True) # Opsionale, mund të jetë e tepërt nëse është nested

    class Meta:
        model = Review
        fields = ['id', 'user', 'restaurant', 'rating', 'comment', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'restaurant', 'created_at', 'updated_at']
        # 'restaurant' do të merret nga URL (nested view)
        # 'user' do të merret nga request.user

    def validate_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError("Rating duhet të jetë ndërmjet 1 dhe 5.")
        return value

    def create(self, validated_data):
        # Kontrolli unique_together ('restaurant', 'user') do të bëhet nga databaza
        # por mund të shtosh një validim këtu nëse dëshiron një mesazh më miqësor.
        request = self.context.get('request')
        restaurant_pk = self.context.get('view').kwargs.get('restaurant_pk')
        
        if not request or not hasattr(request, "user"):
            raise serializers.ValidationError("Përdoruesi duhet të jetë i kyçur për të lënë një vlerësim.")
        
        if Review.objects.filter(restaurant_id=restaurant_pk, user=request.user).exists():
            raise serializers.ValidationError({"detail": "Ju tashmë keni lënë një vlerësim për këtë restorant."})

        # restaurant dhe user do të vendosen në perform_create të viewset-it
        return super().create(validated_data)


class DriverProfileSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    is_available_for_delivery = serializers.BooleanField(source='user.is_available_for_delivery', read_only=True) # Lexo nga User model

    class Meta:
        model = DriverProfile
        fields = ['user', 'user_email', 'vehicle_type', 'license_plate', 'is_available_for_delivery', 'created_at', 'updated_at']
        read_only_fields = ['user_email', 'is_available_for_delivery', 'created_at', 'updated_at']
        # 'user' do të jetë ID-ja e userit (shoferit) gjatë krijimit/përditësimit.
        # Bëjmë user writeable për të lejuar caktimin gjatë krijimit.
        # Por duhet të sigurohemi që useri i caktuar ka rolin DRIVER.
        extra_kwargs = {
            'user': {'queryset': User.objects.filter(role=User.Role.DRIVER)}
        }

    def validate_user(self, value):
        # Sigurohemi që useri ka rolin DRIVER
        if value.role != User.Role.DRIVER:
            raise serializers.ValidationError("Përdoruesi i zgjedhur duhet të ketë rolin 'DRIVER'.")
        # Sigurohemi që nuk ekziston tashmë një profil për këtë shofer (nëse nuk është update)
        # Kjo mbulohet nga OneToOneField, por mund të shtojmë një kontroll këtu për mesazh më të mirë.
        # Për update, this.instance.user do të jetë i njëjtë me value.
        if not self.instance and DriverProfile.objects.filter(user=value).exists():
             raise serializers.ValidationError("Ky shofer tashmë ka një profil.")
        return value


class CustomTokenObtainPairSerializer(BaseTokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        token['role'] = user.role
        token['first_name'] = user.first_name
        # token['full_name'] = user.full_name # Nëse e ke property
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        # self.user vendoset nga metoda validate e klasës prind
        user_detail_serializer = UserDetailSerializer(self.user)
        data['user'] = user_detail_serializer.data
        return data



class OrderItemSerializer(serializers.ModelSerializer):
    # Mund të shfaqësh më shumë detaje për menu_item nëse dëshiron (read-only)
    # menu_item_details = MenuItemSerializer(source='menu_item', read_only=True) # Opsionale

    class Meta:
        model = OrderItem
        fields = ('id', 'menu_item', 'item_name_at_purchase', 'item_price_at_purchase', 'quantity', 'subtotal')
        read_only_fields = ('id', 'item_name_at_purchase', 'item_price_at_purchase', 'subtotal')
        # 'menu_item' do të jetë ID kur dërgohet, 'order' lidhet automatikisht

class OrderListSerializer(serializers.ModelSerializer): # Për listim (më pak detaje)
    customer_email = serializers.EmailField(source='customer.email', read_only=True)
    restaurant_name = serializers.CharField(source='restaurant.name', read_only=True)
    driver_name = serializers.CharField(source='driver.full_name', read_only=True, allow_null=True) # Përdor property full_name

    class Meta:
        model = Order
        fields = (
            'id', 'customer_email', 'restaurant_name', 'driver_name', 'order_total', 
            'status', 'payment_method', 'payment_status', 
            'created_at', 'estimated_delivery_time'
        )

class OrderDetailSerializer(serializers.ModelSerializer):
    customer = UserDetailSerializer(read_only=True) # Shfaq detajet e plota të klientit
    restaurant = RestaurantListSerializer(read_only=True) # Shfaq detajet bazike të restorantit
    driver = UserDetailSerializer(read_only=True, allow_null=True) # Shfaq detajet e shoferit
    items = OrderItemSerializer(many=True, read_only=False) # Lejon krijimin e items bashkë me porosinë

    # Fushat që dërgohen nga frontend-i për të krijuar porosinë
    # Backend-i do të kalkulojë totalin dhe do të marrë adresën e saktë
    delivery_address_id = serializers.PrimaryKeyRelatedField(
        queryset=Address.objects.all(), write_only=True, source='delivery_address_street', # Burim i çuditshëm, do ta rregullojmë te create
        help_text="ID e adresës së zgjedhur nga përdoruesi"
    )
    # restaurant_id do të jetë në URL për krijim nga klienti, ose në payload nëse krijohet nga admini
    restaurant_id = serializers.PrimaryKeyRelatedField(
        queryset=Restaurant.objects.filter(is_active=True, is_approved=True), 
        write_only=True, source='restaurant', required=False # Required false nëse vjen nga URL
    )


    class Meta:
        model = Order
        fields = (
            'id', 'customer', 'restaurant', 'restaurant_id', 'driver', 'items', 
            'delivery_address_id', # Për input gjatë krijimit
            'delivery_address_street', 'delivery_address_city', 'delivery_address_postal_code', 
            'delivery_address_notes', 'order_total', 'status', 
            'payment_method', 'payment_status', 'payment_intent_id',
            'estimated_delivery_time', 'actual_delivery_time', 'created_at', 'updated_at'
        )
        read_only_fields = (
            'id', 'customer', 'restaurant', 'driver', 'order_total', 'payment_intent_id',
            'actual_delivery_time', 'created_at', 'updated_at',
            # Statusi dhe estimated_delivery_time mund të jenë read_only për klientin, por të modifikueshme nga restoranti/admini
        )
        # 'delivery_address_street', 'city', 'postal_code' do të jenë read_only pasi të krijohen,
        # pasi ato kopjohen nga Address me ID-në e dhënë.

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        # Adresa do të merret nga delivery_address_id
        address_id_for_order = validated_data.pop('delivery_address_street') # Ky ishte source i delivery_address_id
        try:
            address_instance = Address.objects.get(id=address_id_for_order.id, user=self.context['request'].user)
        except Address.DoesNotExist:
            raise serializers.ValidationError("Adresa e zgjedhur nuk është valide ose nuk ju përket juve.")

        # Restoranti mund të vijë nga restaurant_id ose nga URL (nëse është nested view)
        # Për momentin, supozojmë se vjen nga restaurant_id në payload
        restaurant_instance = validated_data.pop('restaurant')

        # Kopjo detajet e adresës te porosia
        validated_data['delivery_address_street'] = address_instance.street
        validated_data['delivery_address_city'] = address_instance.city
        validated_data['delivery_address_postal_code'] = address_instance.postal_code
        # validated_data['delivery_address_country'] = address_instance.country # Nëse e ke këtë fushë te Order

        # Kalkulo totalin e porosisë bazuar te artikujt
        calculated_order_total = 0
        for item_data in items_data:
            menu_item = item_data.get('menu_item')
            quantity = item_data.get('quantity')
            if not menu_item or not quantity or not menu_item.is_available:
                raise serializers.ValidationError(f"Artikulli '{menu_item.name if menu_item else 'i panjohur'}' nuk është i disponueshëm ose sasia është invalide.")
            calculated_order_total += menu_item.price * quantity
        
        # Shto tarifat (nëse ka)
        # delivery_fee = 2.00 # Shembull
        # calculated_order_total += delivery_fee
        # validated_data['delivery_fee'] = delivery_fee

        validated_data['order_total'] = calculated_order_total
        
        # Përdoruesi që bën kërkesën është klienti
        order = Order.objects.create(customer=self.context['request'].user, restaurant=restaurant_instance, **validated_data)

        for item_data in items_data:
            menu_item_instance = item_data.get('menu_item')
            OrderItem.objects.create(
                order=order, 
                menu_item=menu_item_instance,
                item_name_at_purchase=menu_item_instance.name,
                item_price_at_purchase=menu_item_instance.price,
                quantity=item_data.get('quantity')
            )
        return order

    def update(self, instance, validated_data):
        # Zakonisht klientët nuk e modifikojnë porosinë pasi është bërë.
        # Restoranti/Admini mund të modifikojnë statusin, shoferin, etj.
        # Kjo kërkon logjikë më të detajuar dhe leje specifike.
        # Për momentin, lejojmë vetëm modifikimin e statusit nga përdorues të autorizuar (restoranti/admini).
        
        allowed_fields_for_update = ['status', 'driver', 'estimated_delivery_time', 'actual_delivery_time', 'payment_status']
        
        # Heqim fushat që nuk duhet të modifikohen nga useri (klienti)
        # Kjo duhet të forcohet edhe nga lejet.
        if not (self.context['request'].user.is_staff or \
                (instance.restaurant and instance.restaurant.owner == self.context['request'].user) or \
                (instance.driver and instance.driver == self.request.user and 'status' in validated_data)): # Shoferi mund të ndryshojë vetëm statusin
            
            for field in list(validated_data.keys()):
                if field not in ['delivery_address_notes']: # Klienti mund të modifikojë vetëm shënimet e dërgesës (shembull)
                    validated_data.pop(field, None)
        
        # Logjika për items (OrderItem) update është më komplekse dhe zakonisht nuk bëhet direkt këtu.
        # Mund të kesh endpoint-e të veçanta për të modifikuar artikujt e një porosie nëse lejohet.
        validated_data.pop('items', None) # Nuk lejojmë modifikimin e items direkt këtu për momentin

        return super().update(instance, validated_data)