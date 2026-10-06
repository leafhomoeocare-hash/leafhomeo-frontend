import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});
// Attach token automatically to every request made with this instance
API.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `${token}`;
  }
  return config;
});

export const getAppointments = async (page, limit, search) => {
  const response = await API.post("/api/v1/admin/Appointments", {
    page,
    limit,
    search,
  });

  return response.data;
};

export const getAvailabilitySlots = async (doctorId, date) => {
  const response = await API.post("/api/v1/appointment/get-slot", {
    doctorId,
    date,
  });
  return response.data;
};

export const bookAppointment = async (bookingData) => {
  const response = await API.post("/api/v1/appointment/book-appointment", bookingData);
  return response.data;
};

export const getMyAppointments = async (page = 1, limit = 10) => {
  const response = await API.get("/api/v1/appointment/my-appointments", {
    params: { page, limit }
  });
  return response.data;
};

export const getUpcomingAppointments = async () => {
  const response = await API.get("/api/v1/appointment/upcoming-appointments");
  return response.data;
};

export const cancelAppointment = async (appointmentId) => {
  const response = await API.post("/api/v1/appointment/cancel-appointment", { appointmentId });
  return response.data;
};

export const getPatients = async (page, limit, search) => {
  const response = await API.post("/api/v1/admin/getpatients", {
    page,
    limit,
    search,
  });
  return response.data;
};

export const deletePatient = async (patientId) => {
  const response = await API.post("/api/v1/admin/deletepatient", { patientId });
  return response.data;
};

export const getPatientDetails = async (patientId) => {
  const response = await API.post("/api/v1/admin/patient-details", { patientId });
  return response.data;
};

export const updateShippingStatus = async (appointmentId, shippingStatus, trackerId) => {
  const response = await API.put(`/api/v1/appointment/update-shipping-status/${appointmentId}`, {
    shippingStatus,
    trackerId
  });
  return response.data;
};

export const getPatientAppointments = async () => {
  const response = await API.get("/api/v1/appointment/my-appointments", {
    params: { page: 1, limit: 1000 }
  });
  return response.data;
};