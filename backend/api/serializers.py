# backend/api/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer as BaseTokenObtainPairSerializer
from rest_framework_simplejwt.exceptions import AuthenticationFailed # Importo këtë
from .models import (
    Address, CuisineType, Restaurant, OperatingHours, 
    MenuCategory, MenuItem, Review, DriverProfile, ReviewReply, # Shto DriverProfile dhe ReviewReply
    Order, OrderItem, # Shto Order, OrderItem
    Cart, CartItem # SHTO MODELET E REJA
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

class UserAdminManagementSerializer(serializers.ModelSerializer):
    """Serializer për adminin për të menaxhuar përdoruesit. Lejon modifikimin e rolit, statusit, etj."""
    full_name = serializers.CharField(read_only=True)
    # Fusha 'password' mund të shtohet këtu si write_only=True nëse admini do të vendosë fjalëkalim gjatë krijimit
    # password = serializers.CharField(write_only=True, required=False, allow_blank=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = (
            'id', 'email', 'first_name', 'last_name', 'full_name', 'role',
            'phone_number', 'bio', # profile_picture trajtohet me ImageField nëse admini e ngarkon
            'is_staff', 'is_active', 'date_joined', 'is_available_for_delivery'
            # 'password' # Shtoje këtu nëse e definon më lart
        )
        read_only_fields = ('id', 'email', 'date_joined', 'full_name')

    def create(self, validated_data):
        # Logjika për krijimin e userit nga admini
        # Nëse 'password' është në validated_data, përdore atë, përndryshe gjenero një të rastësishëm ose kërko reset
        
        # Email duhet të jetë unik dhe i validuar, por User.objects.create_user e trajton këtë
        # dhe serializeri do të bëjë validimin e email-it nëse ka një validator të tillë.
        # Për siguri, mund të kontrollojmë këtu ose të mbështetemi te validimi i modelit/serializerit.
        email = validated_data.get('email')
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError({"email": "Një përdorues me këtë email tashmë ekziston."})

        password = validated_data.pop('password', None) # Hiq passwordin para se ta kalosh te create_user
        
        # Sigurohu që roli i dhënë është valid
        role = validated_data.get('role', User.Role.CUSTOMER) # Default nëse nuk jepet
        if role not in User.Role.values:
            raise serializers.ValidationError({"role": f"Roli '{role}' nuk është i vlefshëm."})

        user = User.objects.create_user(
            email=email, 
            password=password, # UserManager.create_user do ta bëjë hash
            **validated_data # Kalo fushat e mbetura
        )
        return user

    def update(self, instance, validated_data):
        # Sigurohu që roli ADMIN të mos hiqet nga superuseri i fundit
        if instance.is_superuser and 'role' in validated_data and validated_data['role'] != User.Role.ADMIN:
            # Kontrollo nëse ky është superuseri i vetëm aktiv me rolin ADMIN
            if User.objects.filter(is_superuser=True, role=User.Role.ADMIN, is_active=True).count() <= 1 and \
               instance.pk == User.objects.filter(is_superuser=True, role=User.Role.ADMIN, is_active=True).first().pk:
                raise serializers.ValidationError(
                    {"role": "Nuk mund të hiqni rolin Admin nga superuser-i i vetëm aktiv."}
                )
        
        # Admini nuk duhet të modifikojë fjalëkalimin këtu direkt; duhet të përdorë një action të dedikuar ose formën e admin panelit
        validated_data.pop('password', None)
        
        # Email nuk duhet të modifikohet pas krijimit përmes këtij serializeri (është read_only_fields)
        # por nëse do të lejohej, duhet të sigurohemi që nuk bëhet duplikat.
        # if 'email' in validated_data and instance.email != validated_data['email']:
        #     if User.objects.filter(email__iexact=validated_data['email']).exclude(pk=instance.pk).exists():
        #         raise serializers.ValidationError({"email": "Ky email tashmë përdoret nga një tjetër përdorues."})

        return super().update(instance, validated_data)

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
    restaurant_id = serializers.IntegerField(source='restaurant.id', read_only=True) # SHTO KËTË

    class Meta:
        model = MenuItem
        fields = (
            'id', 'category', 'category_name', 'restaurant_id', # SHTO restaurant_id
            'name', 'description', 
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
    main_image_url = serializers.ImageField(source='main_image', read_only=True, use_url=True) # Kthe URL-në

    class Meta:
        model = Restaurant
        fields = (
            'id', 'name', 
            'main_image_url', # NDRESHA KETU, perdor emrin e ri te fushes
            'cuisine_types', 
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
    owner_details = UserDetailSerializer(source='owner', read_only=True)
    owner_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role__in=[User.Role.RESTAURANT_OWNER, User.Role.ADMIN]),
        source='owner',
        write_only=True,
        required=False, # E bën jo të detyrueshme për update, por e trajtojmë te create
        allow_null=True # Lejon adminin ta lërë bosh nëse do, ose të mos e dërgojë fare
    )
    address_details = AddressSerializer(source='address', read_only=True)
    address = AddressSerializer(write_only=True, required=False) # Për input gjatë create/update

    operating_hours_details = OperatingHoursSerializer(source='operating_hours', many=True, read_only=True)
    operating_hours = OperatingHoursSerializer(many=True, write_only=True, required=False)

    cuisine_types_details = CuisineTypeSerializer(source='cuisine_types', many=True, read_only=True)
    cuisine_type_ids = serializers.PrimaryKeyRelatedField(
        queryset=CuisineType.objects.all(),
        many=True,
        write_only=True,
        source='cuisine_types',
        required=False
    )
    main_image_url = serializers.ImageField(source='main_image', read_only=True)

    class Meta:
        model = Restaurant
        fields = [
            'id', 'owner_details', 'owner_id', 'name', 'description', 'phone_number',
            'main_image', 'main_image_url', 
            'cuisine_types_details', 'cuisine_type_ids',
            'price_range', 'delivery_time_estimate', 'average_rating',
            'is_approved', 'is_active', 'created_at', 'updated_at',
            'address_details', 'address', 
            'operating_hours_details', 'operating_hours'
        ]
        read_only_fields = ['id', 'average_rating', 'created_at', 'updated_at', 'owner_details', 'address_details', 'cuisine_types_details', 'operating_hours_details', 'main_image_url']
        extra_kwargs = {
            'main_image': {'write_only': True, 'required': False, 'allow_null': True} # Lejo të jetë null
        }

    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user

        address_data = validated_data.pop('address', None)
        hours_data_list = validated_data.pop('operating_hours', [])
        cuisine_type_instances = validated_data.pop('cuisine_types', [])
        main_image_file = validated_data.pop('main_image', None)

        owner_instance = validated_data.pop('owner', None) # Kjo vjen nga source='owner' i owner_id
        
        if user.is_staff:
            if not owner_instance: # Admini duhet të specifikojë owner_id për restorante të reja
                raise serializers.ValidationError({"owner_id": "Admini duhet të specifikojë një pronar (owner_id) kur krijon restorant."})
            # Sigurohu që owner_instance ka rolin e duhur
            if owner_instance.role not in [User.Role.RESTAURANT_OWNER, User.Role.ADMIN]:
                raise serializers.ValidationError({"owner_id": "Pronari i caktuar duhet të ketë rolin RESTAURANT_OWNER ose ADMIN."})
            is_approved = validated_data.pop('is_approved', True) # Admini mund ta aprovojë direkt
            is_active = validated_data.pop('is_active', True)   # Dhe ta bëjë aktiv
        elif user.role == User.Role.RESTAURANT_OWNER:
            owner_instance = user # Pronari krijon për vete
            is_approved = False
            is_active = False
            # Hiq këto fusha nga validated_data nëse pronari nuk lejohet t'i vendosë gjatë krijimit
            validated_data.pop('is_approved', None) 
            validated_data.pop('is_active', None)
        else:
            # Kjo nuk duhet të ndodhë nëse lejet e view-it janë të sakta, por si masë sigurie.
            raise serializers.ValidationError("Përdoruesi aktual nuk ka leje të krijojë restorant ose roli është i pasaktë.")
        
        restaurant = Restaurant.objects.create(
            owner=owner_instance, 
            is_approved=is_approved, 
            is_active=is_active,
            **validated_data
        )

        if main_image_file:
            restaurant.main_image = main_image_file
        
        if address_data:
            # Sigurohemi që `user` i kaluar te Address.objects.create është useri pronar i restorantit
            address_data_user = owner_instance # Adresa duhet të lidhet me pronarin e restorantit
            address_instance = Address.objects.create(user=address_data_user, **address_data)
            restaurant.address = address_instance
        
        for hour_entry in hours_data_list:
            OperatingHours.objects.create(restaurant=restaurant, **hour_entry)
        
        if cuisine_type_instances:
            restaurant.cuisine_types.set(cuisine_type_instances)
        
        restaurant.save()
        return restaurant

    def update(self, instance, validated_data):
        request = self.context.get('request')
        user = request.user

        address_data = validated_data.pop('address', None)
        hours_data_list = validated_data.pop('operating_hours', None)
        cuisine_type_instances = validated_data.pop('cuisine_types', None)
        main_image_file = validated_data.pop('main_image', None)

        if user.is_staff:
            # Admini mund të ndryshojë pronarin
            owner_instance_from_payload = validated_data.pop('owner', None) # Kjo vjen nga owner_id
            if owner_instance_from_payload:
                if owner_instance_from_payload.role not in [User.Role.RESTAURANT_OWNER, User.Role.ADMIN]:
                     raise serializers.ValidationError({"owner_id": "Pronari i ri i caktuar duhet të ketë rolin RESTAURANT_OWNER ose ADMIN."})
                instance.owner = owner_instance_from_payload
            
            # Admini mund të ndryshojë statusin e aprovimit dhe aktivizimit
            instance.is_approved = validated_data.get('is_approved', instance.is_approved)
            instance.is_active = validated_data.get('is_active', instance.is_active)
        else: # Pronari i restorantit
            # Pronari nuk mund të ndryshojë owner-in ose is_approved
            validated_data.pop('owner', None) 
            validated_data.pop('is_approved', None)
            
            # Për is_active, pronari mund ta ndryshojë vetëm nëse restoranti është i aprovuar.
            # Kjo logjikë është më mirë të trajtohet nga një action specifik si `toggle_active_status`
            # Por nëse duam ta lejojmë këtu:
            if 'is_active' in validated_data:
                new_active_status = validated_data.get('is_active')
                if new_active_status and not instance.is_approved:
                    raise serializers.ValidationError({"is_active": "Restoranti duhet të jetë i aprovuar nga administratori para se të mund të aktivizohet."})
                instance.is_active = new_active_status
            else:
                # Nëse 'is_active' nuk është në payload, mos e ndrysho
                validated_data.pop('is_active', None)


        if main_image_file is not None: # Nëse një skedar i ri është ngarkuar
            instance.main_image = main_image_file
        elif 'main_image' in self.initial_data and self.initial_data['main_image'] is None:
             # Nëse frontend-i dërgon main_image: null (ose një fushë e veçantë si clear_main_image: true)
             # Kjo do të thotë që useri dëshiron ta heqë imazhin.
            if instance.main_image: # Kontrollo nëse ka një imazh ekzistues para se të tentosh ta fshish
                instance.main_image.delete(save=False) # Fshij skedarin nga storage
            instance.main_image = None # Vendos fushën në None


        # Përditëso fushat e tjera standarde të Restaurant
        # Fushat si 'name', 'description', 'phone_number', 'price_range', 'delivery_time_estimate'
        for attr, value in validated_data.items():
            # Sigurohu që po vendos vetëm fushat që i përkasin direkt modelit Restaurant
            # dhe nuk janë trajtuar tashmë (si owner, is_approved, is_active)
            if hasattr(instance, attr) and attr not in ['owner', 'is_approved', 'is_active', 'main_image']:
                setattr(instance, attr, value)

        if address_data:
            if instance.address:
                # Përditëso adresën ekzistuese, duke siguruar që useri i adresës mbetet pronari i restorantit
                address_serializer = AddressSerializer(instance.address, data=address_data, partial=True, context=self.context)
                if address_serializer.is_valid(raise_exception=True):
                    # Sigurohu që useri i adresës nuk ndryshohet aksidentalisht nëse nuk është admin
                    # Ose, më mirë, sigurohu që adresa i përket pronarit aktual të restorantit
                    # Kjo duhet të jetë e garantuar nga logjika e lejeve ose duke mos e lejuar ndryshimin e userit të adresës.
                    # Për thjeshtësi, këtu supozojmë se AddressSerializer nuk lejon ndryshimin e 'user' nga jo-adminët.
                    address_serializer.save(user=instance.owner) # Forco userin e adresës të jetë pronari
            else:
                # Krijo një adresë të re, duke e lidhur me pronarin e restorantit
                new_address = Address.objects.create(user=instance.owner, **address_data)
                instance.address = new_address
        
        if hours_data_list is not None: # Lejon pastrimin e orarit nëse dërgohet array bosh
            instance.operating_hours.all().delete() # Fshij oraret e vjetra
            for hour_entry in hours_data_list:
                OperatingHours.objects.create(restaurant=instance, **hour_entry)
        
        if cuisine_type_instances is not None: # Lejon pastrimin e llojeve të kuzhinës
            instance.cuisine_types.set(cuisine_type_instances)
        
        instance.save() # Ruaj instancën në fund për të gjitha ndryshimet e mundshme
        return instance


