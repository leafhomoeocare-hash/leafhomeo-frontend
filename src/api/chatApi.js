import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Attach token automatically to every request
API.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  if (token) {
    // Standardize token header format (some APIs expect raw token, others expect Bearer token.
    // The authMiddleware in this codebase accepts Bearer prefix or raw token, so we can pass it raw or formatted)
    config.headers.Authorization = token;
  }
  return config;
});

export const getContacts = async () => {
  const response = await API.get("/api/v1/chat/contacts");
  return response.data;
};

export const getChatHistory = async (otherUserId, page = 1) => {
  const response = await API.get(`/api/v1/chat/history/${otherUserId}`, {
    params: { page }
  });
  return response.data;
};

export const getChatHistoryByAppointments = async (otherUserId) => {
  const response = await API.get(`/api/v1/chat/history-by-appointments/${otherUserId}`);
  return response.data;
};

export const getAppointmentChatHistory = async (appointmentId) => {
  const response = await API.get(`/api/v1/chat/appointment-chat/${appointmentId}`);
  return response.data;
};

export const getContactById = async (userId) => {
  const response = await API.get(`/api/v1/chat/contact/${userId}`);
  return response.data;
};

export const editMessage = async (messageId, message) => {
  const response = await API.put(`/api/v1/chat/message/${messageId}`, { message });
  return response.data;
};

export const deleteMessage = async (messageId) => {
  const response = await API.delete(`/api/v1/chat/message/${messageId}`);
  return response.data;
};

export const uploadAttachment = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await API.post('/api/v1/chat/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const sendMedicalMessage = async (receiverId, messageType, medicalData, message) => {
  const response = await API.post('/api/v1/chat/medical', {
    receiverId,
    messageType,
    medicalData,
    message
  });
  return response.data;
};

export const getAppointmentContext = async (otherUserId) => {
  const response = await API.get(`/api/v1/chat/appointment/${otherUserId}`);
  return response.data;
};

export const getPrescriptionTemplates = async () => {
  const response = await API.get('/api/v1/chat/prescription-templates');
  return response.data;
};
