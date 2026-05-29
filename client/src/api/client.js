import axios from 'axios';
import toast from 'react-hot-toast';

export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
});

// Global error interceptor
api.interceptors.response.use(
  res => res,
  err => {
    const message = err.response?.data?.error || 
                    err.response?.data?.message || 
                    `Request failed with status code ${err.response?.status}`;
    
    // Don't toast on cancelled requests
    if (!axios.isCancel(err)) {
      toast.error(message, {
        duration: 4000,
        style: {
          background: '#1e293b',
          color: '#f1f5f9',
          border: '1px solid #334155',
        },
      });
    }

    return Promise.reject(err);
  }
);

// ─── Papers API ─────────────────────────────────────────────────────

export async function fetchPapers(page = 1, limit = 20) {
  const { data } = await api.get('/papers', { params: { page, limit } });
  return data;
}

export async function fetchPaper(id) {
  const { data } = await api.get(`/papers/${id}`);
  return data;
}

export async function createPaper(paper) {
  const { data } = await api.post('/papers', paper);
  return data;
}

export async function deletePaper(id) {
  const { data } = await api.delete(`/papers/${id}`);
  return data;
}

// ─── Search API ─────────────────────────────────────────────────────

export async function semanticSearch(query, topK = 5) {
  const { data } = await api.post('/search', { query, topK });
  return data;
}

// ─── Summarize API ──────────────────────────────────────────────────

export async function summarizePaper(id) {
  const { data } = await api.post(`/papers/summarize/${id}`);
  return data;
}

export async function updatePaperMetadata(id, metadata) {
  const { data } = await api.patch(`/papers/${id}/metadata`, metadata);
  return data;
}

export const updateSettings = async (settings) => {
  const res = await api.put('/settings', settings);
  return res.data;
};

// --- Auth & Security ---
export const getSessions = async () => {
  const res = await api.get('/auth/sessions');
  return res.data;
};

export const terminateSession = async (id) => {
  const res = await api.delete(`/auth/sessions/${id}`);
  return res.data;
};

export const toggle2FA = async (enabled) => {
  const res = await api.post('/auth/2fa/toggle', { enabled });
  return res.data;
};

export const updatePassword = async (oldPassword, newPassword) => {
  const res = await api.post('/auth/password', { oldPassword, newPassword });
  return res.data;
};

// --- Profile ---
export const getProfile = async () => {
  const res = await api.get('/profile');
  return res.data;
};

export const updateProfile = async (data) => {
  const res = await api.put('/profile', data);
  return res.data;
};

// --- API Keys ---
export const getApiKeys = async () => {
  const res = await api.get('/apikeys');
  return res.data;
};

export const createApiKey = async (name) => {
  const res = await api.post('/apikeys', { name });
  return res.data;
};

export const deleteApiKey = async (id) => {
  const res = await api.delete(`/apikeys/${id}`);
  return res.data;
};

// --- Support ---
export const getSupportTickets = async () => {
  const res = await api.get('/support');
  return res.data;
};

export const createSupportTicket = async (data) => {
  const res = await api.post('/support', data);
  return res.data;
};

export const resolveSupportTicket = async (id) => {
  const res = await api.patch(`/support/${id}/resolve`);
  return res.data;
};

// --- AI Chat ---
export const getChats = async () => {
  const res = await api.get('/chat');
  return res.data;
};

export const getChat = async (id) => {
  const res = await api.get(`/chat/${id}`);
  return res.data;
};

export const createChat = async (title) => {
  const res = await api.post('/chat', { title });
  return res.data;
};

export const deleteChat = async (id) => {
  const res = await api.delete(`/chat/${id}`);
  return res.data;
};

export default api;
