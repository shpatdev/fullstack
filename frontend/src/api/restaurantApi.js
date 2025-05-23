// src/api/restaurantApi.js
import { apiService } from './apiService.js';

export const restaurantApi = {
  fetchRestaurantDetails: async (restaurantId) => {
    return apiService.request(`/restaurants/${restaurantId}/`);
  },

  fetchAllRestaurantCategoriesGlobal: async () => {
    return apiService.request('/cuisine-types/');
  },

  updateRestaurantDetails: async (restaurantId, detailsData, imageFile = null) => {
    // Backend (RestaurantDetailSerializer) pret JSON, por për ImageField duhet FormData.
    // Kjo kërkon që backend-i të jetë fleksibël ose të kemi dy endpoint-e/metoda.
    // Për momentin, nëse ka imageFile, do të përdorim FormData. Përndryshe JSON.
    
    if (imageFile) {
        const formData = new FormData();
        // Shto të dhënat e tjera (përveç main_image sepse ajo do jetë file)
        Object.keys(detailsData).forEach(key => {
            if (key === 'cuisine_type_ids' && Array.isArray(detailsData[key])) {
                 detailsData[key].forEach(id => formData.append('cuisine_type_ids', id));
            } else if (key !== 'main_image_url_placeholder' && key !== 'main_image' && detailsData[key] !== null && detailsData[key] !== undefined) {
                 formData.append(key, detailsData[key]);
            }
        });
        formData.append('main_image', imageFile, imageFile.name);
        
        console.log("Restaurant API: Updating details WITH IMAGE for", restaurantId);
        // Duhet një version i apiService.request që dërgon FormData (pa Content-Type JSON)
        return apiService.requestWithFormData(`/restaurants/${restaurantId}/`, formData, { method: 'PATCH'});

    } else {
        // Dërgo JSON nëse nuk ka foto të re
        const payload = { ...detailsData };
        // Hiq fushat që nuk duhet t'i dërgojmë ose që janë vetëm për frontend
        delete payload.imageFile; 
        // Backend pret cuisine_type_ids për many-to-many, jo cuisine_types (objekte)
        // Sigurohu që payload.cuisine_type_ids është array i PK-ve.
        
        console.log("Restaurant API: Updating details (JSON) for", restaurantId, "Payload:", payload);
        return apiService.request(`/restaurants/${restaurantId}/`, { 
          method: 'PATCH', 
          body: JSON.stringify(payload) 
        });
    }
  },

  setOpeningHours: async (restaurantId, hoursDataArray) => {
    // Thirrje individuale për çdo ditë (supozojmë se OperatingHoursViewSet është i thjeshtë)
    // Kjo është më pak eficiente se një batch update, por më e lehtë me ViewSet standard.
    // Backend-i duhet të ketë PUT/PATCH/DELETE për /restaurants/{pk}/operating-hours/{id}/
    // dhe POST për /restaurants/{pk}/operating-hours/
    
    const results = [];
    for (const hourEntry of hoursDataArray) {
        const payload = {
            day_of_week: hourEntry.day_of_week,
            open_time: hourEntry.is_closed ? null : (hourEntry.open_time?.includes(':') ? hourEntry.open_time : `${hourEntry.open_time}:00`),
            close_time: hourEntry.is_closed ? null : (hourEntry.close_time?.includes(':') ? hourEntry.close_time : `${hourEntry.close_time}:00`),
            is_closed: hourEntry.is_closed,
        };
        try {
            if (hourEntry.id) { // Përditëso orarin ekzistues
                results.push(await apiService.request(`/restaurants/${restaurantId}/operating-hours/${hourEntry.id}/`, {
                    method: 'PATCH', body: JSON.stringify(payload)
                }));
            } else if (!hourEntry.is_closed && payload.open_time && payload.close_time) { // Krijo orar të ri vetëm nëse nuk është i mbyllur dhe ka orë
                results.push(await apiService.request(`/restaurants/${restaurantId}/operating-hours/`, {
                    method: 'POST', body: JSON.stringify(payload)
                }));
            } else if (hourEntry.is_closed && !hourEntry.id) { // Krijo një hyrje "e mbyllur" nëse nuk ekziston
                 results.push(await apiService.request(`/restaurants/${restaurantId}/operating-hours/`, {
                    method: 'POST', body: JSON.stringify(payload)
                }));
            }
            // Rasti kur është i mbyllur dhe ka ID por duhet të fshihet (ose thjesht update is_closed)
            // Për thjeshtësi, këtu vetëm krijojmë/përditësojmë. Fshirja e hyrjeve individuale kërkon logjikë shtesë.
        } catch (error) {
            console.error(`Restaurant API: Error saving opening hour for day ${hourEntry.day_of_week}:`, error);
            results.push({ error: true, message: `Gabim për ditën ${hourEntry.day_of_week}: ${error.message}`});
        }
    }
    // Kontrollo 'results' për gabime individuale nëse dëshiron
    return { success: !results.some(r => r.error), message: "Orari u procesua." }; // Përgjigje e përgjithshme
  },

  fetchRestaurantOrders: async (restaurantId) => {
    return apiService.request(`/orders/?restaurant_id=${restaurantId}`); 
  },
  updateOrderStatus: async (orderId, newStatus) => {
    return apiService.request(`/orders/${orderId}/update-status-restaurant/`, {
      method: 'PATCH', 
      body: JSON.stringify({ status: newStatus }) 
    });
  },

  // --- Menu Management ---
  fetchMenuCategories: async (restaurantId) => {
    return apiService.request(`/restaurants/${restaurantId}/menu-categories/`);
  },
  createMenuCategory: async (categoryData, restaurantId) => { 
    // categoryData: { name, description, display_order }
    return apiService.request(`/restaurants/${restaurantId}/menu-categories/`, { 
      method: 'POST', body: JSON.stringify(categoryData) 
    });
  },
  updateMenuCategory: async (categoryId, categoryData, restaurantId) => {
    return apiService.request(`/restaurants/${restaurantId}/menu-categories/${categoryId}/`, { 
      method: 'PATCH', body: JSON.stringify(categoryData) 
    });
  },
  deleteMenuCategory: async (categoryId, restaurantId) => {
    return apiService.request(`/restaurants/${restaurantId}/menu-categories/${categoryId}/`, { method: 'DELETE' });
  },

  fetchMenuItems: async (restaurantId) => { // Ky endpoint kthen të gjithë artikujt e restorantit
    return apiService.request(`/restaurants/${restaurantId}/menu-items/`);
  },
  createMenuItem: async (itemData, restaurantId, imageFile = null) => {
    // itemData duhet të përmbajë: { name, description, price, category (ID), is_available }
    // Backend MenuItemSerializer pret 'category' si PK.
    
    if (imageFile) {
        const formData = new FormData();
        Object.keys(itemData).forEach(key => {
            if (key !== 'image' && itemData[key] !== null && itemData[key] !== undefined) { // 'image' do jetë file
                 formData.append(key, itemData[key]);
            }
        });
        formData.append('image', imageFile, imageFile.name);
        console.log("Restaurant API: Creating menu item WITH IMAGE for restaurant", restaurantId);
        // Ky endpoint është nested direkt te restoranti, jo te kategoria, por serializeri pret 'category' ID
        return apiService.requestWithFormData(`/restaurants/${restaurantId}/menu-items/`, formData, { method: 'POST' });
    } else {
        console.log("Restaurant API: Creating menu item (JSON) for restaurant", restaurantId, "Payload:", itemData);
        return apiService.request(`/restaurants/${restaurantId}/menu-items/`, { 
          method: 'POST', body: JSON.stringify(itemData)
        });
    }
  },
  updateMenuItem: async (itemId, itemData, restaurantId, imageFile = null) => {
    if (imageFile) {
        const formData = new FormData();
         Object.keys(itemData).forEach(key => {
            if (key !== 'image' && itemData[key] !== null && itemData[key] !== undefined) {
                 formData.append(key, itemData[key]);
            }
        });
        formData.append('image', imageFile, imageFile.name);
        console.log("Restaurant API: Updating menu item WITH IMAGE", itemId, "for restaurant", restaurantId);
        return apiService.requestWithFormData(`/restaurants/${restaurantId}/menu-items/${itemId}/`, formData, { method: 'PATCH'});
    } else {
        const payload = { ...itemData };
        delete payload.imageFile; // Nëse ka ardhur nga forma
        console.log("Restaurant API: Updating menu item (JSON)", itemId, "for restaurant", restaurantId, "Payload:", payload);
        return apiService.request(`/restaurants/${restaurantId}/menu-items/${itemId}/`, { 
          method: 'PATCH', body: JSON.stringify(payload) 
        });
    }
  },
  deleteMenuItem: async (itemId, restaurantId) => {
    return apiService.request(`/restaurants/${restaurantId}/menu-items/${itemId}/`, { method: 'DELETE' });
  },

  // --- Reviews ---
  fetchReviewsForRestaurant: async (restaurantId) => {
    return apiService.request(`/restaurants/${restaurantId}/reviews/`); 
  },
  submitReviewReply: async (reviewId, replyText, restaurantId) => {
    return apiService.request(`/restaurants/${restaurantId}/reviews/${reviewId}/reply/`, {
        method: 'POST',
        body: JSON.stringify({ text: replyText })
    });
  },

  // --- Analytics ---
  fetchRestaurantAnalytics: async (restaurantId) => {
    return apiService.request(`/restaurants/${restaurantId}/analytics-summary/`);
  }
};