import API from "../utils/axios";

export const createPaymentOrder = async (appointmentId, couponId = null) => {
  const response = await API.post("/api/v1/payment/payment", {
    appointmentId,
    couponId,
  });
  return response.data;
};
