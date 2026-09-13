import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const apiClient = axios.create({
    baseURL: API_URL,
    timeout: 30000,
});

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

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error("API Error: ", error?.response?.data || error.message);
        return Promise.reject(error);
    }
);

export const getCurrentUser = async () => {
    return {
        id: "public",
        name: "Anonymous User",
        email: "public@simulator.local",
        picture: ""
    };
};

export const updateProfilePicture = async (base64Image) => {
    return { message: "Auth disabled" };
};

export const setupInterview = async (role, type, difficulty, topic, company) => {
    const response = await apiClient.post('/setup', {
        role,
        interview_type: type,
        difficulty,
        topic,
        company
    });
    try {
        const stored = JSON.parse(localStorage.getItem('my_sessions') || '[]');
        stored.push(response.data.session_id);
        localStorage.setItem('my_sessions', JSON.stringify(stored));
    } catch(e) {}
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
    let stored = [];
    try {
        stored = JSON.parse(localStorage.getItem('my_sessions') || '[]');
    } catch(e) {}
    const response = await apiClient.post('/dashboard/metrics', { session_ids: stored });
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

export const getTrends = async (role) => {
    const response = await apiClient.get('/trends/' + role);
    return response.data;
};
