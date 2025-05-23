// src/api/apiService.js
const API_BASE_URL = 'http://localhost:8000/api'; 

export const apiService = {
  getAuthToken: () => localStorage.getItem('authToken'), // Changed from 'accessToken' to 'authToken' to match AuthContext
  setToken: (token) => { // Added to match AuthContext
    // This is a simplified setter, AuthContext handles localStorage
    // This is mainly for apiService internal use if needed, or for direct calls outside of AuthContext lifecycle
    // For now, it's not strictly necessary if AuthContext is the sole manager of the token in localStorage
  },
  clearToken: () => { // Added to match AuthContext
    // Similar to setToken, for internal consistency if needed
  },

  request: async (endpoint, options = {}) => {
    const token = apiService.getAuthToken();
    const headers = {
      // Content-Type will be set conditionally below
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    // Set Content-Type only if body exists and is not FormData
    if (options.body && !(options.body instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
      // Ensure body is stringified if it's an object (common mistake)
      if (typeof options.body === 'object' && options.body !== null) {
        config.body = JSON.stringify(options.body);
      }
    }
    // If options.body is FormData, browser sets Content-Type automatically.

    try {
      console.log(`API Request: ${options.method || 'GET'} ${API_BASE_URL}${endpoint}`, { headers: config.headers, bodyProvided: !!options.body });
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

      let responseData;

      if (response.status === 204) { // No Content
        return null; 
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
          responseData = await response.json();
      } else {
          const textResponse = await response.text();
          console.warn(`API Warning: Endpoint ${endpoint} returned non-JSON response (status ${response.status}). Body: ${textResponse.substring(0, 500)}...`);
          responseData = { 
              detail: `Përgjigje e papritur nga serveri (Status: ${response.status}). Ju lutem provoni përsëri ose kontaktoni suportin nëse problemi vazhdon.`,
              _rawResponse: textResponse 
          };
          if (response.status === 401 || response.status === 403) {
             if (textResponse && textResponse.length < 200 && !textResponse.toLowerCase().includes('<html')) {
                responseData.detail = textResponse;
             }
          }
      }

      if (!response.ok) { 
        const message = responseData?.detail || responseData?.error || (typeof responseData === 'string' ? responseData : `Kërkesa dështoi me statusin ${response.status}`);
        console.error(`API Error ${response.status} for ${API_BASE_URL}${endpoint}:`, message, responseData);
        // Attach responseData to the error object for more context in calling functions
        const error = new Error(message);
        error.response = responseData; // Attach the full response data
        error.status = response.status; // Attach the status code
        throw error;
      }
      return responseData;

    } catch (error) {
      console.error(`Network or parsing error for ${API_BASE_URL}${endpoint}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Gabim i panjohur rrjeti.';
      // Propagate the enriched error if it came from the !response.ok block
      if (error.response && error.status) {
        throw error;
      }
      throw new Error(errorMessage);
    }
  },

  requestWithFormData: async (endpoint, formData, options = {}) => {
    const token = apiService.getAuthToken();
    const headers = {
        // Do NOT set 'Content-Type': 'multipart/form-data', browser does it.
        ...options.headers,
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        console.log(`API FormData Request: ${options.method || 'POST'} ${API_BASE_URL}${endpoint}`);
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: options.method || 'POST', // Default to POST for FormData
            headers,
            body: formData,
            ...options, // Spread other options like signal for AbortController
        });

        if (response.status === 204) return null;
        
        let responseData;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            responseData = await response.json();
        } else {
            const textResponse = await response.text();
            console.warn(`API FormData Warning: Endpoint ${endpoint} returned non-JSON response (status ${response.status}). Body: ${textResponse.substring(0, 500)}...`);
            responseData = { 
                detail: `Përgjigje e papritur nga serveri pas ngarkimit të skedarit (Status: ${response.status}).`,
                _rawResponse: textResponse
            };
             if (response.status === 401 || response.status === 403) {
                 if (textResponse && textResponse.length < 200 && !textResponse.toLowerCase().includes('<html')) {
                    responseData.detail = textResponse;
                 }
             }
        }

        if (!response.ok) {
            const message = responseData?.detail || `Kërkesa me FormData dështoi me statusin ${response.status}`;
            console.error(`API FormData Error ${response.status} for ${API_BASE_URL}${endpoint}:`, message, responseData);
            const error = new Error(message);
            error.response = responseData;
            error.status = response.status;
            throw error;
        }
        return responseData;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Gabim i panjohur rrjeti gjatë kërkesës me FormData.';
        console.error(`Network or FormData error for ${API_BASE_URL}${endpoint}:`, error);
        if (error.response && error.status) {
            throw error;
        }
        throw new Error(errorMessage);
    }
  }
};