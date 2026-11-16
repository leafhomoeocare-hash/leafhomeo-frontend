import API from "../utils/axios";

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

// Open video call in a new tab. sessionStorage is per-tab, so auth is handed
// off via localStorage one-time key (restored in main.jsx on app load).
export const openVideoCallInNewTab = (path) => {
  localStorage.setItem(
    "vc_auth_handoff",
    JSON.stringify({
      token: sessionStorage.getItem("token"),
      user: sessionStorage.getItem("user"),
    })
  );
  window.open(path, "_blank");
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
