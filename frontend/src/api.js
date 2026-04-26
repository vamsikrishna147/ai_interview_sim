import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
    baseURL: API_URL,
    timeout: 30000, // 30 seconds max timeout for AI generation
});

// Add interceptor to attach token to outgoing requests
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Add interceptor to uniformly log or handle errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error("API Error: ", error?.response?.data || error.message);
        if (error?.response?.status === 401 || error?.response?.status === 403) {
            localStorage.removeItem('auth_token');
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

export const getCurrentUser = async () => {
    const API_DOMAIN = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000';
    const response = await apiClient.get(`${API_DOMAIN}/auth/me`);
    return response.data;
};

export const updateProfilePicture = async (base64Image) => {
    const API_DOMAIN = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000';
    const response = await apiClient.put(`${API_DOMAIN}/auth/me/picture`, {
        picture: base64Image
    });
    return response.data;
};

export const setupInterview = async (role, type, difficulty, topic) => {
    const response = await apiClient.post('/setup', {
        role,
        interview_type: type,
        difficulty,
        topic
    });
    return response.data;
};

export const submitAnswer = async (sessionId, questionId, answer) => {
    const response = await apiClient.post('/interview/submit', {
        session_id: sessionId,
        question_id: questionId,
        answer
    });
    return response.data;
};

export const evaluateCode = async (sessionId, questionId, code, language = 'python') => {
    const response = await apiClient.post('/interview/evaluate_code', {
        session_id: sessionId,
        question_id: questionId,
        code,
        language
    });
    return response.data;
};

export const getDashboardMetrics = async () => {
    const response = await apiClient.get('/dashboard/metrics');
    return response.data;
};

export const analyzeResume = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/resume/analyze', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const sendVideoChatMessage = async (sessionId, messages) => {
    const response = await apiClient.post('/video/chat', {
        messages,
        job_role: "Software Engineer",
        years_experience: 2
    });
    return response.data;
};