class ReviewReplySerializer(serializers.ModelSerializer):
    user = UserDetailSerializer(read_only=True) 

    class Meta:
        model = ReviewReply
        fields = ['id', 'user', 'text', 'created_at', 'updated_at'] 
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

class ReviewSerializer(serializers.ModelSerializer):
    user = UserDetailSerializer(read_only=True)
    replies = ReviewReplySerializer(many=True, read_only=True) 
    # restaurant = RestaurantListSerializer(read_only=True) # Opsionale, mund të jetë e tepërt nëse është nested

    class Meta:
        model = Review
        fields = ['id', 'user', 'restaurant', 'rating', 'comment', 'created_at', 'updated_at', 'replies']
        read_only_fields = ['id', 'user', 'restaurant', 'created_at', 'updated_at', 'replies']
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
        # Tento të marrësh email dhe password
        email = attrs.get('email')
        password = attrs.get('password')

        if not email or not password:
            # Ky rast zakonisht nuk duhet të ndodhë pasi DRF i bën fushat required
            # por si masë sigurie
            raise serializers.ValidationError(
                {"detail": "Email dhe fjalëkalimi janë të detyrueshëm."},
                code="authorization" # Mund të shtosh një kod gabimi
            )
        
        # Printo për debugim vetëm nëse ke probleme
        # print(f"CustomTokenObtainPairSerializer attempting to validate attrs: {attrs}")

        try:
            # super().validate(attrs) do të thërrasë authenticate()
            # dhe do të hedhë AuthenticationFailed nëse kredencialet janë të gabuara
            # ose useri nuk është aktiv.
            data = super().validate(attrs)
        except AuthenticationFailed as e:
            # Kap AuthenticationFailed dhe rihidhe për t'u siguruar që DRF e trajton si JSON
            # print(f"AuthenticationFailed in CustomTokenObtainPairSerializer: {str(e.detail)}")
            raise AuthenticationFailed(e.detail, e.status_code if hasattr(e, 'status_code') else 'invalid_credentials')
        except Exception as e:
            # Për gabime të tjera të papritura gjatë validimit të prindit
            # print(f"Unexpected error during super().validate in CustomTokenObtainPairSerializer: {e}")
            # Kthe një gabim të përgjithshëm, por sigurohu që është ValidationError ose i ngjashëm
            raise serializers.ValidationError(
                {"detail": "Gabim i papritur gjatë procesit të login."},
                code="server_error"
            )

        # Në këtë pikë, self.user duhet të jetë vendosur nga super().validate()
        if not hasattr(self, 'user') or not self.user:
            # Ky është një rast i pazakontë nëse super().validate nuk ka hedhur gabim
            # print("CRITICAL: User object not set on serializer after successful super().validate()")
            raise AuthenticationFailed( # Përdor AuthenticationFailed për konsistencë
                {"detail": "Konfigurim i gabuar i autentikimit."}, 
                code="authentication_setup_error"
            )

        # Krijo tokenat (refresh dhe access)
        # refresh = self.get_token(self.user) # Kjo thirrje është tashmë bërë nga super().validate() dhe rezultati është te data
        # data['refresh'] = str(refresh)
        # data['access'] = str(refresh.access_token)
        # Linjat e mësipërme janë të sakta, por 'data' nga super().validate() tashmë përmban 'refresh' dhe 'access'
        # kështu që nuk ka nevojë t'i gjenerojmë përsëri, vetëm t'i shtojmë fushat tona.

        # Shto detajet e plota të përdoruesit
        # Sigurohu që context kalohet nëse UserDetailSerializer e pret (p.sh., për HyperlinkedRelatedField ose SerializerMethodField që përdorin request)
        user_serializer_context = {}
        if self.context and 'request' in self.context: # Kontrollo nëse context ekziston dhe ka 'request'
            user_serializer_context = {'request': self.context.get('request')}
        
        data['user'] = UserDetailSerializer(self.user, context=user_serializer_context).data
        
        # print(f"CustomTokenObtainPairSerializer validate data to return: {data}")
        return data

