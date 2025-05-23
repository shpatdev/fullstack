# backend/api/models.py
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.conf import settings # Për AUTH_USER_MODEL te ForeignKey
from django.core.validators import MinValueValidator, MaxValueValidator

class UserManager(BaseUserManager):
    """Menaxher i personalizuar për modelin User."""

    def create_user(self, email, password=None, **extra_fields):
        """Krijon dhe ruan një User me email dhe fjalëkalim."""
        if not email:
            raise ValueError('Përdoruesit duhet të kenë një adresë email')
        email = self.normalize_email(email)
        # first_name, last_name, etj., merren nga extra_fields
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """Krijon dhe ruan një superuser me email dhe fjalëkalim."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', User.Role.ADMIN) # Cakto rolin Admin për superuser

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser duhet të ketë is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser duhet të ketë is_superuser=True.')
        
        # Sigurohu që REQUIRED_FIELDS (first_name, last_name) janë dhënë
        # Kjo zakonisht trajtohet nga komanda createsuperuser, por mund të shtosh kontrolle këtu
        # if not extra_fields.get('first_name'):
        #     raise ValueError('Superuser duhet të ketë first_name.')
        # if not extra_fields.get('last_name'):
        #     raise ValueError('Superuser duhet të ketë last_name.')

        return self.create_user(email, password, **extra_fields)

class User(AbstractUser):
    """Modeli i personalizuar i përdoruesit."""
    class Role(models.TextChoices):
        ADMIN = 'ADMIN', 'Admin'
        CUSTOMER = 'CUSTOMER', 'Customer'
        RESTAURANT_OWNER = 'RESTAURANT_OWNER', 'Restaurant Owner'
        DRIVER = 'DRIVER', 'Driver'

    username = None  # Heqim username, do përdorim email për login
    email = models.EmailField(unique=True, help_text='Adresa e email-it, përdoret për login.')
    
    
    # first_name dhe last_name trashëgohen nga AbstractUser dhe janë CharField(max_length=150, blank=True)
    # Kështu që nuk ka nevojë t'i rideklarojmë nëse nuk duam t'i ndryshojmë atributet e tyre.

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.CUSTOMER,
        help_text='Roli i përdoruesit në sistem.'
    )
    
    phone_number = models.CharField(
        max_length=20, 
        blank=True, 
        null=True,
        help_text='Numri i telefonit (opsional).'
    )
    bio = models.TextField(blank=True, null=True, help_text="Një përshkrim i shkurtër për përdoruesin.")
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True, help_text="Fotoja e profilit.")

    is_available_for_delivery = models.BooleanField(default=False, help_text="A është shoferi aktualisht i disponueshëm për të marrë dërgesa?") 

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name'] # Kërkohen vetëm gjatë `createsuperuser`

    objects = UserManager()

    def __str__(self):
        return self.email

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

class Address(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='addresses', 
        help_text="Përdoruesi të cilit i përket kjo adresë."
    )
    # Do ta shtojmë lidhjen me restorantin më vonë:
    # restaurant = models.ForeignKey('Restaurant', on_delete=models.CASCADE, related_name='addresses', null=True, blank=True)
    
    street = models.CharField(max_length=255, help_text="Rruga dhe numri.")
    city = models.CharField(max_length=100, help_text="Qyteti.")
    state_province = models.CharField(max_length=100, blank=True, null=True, help_text="Shteti/Provinca/Rajoni (opsionale).")
    postal_code = models.CharField(max_length=20, help_text="Kodi postar.")
    country = models.CharField(max_length=100, default='Kosovo', help_text="Shteti.")
    
    is_default_shipping = models.BooleanField(default=False, help_text="A është kjo adresa primare e dërgesës për përdoruesin?")
    # is_primary_location = models.BooleanField(default=False) # Për restorantet, do ta shtojmë kur të kemi modelin Restaurant

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Addresses" # Për emër më të mirë në admin panel
        ordering = ['-is_default_shipping', '-created_at'] # Rendit default-in të parin

    def __str__(self):
        return f"{self.street}, {self.city}, {self.country} (Përdoruesi: {self.user.email})"
    
    # backend/api/models.py
# ... (importet ekzistuese dhe modelet User, Address) ...

class CuisineType(models.Model):
    """Kategoritë globale të kuzhinës, p.sh., Italiane, Shqiptare, Kineze."""
    name = models.CharField(max_length=100, unique=True, help_text="Emri i llojit të kuzhinës")
    description = models.TextField(blank=True, null=True, help_text="Përshkrim i shkurtër (opsional)")
    # image = models.ImageField(upload_to='cuisine_types/', null=True, blank=True) # Opsionale

    class Meta:
        verbose_name = "Lloj Kuzhine"
        verbose_name_plural = "Llojet e Kuzhinave"
        ordering = ['name']

    def __str__(self):
        return self.name

class Restaurant(models.Model):
    """Modeli për Restorantin."""
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='owned_restaurants',
        help_text="Pronari i restorantit (një përdorues me rolin RESTAURANT_OWNER)"
    )
    name = models.CharField(max_length=255, help_text="Emri zyrtar i restorantit")
    description = models.TextField(blank=True, null=True, help_text="Përshkrim i detajuar i restorantit")
    
    # Adresa kryesore e restorantit
    address = models.OneToOneField(
        Address, 
        on_delete=models.SET_NULL, # Nëse adresa fshihet, restoranti mbetet pa adresë, por nuk fshihet
        null=True, 
        blank=True, 
        related_name='restaurant_location',
        help_text="Adresa kryesore fizike e restorantit"
    )
    phone_number = models.CharField(max_length=20, help_text="Numri kryesor i telefonit të kontaktit")
    
    # Për imazhin, do të përdorim ImageField më vonë kur të konfigurojmë MEDIA_ROOT dhe MEDIA_URL
    # main_image = models.ImageField(upload_to='restaurant_main_images/', null=True, blank=True)
    main_image = models.ImageField(upload_to='restaurant_main_images/', null=True, blank=True, help_text="Fotoja kryesore e restorantit.")

    cuisine_types = models.ManyToManyField(
        CuisineType, 
        related_name='restaurants', 
        blank=True,
        help_text="Llojet e kuzhinës që ofron restoranti"
    )
    
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00, help_text="Vlerësimi mesatar nga klientët")
    delivery_time_estimate = models.CharField(max_length=50, blank=True, null=True, help_text="Koha e përafërt e dërgesës (p.sh., '25-35 min')")
    price_range = models.CharField(max_length=10, blank=True, null=True, choices=[('€', '€ (Lirë)'), ('€€', '€€ (Mesatare)'), ('€€€', '€€€ (Shtrenjtë)')], help_text="Gama e çmimeve")

    is_active = models.BooleanField(default=False, help_text="A është restoranti aktiv dhe i dukshëm për klientët (menaxhohet nga admini)?")
    is_approved = models.BooleanField(default=False, help_text="A është restoranti i aprovuar nga platforma (menaxhohet nga admini)?")
    
    # Opsionale: Për Multi-Tenancy më të avancuar, mund të shtohet një lidhje me një model Tenant
    # tenant = models.ForeignKey('Tenant', on_delete=models.SET_NULL, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Restorant"
        verbose_name_plural = "Restorantet"
        ordering = ['name']

    def __str__(self):
        return self.name

class OperatingHours(models.Model):
    """Orari i punës për një restorant."""
    class DayOfWeek(models.IntegerChoices):
        MONDAY = 1, 'E Hënë'
        TUESDAY = 2, 'E Martë'
        WEDNESDAY = 3, 'E Mërkurë'
        THURSDAY = 4, 'E Enjte'
        FRIDAY = 5, 'E Premte'
        SATURDAY = 6, 'E Shtunë'
        SUNDAY = 0, 'E Diel' # Standardi ISO 8601 (dhe Date.getDay() i JS) e ka të Dielën si 0 ose 7

    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='operating_hours')
    day_of_week = models.IntegerField(choices=DayOfWeek.choices, help_text="Dita e javës")
    open_time = models.TimeField(null=True, blank=True, help_text="Ora e hapjes (bosh nëse është mbyllur)")
    close_time = models.TimeField(null=True, blank=True, help_text="Ora e mbylljes (bosh nëse është mbyllur)")
    is_closed = models.BooleanField(default=False, help_text="A është restoranti i mbyllur gjatë gjithë kësaj dite?")

    class Meta:
        unique_together = ('restaurant', 'day_of_week')
        ordering = ['restaurant', 'day_of_week']
        verbose_name = "Orar Pune"
        verbose_name_plural = "Oraret e Punës"

    def __str__(self):
        if self.is_closed or not self.open_time or not self.close_time:
            return f"{self.restaurant.name} - {self.get_day_of_week_display()}: Mbyllur"
        return f"{self.restaurant.name} - {self.get_day_of_week_display()}: {self.open_time.strftime('%H:%M')} - {self.close_time.strftime('%H:%M')}"

class MenuCategory(models.Model):
    """Kategoritë brenda menusë së një restoranti (Pica, Pasta, Pije, etj.)."""
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='menu_categories')
    name = models.CharField(max_length=100, help_text="Emri i kategorisë së menusë")
    description = models.TextField(blank=True, null=True, help_text="Përshkrim i shkurtër (opsionale)")
    display_order = models.PositiveIntegerField(default=0, db_index=True, help_text="Përdoret për të renditur kategoritë në shfaqje")

    class Meta:
        unique_together = ('restaurant', 'name') # Emri i kategorisë duhet të jetë unik brenda një restoranti
        ordering = ['restaurant', 'display_order', 'name']
        verbose_name = "Kategori Menuje"
        verbose_name_plural = "Kategoritë e Menuve"

    def __str__(self):
        return f"{self.name} ({self.restaurant.name})"

class MenuItem(models.Model):
    """Një artikull specifik në menunë e një restoranti."""
    category = models.ForeignKey(MenuCategory, on_delete=models.CASCADE, related_name='menu_items', help_text="Kategoria së cilës i përket ky artikull")
    # Për qasje më të lehtë, mund të shtojmë edhe një ForeignKey direkt te Restaurant,
    # edhe pse mund të arrihet përmes category.restaurant. Kjo mund të ndihmojë në query.
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='all_menu_items_direct_link')

    name = models.CharField(max_length=255, help_text="Emri i artikullit të menusë")
    description = models.TextField(blank=True, null=True, help_text="Përshkrimi i artikullit")
    price = models.DecimalField(max_digits=8, decimal_places=2, help_text="Çmimi i artikullit")
    
    # image = models.ImageField(upload_to='menu_item_images/', null=True, blank=True)
    image = models.ImageField(upload_to='menu_item_images/', null=True, blank=True, help_text="Fotoja e artikullit të menusë.")
    
    is_available = models.BooleanField(default=True, help_text="A është ky artikull aktualisht i disponueshëm për porosi?")
    # ingredients = models.TextField(blank=True, null=True, help_text="Lista e përbërësve (opsionale)")
    # allergens = models.ManyToManyField('Allergen', blank=True) # Do të shtojmë modelin Allergen më vonë

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['category__display_order', 'category__name', 'name'] # Rendit sipas kategorisë dhe pastaj emrit
        verbose_name = "Artikull Menuje"
        verbose_name_plural = "Artikujt e Menuve"

    def __str__(self):
        return f"{self.name} ({self.category.name} - {self.restaurant.name})"

class Review(models.Model):
    RATING_CHOICES = [(i, str(i)) for i in range(1, 6)]

    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews') # Autori i vlerësimit
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        choices=RATING_CHOICES
    )
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        # Siguron që një përdorues mund të lërë vetëm një vlerësim për restorant
        unique_together = ('restaurant', 'user') 

    def __str__(self):
        return f"Review by {self.user.get_full_name() or self.user.email} for {self.restaurant.name} - {self.rating} stars"


class Order(models.Model):
    class OrderStatus(models.TextChoices):
        PENDING = 'PENDING', 'Në Pritje' # Porosia sapo është bërë nga klienti
        CONFIRMED = 'CONFIRMED', 'Konfirmuar' # Restoranti e ka pranuar
        PREPARING = 'PREPARING', 'Në Përgatitje'
        READY_FOR_PICKUP = 'READY_FOR_PICKUP', 'Gati për Marrje/Dërgesë'
        ON_THE_WAY = 'ON_THE_WAY', 'Në Rrugë' # Shoferi e ka marrë
        DELIVERED = 'DELIVERED', 'Dërguar'
        CANCELLED_BY_USER = 'CANCELLED_BY_USER', 'Anuluar nga Klienti'
        CANCELLED_BY_RESTAURANT = 'CANCELLED_BY_RESTAURANT', 'Anuluar nga Restoranti'
        FAILED_DELIVERY = 'FAILED_DELIVERY', 'Dërgesa Dështoi'

    class PaymentMethod(models.TextChoices):
        CASH_ON_DELIVERY = 'CASH_ON_DELIVERY', 'Para në Dorë'
        CARD_ONLINE = 'CARD_ONLINE', 'Kartë Online' # Për të ardhmen

    class PaymentStatus(models.TextChoices):
        PENDING = 'PENDING', 'Në Pritje'
        PAID = 'PAID', 'Paguar'
        FAILED = 'FAILED', 'Dështuar'

    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='orders', help_text="Klienti që bëri porosinë")
    restaurant = models.ForeignKey(Restaurant, on_delete=models.SET_NULL, null=True, related_name='orders', help_text="Restoranti nga i cili u porosit")
    driver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='deliveries', limit_choices_to={'role': User.Role.DRIVER}, help_text="Shoferi i caktuar për dërgesën (opsional)")
    
    # Detajet e adresës së dërgesës (mund të kopjohen nga Adresa e userit në momentin e porosisë)
    delivery_address_street = models.CharField(max_length=255, help_text="Rruga e dërgesës")
    delivery_address_city = models.CharField(max_length=100, help_text="Qyteti i dërgesës")
    delivery_address_postal_code = models.CharField(max_length=20, help_text="Kodi postar i dërgesës")
    delivery_address_notes = models.TextField(blank=True, null=True, help_text="Shënime shtesë për dërgesën")
    
    order_total = models.DecimalField(max_digits=10, decimal_places=2, help_text="Shuma totale e porosisë")
    # sub_total = models.DecimalField(max_digits=10, decimal_places=2, help_text="Nëntotali para tarifave")
    # delivery_fee = models.DecimalField(max_digits=6, decimal_places=2, default=0.00, help_text="Tarifa e dërgesës")
    # service_fee = models.DecimalField(max_digits=6, decimal_places=2, default=0.00, help_text="Tarifa e shërbimit (nëse ka)")

    status = models.CharField(max_length=30, choices=OrderStatus.choices, default=OrderStatus.PENDING, db_index=True)
    
    payment_method = models.CharField(max_length=30, choices=PaymentMethod.choices, default=PaymentMethod.CASH_ON_DELIVERY)
    payment_status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING, db_index=True)
    payment_intent_id = models.CharField(max_length=255, blank=True, null=True, help_text="ID e pagesës nga procesori (p.sh., Stripe)") # Për pagesa online

    estimated_delivery_time = models.DateTimeField(null=True, blank=True, help_text="Koha e parashikuar e dërgesës")
    actual_delivery_time = models.DateTimeField(null=True, blank=True, help_text="Koha reale kur u dërgua")
    
    # Koha kur restoranti konfirmon, fillon përgatitjen, etj.
    # confirmed_at = models.DateTimeField(null=True, blank=True)
    # preparation_started_at = models.DateTimeField(null=True, blank=True)
    # ready_for_pickup_at = models.DateTimeField(null=True, blank=True)
    # picked_up_by_driver_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Porosi"
        verbose_name_plural = "Porositë"

    def __str__(self):
        return f"Porosia #{self.id} nga {self.customer.email if self.customer else 'N/A'} te {self.restaurant.name if self.restaurant else 'N/A'}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    menu_item = models.ForeignKey(MenuItem, on_delete=models.SET_NULL, null=True, help_text="Artikulli i menusë (mund të jetë fshirë nga menuja)")
    # Ruajmë informacionin e artikullit në momentin e porosisë, në rast se artikulli ndryshon/fshihet më vonë
    item_name_at_purchase = models.CharField(max_length=255, help_text="Emri i artikullit në momentin e blerjes")
    item_price_at_purchase = models.DecimalField(max_digits=8, decimal_places=2, help_text="Çmimi i artikullit në momentin e blerjes")
    quantity = models.PositiveIntegerField(default=1)
    # item_notes = models.TextField(blank=True, null=True, help_text="Shënime specifike për këtë artikull në porosi")

    def subtotal(self):
        return self.item_price_at_purchase * self.quantity

    class Meta:
        verbose_name = "Artikull Porosie"
        verbose_name_plural = "Artikujt e Porosive"
        # unique_together = ('order', 'menu_item') # Mund të lejojë të njëjtin artikull me shënime të ndryshme

    def __str__(self):
        return f"{self.quantity} x {self.item_name_at_purchase} (Porosia #{self.order.id})"


class DriverProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        primary_key=True, # User bëhet çelësi primar
        related_name='driver_profile',
        limit_choices_to={'role': User.Role.DRIVER},
        help_text="Përdoruesi (me rolin DRIVER) të cilit i përket ky profil."
    )
    vehicle_type = models.CharField(
        max_length=100, 
        blank=True, 
        null=True, 
        help_text="Lloji i mjetit (p.sh., Motor, Makinë, Biçikletë)"
    )
    license_plate = models.CharField(
        max_length=20, 
        blank=True, 
        null=True, 
        unique=True, # Targa duhet të jetë unike ose null
        help_text="Targa e mjetit (nëse ka)"
    )
    # current_location_lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True, help_text="Gjerësia gjeografike aktuale")
    # current_location_lon = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True, help_text="Gjatësia gjeografike aktuale")
    # Për lokacionin, mund të përdorni PostGIS ose një zgjidhje më të thjeshtë me dy fusha Decimal.
    # Për momentin, i komentojmë pasi kërkojnë më shumë konfigurim dhe përditësime të shpeshta.

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Profil Shoferi"
        verbose_name_plural = "Profilet e Shoferëve"

    def __str__(self):
        return f"Profil për shoferin: {self.user.email}"