// Backend API base URL.
// Set VITE_API_URL in Vercel (and .env.local for dev) to the deployed
// backend origin, e.g. https://socialflow-backend.onrender.com
export const API_URL: string = (
    import.meta.env.VITE_API_URL || "http://localhost:8000"
).replace(/\/+$/, "");
