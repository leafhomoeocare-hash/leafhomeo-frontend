import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});
API.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getVideoToken = async (appointmentId) => {
  console.log("=== getVideoToken called ===");
  console.log("Appointment ID:", appointmentId);
  console.log("API Base URL:", API.defaults.baseURL);
  console.log("Token in sessionStorage:", sessionStorage.getItem("token") ? "Present" : "Not present");
  
  try {
    const response = await API.post("/api/v1/appointment/get-video-token", {
      appointmentId,
    });
    console.log("Video token API response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error in getVideoToken:", error);
    console.error("Error response:", error.response);
    throw error;
  }
};

export const endVideoCall = async (appointmentId) => {
  try {
    const response = await API.post("/api/v1/appointment/end-video-call", {
      appointmentId,
    });
    return response.data;
  } catch (error) {
    console.error("Error in endVideoCall:", error);
    throw error;
  }
};
