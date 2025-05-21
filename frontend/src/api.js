// src/api.js
import axios from "axios";

const api = axios.create({
   baseURL: "http://localhost:8000/api",
});

// shto token-in në çdo request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// kur skadon token-i, provo refresh
api.interceptors.response.use(
  (resp) => resp,
  async (error) => {
    if (error.response?.status === 401) {
      const refresh = localStorage.getItem("refresh");
      if (refresh) {
        try {
          const { data } = await axios.post(
            "http://localhost:8000/api/token/refresh/",
            { refresh }
          );
          localStorage.setItem("access", data.access);
          error.config.headers.Authorization = `Bearer ${data.access}`;
          return axios(error.config); // retry
        } catch (_) {
          localStorage.clear();
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;