from django.core.cache import cache
import hashlib

# --- Cuisine Types List Cache ---
CUISINE_TYPES_LIST_VERSION_KEY = 'cuisine_types_list_version_v1' # Shtova _v1 për të lejuar ndryshime në strukturë pa konflikte
CUISINE_TYPES_LIST_CACHE_KEY_PREFIX = 'cuisine_types_list_data_v'

def get_cuisine_types_list_cache_version():
    version = cache.get(CUISINE_TYPES_LIST_VERSION_KEY)
    if version is None:
        version = 1
        cache.set(CUISINE_TYPES_LIST_VERSION_KEY, version, timeout=None) # Versioni nuk skadon vetë
    return version

def increment_cuisine_types_list_cache_version():
    try:
        version = cache.incr(CUISINE_TYPES_LIST_VERSION_KEY)
    except ValueError: # Nëse çelësi nuk ekziston ose nuk është int
        version = 1
        cache.set(CUISINE_TYPES_LIST_VERSION_KEY, version, timeout=None)
    print(f"Cuisine types list cache version incremented to: {version}")
    return version

def get_cuisine_types_list_cache_key():
    version = get_cuisine_types_list_cache_version()
    return f"{CUISINE_TYPES_LIST_CACHE_KEY_PREFIX}{version}"


# --- Restaurants List Cache (Public, Paginated) ---
RESTAURANTS_LIST_PUBLIC_VERSION_KEY = 'restaurants_list_public_version_v1'
RESTAURANTS_LIST_PUBLIC_CACHE_KEY_PREFIX = 'restaurants_list_public_data_v'

def get_restaurants_list_public_cache_version():
    version = cache.get(RESTAURANTS_LIST_PUBLIC_VERSION_KEY)
    if version is None:
        version = 1
        cache.set(RESTAURANTS_LIST_PUBLIC_VERSION_KEY, version, timeout=None)
    return version

def increment_restaurants_list_public_cache_version():
    try:
        version = cache.incr(RESTAURANTS_LIST_PUBLIC_VERSION_KEY)
    except ValueError:
        version = 1
        cache.set(RESTAURANTS_LIST_PUBLIC_VERSION_KEY, version, timeout=None)
    print(f"Public restaurants list cache version incremented to: {version}")
    return version

def get_restaurants_list_public_cache_key(request):
    """
    Gjeneron një çelës cache për listën publike të restoranteve,
    duke marrë parasysh parametrat e query-t për paginimin dhe filtrat e mundshëm.
    """
    version = get_restaurants_list_public_cache_version()
    
    # Përfshij parametrat relevantë të query-t në çelës për unikalitet
    # P.sh., 'page', 'cuisine', 'search', etj.
    # Krijojmë një string të qëndrueshëm nga query params
    query_params = request.query_params.copy()
    query_params.pop('format', None) # Hiq formatin nëse është prezent
    
    # Rendit parametrat për të siguruar që renditja nuk ndikon te çelësi
    sorted_query_params = sorted(query_params.items())
    
    # Krijo një hash të parametrave të renditur
    # Përdor një subset të parametrave që realisht ndikojnë në listën publike
    # Këtu supozojmë se vetëm 'page' është relevant për cache-in publik fillestar.
    # Nëse keni filtra publikë (p.sh. ?cuisine=Italian), duhet t'i përfshini.
    
    page_number = request.query_params.get('page', '1')
    # Për një implementim më të fortë, mund të bësh hash të gjithë query string-ut relevant
    # relevant_query_string = "&".join([f"{k}={v}" for k, v in sorted_query_params if k in ['page', 'relevant_filter1']])
    # query_hash = hashlib.md5(relevant_query_string.encode('utf-8')).hexdigest()[:8]
    # return f"{RESTAURANTS_LIST_PUBLIC_CACHE_KEY_PREFIX}{version}_params_{query_hash}"
    
    # Për thjeshtësi, vetëm me numrin e faqes për këtë shembull
    return f"{RESTAURANTS_LIST_PUBLIC_CACHE_KEY_PREFIX}{version}_page{page_number}"

def get_restaurants_list_public_all_items_cache_key(): # Për rastin kur nuk ka paginim
    version = get_restaurants_list_public_cache_version()
    return f"{RESTAURANTS_LIST_PUBLIC_CACHE_KEY_PREFIX}{version}_all_items"

