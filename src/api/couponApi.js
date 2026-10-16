import API from "../utils/axios";

export const validateCoupon = async (code, amount) => {
  try {
    const response = await API.post("/api/v1/coupons/validate", {
      code,
      amount,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { status: 0, message: "Validation failed" };
  }
};

export const getActiveCoupons = async () => {
  try {
    const response = await API.get("/api/v1/coupons/active");
    return response.data;
  } catch (error) {
    throw error.response?.data || { status: 0, message: "Failed to fetch coupons" };
  }
};

export const createCoupon = async (couponData) => {
  try {
    const response = await API.post("/api/v1/admin/coupons", couponData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { status: 0, message: "Failed to create coupon" };
  }
};

export const getAllCoupons = async () => {
  try {
    const response = await API.get("/api/v1/admin/coupons");
    return response.data;
  } catch (error) {
    throw error.response?.data || { status: 0, message: "Failed to fetch coupons" };
  }
};

export const getCouponById = async (id) => {
  try {
    const response = await API.get(`/api/v1/admin/coupons/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { status: 0, message: "Failed to fetch coupon" };
  }
};

export const updateCoupon = async (id, couponData) => {
  try {
    const response = await API.put(`/api/v1/admin/coupons/${id}`, couponData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { status: 0, message: "Failed to update coupon" };
  }
};

export const deleteCoupon = async (id) => {
  try {
    const response = await API.delete(`/api/v1/admin/coupons/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { status: 0, message: "Failed to delete coupon" };
  }
};

export const getCouponStats = async (id) => {
  try {
    const response = await API.get(`/api/v1/admin/coupons/${id}/stats`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { status: 0, message: "Failed to fetch coupon stats" };
  }
};