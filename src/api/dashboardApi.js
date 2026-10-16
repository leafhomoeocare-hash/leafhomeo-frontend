import API from "../utils/axios";

export const getDashboardStats = async () => {
  const response = await API.get("/api/v1/admin/dashboard-stats");
  return response.data;
};
