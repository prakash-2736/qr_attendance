import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// Auto-attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-handle 401 (expired/invalid token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAuthCheck = error.config?.url?.includes("/auth/me");
      const isSessionReplaced =
        error.response?.data?.code === "SESSION_REPLACED";

      if (!isAuthCheck && window.location.pathname !== "/login") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        // Show reason before redirect
        if (isSessionReplaced) {
          alert(
            "You've been logged out — someone logged in from another device.",
          );
        }
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
