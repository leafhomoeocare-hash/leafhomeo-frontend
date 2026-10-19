import API from "../utils/axios";

console.log("Mera Backend URL hai:", import.meta.env.VITE_API_URL);

export const register = async (data) => {
  const response = await API.post("/api/v1/auth/register", data);
  return response.data;
};

export const login = async (data) => {
  const response = await API.post("/api/v1/auth/login", data);
  return response.data;
};

export const adminLogin = async (data) => {
  const response = await API.post("/api/v1/auth/login", data);
  return response.data;
};

export const getUser = async () => {
  const response = await API.get("/api/v1/auth/get-user");
  return response.data;
};

export const updateProfile = async (data) => {
  const response = await API.post("/api/v1/auth/update-profile", data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const changePassword = async (data) => {
  const response = await API.post("/api/v1/auth/change-password", data);
  return response.data;
};

export const forgotPassword = async (data) => {
  const response = await API.post("/api/v1/auth/forgot-password", data);
  return response.data;
};

export const verifyOTP = async (data) => {
  const response = await API.post("/api/v1/auth/verify-otp", data);
  return response.data;
};

export const resetPassword = async (data) => {
  const response = await API.post("/api/v1/auth/reset-password", data);
  return response.data;
};

export const deleteUser = async () => {
  const response = await API.get("/api/v1/auth/delete-user");
  return response.data;
};

export const getNotifications = async () => {
  const response = await API.get("/api/v1/auth/get-notifications");
  return response.data;
};

export const deleteNotification = async (notificationId) => {
  const response = await API.delete(`/api/v1/auth/notification/${notificationId}`);
  return response.data;
};

export const markNotificationAsRead = async (notificationId) => {
  const response = await API.put(`/api/v1/auth/notification/${notificationId}/mark-read`);
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await API.put("/api/v1/auth/notifications/mark-all-read");
  return response.data;
};

export const truncateNotifications = async () => {
  const response = await API.delete("/api/v1/auth/truncate-notifications");
  return response.data;
};

export const setupPassword = async (data) => {
  const response = await API.post("/api/v1/auth/setup-password", data);
  return response.data;
};

export const sendPhoneOTP = async (data) => {
  const response = await API.post("/api/v1/auth/send-phone-otp", data);
  return response.data;
};

export const verifyPhoneOTP = async (data) => {
  const response = await API.post("/api/v1/auth/verify-phone-otp", data);
  return response.data;
};

export const sendEmailOTP = async (data) => {
  const response = await API.post("/api/v1/auth/send-email-otp", data);
  return response.data;
};

export const verifyEmailOTP = async (data) => {
  const response = await API.post("/api/v1/auth/verify-email-otp", data);
  return response.data;
};

export const getTermsConditions = async () => {
  const response = await API.get("/api/v1/auth/terms-conditions");
  return response.data;
};

export const updateEmail = async (data) => {
  const response = await API.post("/api/v1/auth/update-email", data);
  return response.data;
};

export const updateMobile = async (data) => {
  const response = await API.post("/api/v1/auth/update-mobile", data);
  return response.data;
};

