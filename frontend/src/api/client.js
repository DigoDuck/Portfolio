import axios from 'axios';
import { useAppStore } from '../store/useAppStore'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
    const lang = useAppStore.getState().lang // pega a língua atual do Zustand
    config.params = {
        ...config.params,
        lang,
    }
    return config
})

export default api 