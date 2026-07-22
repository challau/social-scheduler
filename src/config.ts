// Backend API base URL.
// When deployed on Vercel, API is served from the same domain under /api.
// In local dev, Vite proxy forwards /api to FastAPI.
export const API_URL: string = import.meta.env.VITE_API_URL || "/api";
