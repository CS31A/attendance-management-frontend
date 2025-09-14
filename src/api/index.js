import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "https://localhost:8081/api",
    timeout: 5000,
    withCredentials: true,
})

export default api