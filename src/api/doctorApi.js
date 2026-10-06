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

export const getDoctors = async (page, limit, search) => {
  const response = await API.post("/api/v1/admin/getdoctors", {
    page,
    limit,
    search,
  });

  return response.data;
};

export const getExpertDoctors = async (search = "") => {
  const response = await API.post("/api/v1/patient/get-expert-doctors", { search });
  return response.data;
};

export const getDoctorById = async (doctorId) => {
  const response = await API.post("/api/v1/patient/get-doctor-details", { doctorId });
  return response.data;
};

export const getDoctorDetails = async (doctorId) => {
  const response = await API.post("/api/v1/patient/get-doctor-details", { doctorId });
  return response.data;
};

export const addDoctor = async (doctorData) => {
  const payload = {
    ...doctorData,
    IsExpert: doctorData.isExpert ?? doctorData.IsExpert ?? false,
  };
  delete payload.isExpert;

  let response;
  if (doctorData.image instanceof File) {
    const formData = new FormData();
    Object.keys(payload).forEach((key) => {
      // Handle arrays properly
      if (Array.isArray(payload[key])) {
        payload[key].forEach((item) => {
          formData.append(`${key}[]`, item);
        });
      } else if (key !== 'image') {
        formData.append(key, payload[key]);
      }
    });
    // Add image separately
    formData.append('image', doctorData.image);
    response = await API.post("/api/v1/admin/add", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  } else {
    response = await API.post("/api/v1/admin/add", payload);
  }
  return response.data;
};

export const deleteDoctor = async (doctorId) => {
  const response = await API.post("/api/v1/admin/delete", { doctorId });
  return response.data;
};

export const updateDoctor = async (doctorData) => {
  const payload = {
    ...doctorData,
    IsExpert: doctorData.isExpert ?? doctorData.IsExpert ?? false,
  };
  delete payload.isExpert;

  let response;
  if (doctorData.image instanceof File) {
    const formData = new FormData();
    Object.keys(payload).forEach((key) => {
      // Handle arrays properly
      if (Array.isArray(payload[key])) {
        payload[key].forEach((item) => {
          formData.append(`${key}[]`, item);
        });
      } else if (key !== 'image') {
        formData.append(key, payload[key]);
      }
    });
    // Add image separately
    formData.append('image', doctorData.image);
    response = await API.post("/api/v1/admin/updatedoctor", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  } else {
    response = await API.post("/api/v1/admin/updatedoctor", payload);
  }
  return response.data;
};

// Doctor-specific APIs
export const acceptAppointment = async (appointmentId) => {
  const response = await API.post("/api/v1/doctor/accept-appointment", { appointmentId });
  return response.data;
};

export const rejectAppointment = async (appointmentId) => {
  const response = await API.post("/api/v1/doctor/reject-appointment", { appointmentId });
  return response.data;
};

export const addAvailability = async (availability) => {
  const response = await API.post("/api/v1/doctor/add-availability", { availability });
  return response.data;
};

export const getDoctorAvailability = async () => {
  const response = await API.get("/api/v1/doctor/get-availability");
  return response.data;
};

export const updateAvailability = async (availabilityId, availabilityData) => {
  const response = await API.post("/api/v1/doctor/update-availability", { availabilityId, ...availabilityData });
  return response.data;
};

export const deleteAvailability = async (availabilityId) => {
  const response = await API.post("/api/v1/doctor/delete-availability", { availabilityId });
  return response.data;
};

export const getDoctorAppointments = async (status, page = 1, limit = 10) => {
  const response = await API.post("/api/v1/doctor/appointments", { status }, {
    params: { page, limit }
  });
  return response.data;
};

export const getDoctorPatients = async () => {
  const response = await API.get("/api/v1/doctor/patients");
  return response.data;
};

export const getPatientDetails = async (patientId) => {
  const response = await API.post("/api/v1/doctor/patient-details", { patientId });
  return response.data;
};

export const getDoctorConsultationHistory = async (filters) => {
  const response = await API.post("/api/v1/doctor/consultation-history", filters);
  return response.data;
};

export const getPublicDoctorProfile = async (doctorId) => {
  const response = await API.get(`/api/v1/doctor/public/${doctorId}`);
  return response.data;
};