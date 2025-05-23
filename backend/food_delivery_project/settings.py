# backend/food_delivery_project/settings.py

from pathlib import Path
from datetime import timedelta
# import os # Nëse do të përdorësh python-dotenv dhe os.getenv
# from dotenv import load_dotenv # Nëse do të përdorësh python-dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Nëse përdor python-dotenv, ngarkoje këtu
# load_dotenv(BASE_DIR / '.env') # Supozon që .env është në folderin rrënjë 'backend/'

# SECURITY WARNING: keep the secret key used in production secret!
# SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'gjenero-nje-secret-key-te-forte-dhe-vendose-te-.env')
SECRET_KEY = 'django-insecure-4_yr$us$07t0!6n$43rjxg97!76b2(u6ih(_5pafubnxc0q_+5' # Për zhvillim është OK

# SECURITY WARNING: don't run with debug turned on in production!
# DEBUG = os.getenv('DJANGO_DEBUG', 'False') == 'True'
DEBUG = True # Për zhvillim

# ALLOWED_HOSTS_STRING = os.getenv('DJANGO_ALLOWED_HOSTS', 'localhost,127.0.0.1')
# ALLOWED_HOSTS = [host.strip() for host in ALLOWED_HOSTS_STRING.split(',') if host.strip()]
ALLOWED_HOSTS = [] # Për zhvillim lokal, mund ta lësh bosh ose ['localhost', '127.0.0.1']


# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third-party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_nested', # Sigurohu që ky rresht është këtu
    'corsheaders',
    'drf_yasg', # Shto drf-yasg
    # Your apps
    'api.apps.ApiConfig', # Ose thjesht 'api' nëse nuk keni modifikuar apps.py më parë
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware', # Sa më lart të jetë e mundur
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'food_delivery_project.urls' # Sigurohu që emri i projektit është korrekt

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [], # Mund të shtosh BASE_DIR / 'templates' nëse ke templates globale
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'food_delivery_project.wsgi.application' # Sigurohu emrin e projektit

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'food_delivery_db',     # Emri i databazës tënde
        'USER': 'shpatmjeku',           # Përdoruesi yt i PostgreSQL
        'PASSWORD': '',                 # Fjalëkalimi (bosh nëse nuk ka)
        'HOST': 'localhost',            # Ose '127.0.0.1'
        'PORT': '5432',                 # Porti standard
    }
}

# Modeli i personalizuar i përdoruesit
AUTH_USER_MODEL = 'api.User' # Ky duhet të jetë këtu para migrimit të parë me modelin User

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',},
]

# Internationalization
LANGUAGE_CODE = 'en-us' # Mund ta ndryshosh në 'sq' më vonë nëse do përkthime
TIME_ZONE = 'UTC' # Ose 'Europe/Tirane'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.0/howto/static-files/

STATIC_URL = 'static/'
# STATIC_ROOT = BASE_DIR / 'staticfiles' # Për deployment

# Default primary key field type
# https://docs.djangoproject.com/en/4.0/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Media files configuration
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Caching Configuration
# For a basic setup, we'll use local memory caching.
# For production, consider using Redis or Memcached.
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake', # Emër unik për këtë instancë cache
    }
}

# Optional: Cache middleware settings (if you plan to use site-wide or template caching via middleware)
# CACHE_MIDDLEWARE_ALIAS = 'default'
# CACHE_MIDDLEWARE_SECONDS = 60 * 15 # 15 minuta
# CACHE_MIDDLEWARE_KEY_PREFIX = ''

# Django REST Framework Settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        # Mund të shtosh 'rest_framework.authentication.SessionAuthentication' nëse do edhe browsable API login
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated', # Default: kërkon autentikim për shumicën e endpoints
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10, # Shembull page size
    # 'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema', # Nëse do të përdorje drf-spectacular
}

# Simple JWT Settings
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60), 
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),   
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True, # Kërkon 'rest_framework_simplejwt.token_blacklist'
    "UPDATE_LAST_LOGIN": True,
    
    "ALGORITHM": "HS256",
    # "SIGNING_KEY": SECRET_KEY, # Default është SECRET_KEY
    "VERIFYING_KEY": "",
    "AUDIENCE": None,
    "ISSUER": None,
    "JSON_ENCODER": None,
    "JWK_URL": None,
    "LEEWAY": 0,
    
    "AUTH_HEADER_TYPES": ("Bearer",), # Standard
    "AUTH_HEADER_NAME": "HTTP_AUTHORIZATION",
    "USER_ID_FIELD": "id", # Supozon që modeli User ka fushën 'id' si primary key
    "USER_ID_CLAIM": "user_id",
    "USER_AUTHENTICATION_RULE": "rest_framework_simplejwt.authentication.default_user_authentication_rule",
    
    "AUTH_TOKEN_CLASSES": ("rest_framework_simplejwt.tokens.AccessToken",),
    "TOKEN_TYPE_CLAIM": "token_type",
    "TOKEN_USER_CLASS": "rest_framework_simplejwt.models.TokenUser",
    
    "JTI_CLAIM": "jti",
    
    "SLIDING_TOKEN_REFRESH_EXP_CLAIM": "refresh_exp",
    "SLIDING_TOKEN_LIFETIME": timedelta(minutes=5), # Nuk përdoret nëse ROTATE_REFRESH_TOKENS=True
    "SLIDING_TOKEN_REFRESH_LIFETIME": timedelta(days=1), # Nuk përdoret nëse ROTATE_REFRESH_TOKENS=True
}

# CORS Settings
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173", # Adresa e frontend-it tënd React
    "http://127.0.0.1:5173",
]
# Për më shumë fleksibilitet gjatë zhvillimit, mund të përdorësh:
# CORS_ALLOW_ALL_ORIGINS = True # KUJDES: Vetëm për zhvillim, jo për produksion!
# Ose CORS_ALLOW_CREDENTIALS = True dhe CORS_ALLOWED_ORIGIN_REGEXES

# drf-yasg (Swagger) Settings
SWAGGER_SETTINGS = {
    'SECURITY_DEFINITIONS': {
        'Bearer': {
            'type': 'apiKey',
            'name': 'Authorization',
            'in': 'header',
            'description': "Shkruaj 'Bearer ' pasuar nga token-i yt JWT (p.sh., Bearer eyJhbGci...)."
        }
    },
    'USE_SESSION_AUTH': False, # E rëndësishme për API me token
    'SHOW_REQUEST_HEADERS': True,
    'PERSIST_AUTH': True, # Ruan autorizimin në Swagger UI ndërmjet rifreskimeve
    'DEFAULT_INFO': 'food_delivery_project.urls.api_info', # Nëse do të definosh info më të detajuar te urls.py
    'REFETCH_SCHEMA_WITH_AUTH': True, # Mund të ndihmojë
    'REFETCH_SCHEMA_ON_LOGOUT': True, # Mund të ndihmojë
}
# LOGIN_URL = 'rest_framework:login' # Nuk është e nevojshme për API me token kur përdor Swagger
# LOGOUT_URL = 'rest_framework:logout'