# === SERIALIZERS PËR SHPORTËN ===
class CartItemSerializer(serializers.ModelSerializer):
    menu_item_details = MenuItemSerializer(source='menu_item', read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = ('id', 'menu_item', 'menu_item_details', 'quantity', 'subtotal', 'added_at')
        read_only_fields = ('id', 'menu_item_details', 'subtotal', 'added_at')
        # 'menu_item' do të jetë ID kur krijohet/përditësohet (nga payload-i)
        # 'cart' do të lidhet automatikisht

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    restaurant_details = RestaurantListSerializer(source='restaurant', read_only=True)

    class Meta:
        model = Cart
        fields = ('id', 'user', 'restaurant', 'restaurant_details', 'items', 'total_amount', 'created_at', 'updated_at')
        read_only_fields = ('id', 'user', 'total_amount', 'created_at', 'updated_at', 'restaurant_details')
        # 'restaurant' ID mund të jetë writeable nëse lejon krijimin e shportës me restorant të caktuar
        # Përndryshe, do të caktohet nga artikulli i parë i shtuar.
# === FUNDI I SERIALIZERS PËR SHPORTËN ===

class OrderItemSerializer(serializers.ModelSerializer):
    # Mund të shfaqësh më shumë detaje për menu_item nëse dëshiron (read-only)
    menu_item_details = MenuItemSerializer(source='menu_item', read_only=True, required=False) # Opsionale

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
        queryset=Address.objects.all(), write_only=True, source='delivery_address', # Ndrysho source
        help_text="ID e adresës së zgjedhur nga përdoruesi"
    )
    # restaurant_id do të jetë në URL për krijim nga klienti, ose në payload nëse krijohet nga admini
    restaurant_id = serializers.PrimaryKeyRelatedField(
        queryset=Restaurant.objects.filter(is_active=True, is_approved=True), 
        write_only=True, source='restaurant', 
        help_text="ID e restorantit nga i cili porositet" # Required false nëse vjen nga URL
    )


    class Meta:
        model = Order
        fields = (
            'id', 'customer', 'restaurant', 'restaurant_id', 'driver', 'items', 
            'delivery_address_id', # Për input gjatë krijimit
            'delivery_address_street', 'delivery_address_city', 'delivery_address_postal_code', 
            'delivery_address_notes', 
            'order_total', 'sub_total', 'delivery_fee', # SHTO sub_total, delivery_fee
            'status', 
            'payment_method', 'payment_status', 'payment_intent_id',
            'estimated_delivery_time', 'actual_delivery_time', 
            'confirmed_at', 'preparation_started_at', 'ready_for_pickup_at', 'picked_up_by_driver_at', # SHTO kohët
            'created_at', 'updated_at'
        )
        read_only_fields = (
            'id', 'customer', 'restaurant', 'driver', 
            'delivery_address_street', 'delivery_address_city', 'delivery_address_postal_code',
            'order_total', 'sub_total', 'delivery_fee', # SHTO këto
            'payment_intent_id',
            'actual_delivery_time', 'created_at', 'updated_at',
            'confirmed_at', 'preparation_started_at', 'ready_for_pickup_at', 'picked_up_by_driver_at' # SHTO këto
            # Statusi dhe estimated_delivery_time mund të jenë read_only për klientin, por të modifikueshme nga restoranti/admini
        )
        # 'delivery_address_street', 'city', 'postal_code' do të jenë read_only pasi të krijohen,
        # pasi ato kopjohen nga Address me ID-në e dhënë.

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        # Adresa do të merret nga delivery_address_id
        address_instance = validated_data.pop('delivery_address') # Ky ishte source i delivery_address_id
        
        # Sigurohu që adresa i përket përdoruesit të kyçur
        if address_instance.user != self.context['request'].user:
            raise serializers.ValidationError("Adresa e zgjedhur nuk ju përket juve.")

        # Restoranti mund të vijë nga restaurant_id ose nga URL (nëse është nested view)
        # Për momentin, supozojmë se vjen nga restaurant_id në payload
        restaurant_instance = validated_data.pop('restaurant')

        # Kopjo detajet e adresës te porosia
        validated_data['delivery_address_street'] = address_instance.street
        validated_data['delivery_address_city'] = address_instance.city
        validated_data['delivery_address_postal_code'] = address_instance.postal_code
        # validated_data['delivery_address_country'] = address_instance.country # Nëse e ke këtë fushë te Order

        # Kalkulo totalin e porosisë bazuar te artikujt
        calculated_sub_total = 0
        for item_data in items_data:
            menu_item = item_data.get('menu_item')
            quantity = item_data.get('quantity')
            if not menu_item or not quantity or not menu_item.is_available:
                raise serializers.ValidationError(f"Artikulli '{menu_item.name if menu_item else 'i panjohur'}' nuk është i disponueshëm ose sasia është invalide.")
            if menu_item.restaurant != restaurant_instance:
                raise serializers.ValidationError(f"Artikulli '{menu_item.name}' nuk i përket restorantit të zgjedhur.")
            calculated_sub_total += menu_item.price * quantity
        
        # Shto tarifat (nëse ka)
        delivery_fee_value = 2.00 # Shembull: tarifa e dërgesës mund të vijë nga restoranti ose të jetë fikse
        # validated_data['delivery_fee'] = delivery_fee

        validated_data['sub_total'] = calculated_sub_total
        validated_data['delivery_fee'] = delivery_fee_value
        validated_data['order_total'] = calculated_sub_total + delivery_fee_value
        
        # Përdoruesi që bën kërkesën është klienti
        order = Order.objects.create(
            customer=self.context['request'].user, 
            restaurant=restaurant_instance, 
            **validated_data
        )

        for item_data in items_data:
            menu_item_instance = item_data.get('menu_item')
            OrderItem.objects.create(
                order=order, 
                menu_item=menu_item_instance,
                item_name_at_purchase=menu_item_instance.name,
                item_price_at_purchase=menu_item_instance.price,
                quantity=item_data.get('quantity')
            )
        
        # Pastro shportën e përdoruesit pas krijimit të porosisë
        Cart.objects.filter(user=self.context['request'].user).delete()
        
        return order

    def update(self, instance, validated_data):
        # Lejo modifikimin vetëm të disa fushave dhe vetëm nga përdorues të autorizuar
        request_user = self.context['request'].user
        allowed_to_update = False
        is_driver_updating_status = False

        if request_user.is_staff: # Admin
            allowed_to_update = True
        elif instance.restaurant and request_user == instance.restaurant.owner: # Pronari i restorantit
            allowed_to_update = True
        elif instance.driver and request_user == instance.driver: # Shoferi i caktuar
            # Shoferi mund të modifikojë vetëm statusin dhe vetëm nëse është ON_THE_WAY, DELIVERED, FAILED_DELIVERY
            if 'status' in validated_data and validated_data['status'] in [
                Order.OrderStatus.ON_THE_WAY, Order.OrderStatus.DELIVERED, Order.OrderStatus.FAILED_DELIVERY
            ]:
                allowed_to_update = True
                is_driver_updating_status = True
            else: # Nëse shoferi tenton të modifikojë diçka tjetër ose një status të palejuar
                # Lejo vetëm modifikimin e statusit nga shoferi
                non_status_fields = {k: v for k, v in validated_data.items() if k != 'status'}
                if non_status_fields:
                    raise serializers.ValidationError("Shoferët mund të modifikojnë vetëm statusin e dërgesës.")
                if 'status' in validated_data: # Këtu statusi nuk është një nga ato të lejuarat
                     raise serializers.ValidationError(f"Statusi '{validated_data['status']}' nuk lejohet të vendoset nga shoferi.")

        if not allowed_to_update:
            # Nëse nuk është asnjë nga rolet e mësipërme, ose shoferi po tenton të modifikojë fusha të palejuara
            raise serializers.ValidationError("Nuk keni leje të modifikoni këtë porosi ose këto fusha.")

        # Heq fushat që nuk duhet të modifikohen kurrë pas krijimit, ose nga role specifike
        validated_data.pop('items', None) # Items nuk modifikohen kurrë pas krijimit
        validated_data.pop('delivery_address_id', None) # Adresa nuk modifikohet
        validated_data.pop('restaurant_id', None) # Restoranti nuk modifikohet

        # Nëse është shofer që po modifikon statusin, lejo vetëm fushën 'status'
        if is_driver_updating_status:
            status_to_set = validated_data.get('status')
            validated_data.clear() # Hiq gjithçka tjetër
            validated_data['status'] = status_to_set
        
        return super().update(instance, validated_data)