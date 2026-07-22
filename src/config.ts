// Backend API base URL.
// Reads from VITE_API_URL env var if configured, defaulting to live Render backend.
export const API_URL: string = import.meta.env.VITE_API_URL || "https://social-scheduler-kyds.onrender.com/api";

