import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { createPaymentOrder } from "../api/paymentApi";
import { validateCoupon, getActiveCoupons } from "../api/couponApi";
import { X, Check, Loader2, Percent, ChevronDown, ChevronUp, Tag } from "lucide-react";

const Payment = ({ appointmentId, amount, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discountedAmount, setDiscountedAmount] = useState(amount);
  const [couponError, setCouponError] = useState("");
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [showCoupons, setShowCoupons] = useState(false);
  const [showCouponSection, setShowCouponSection] = useState(false);
  const [loadingCoupons, setLoadingCoupons] = useState(false);

  useEffect(() => {
    fetchAvailableCoupons();
  }, []);

  const fetchAvailableCoupons = async () => {
    try {
      setLoadingCoupons(true);
      const response = await getActiveCoupons();
      if (response.status === 1) {
        setAvailableCoupons(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching coupons:", error);
    } finally {
      setLoadingCoupons(false);
    }
  };

  const handleApplyCoupon = async (code = null) => {
    const codeToApply = code || couponCode;

    if (!codeToApply.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    setValidatingCoupon(true);
    setCouponError("");

    try {
      const response = await validateCoupon(codeToApply, amount);

      if (response.status === 1) {
        setAppliedCoupon(response.data);
        setDiscountedAmount(response.data.finalAmount);
        setCouponCode(codeToApply);
        setCouponError("");

        const discountText = response.data.discountType === "fixed"
          ? `₹${response.data.discountValue}`
          : `${response.data.discountValue}%`;

        Swal.fire({
          icon: "success",
          title: "Coupon Applied!",
          text: `You saved ${discountText} (₹${response.data.discountAmount})`,
          confirmButtonColor: "#10B981"
        });
      } else {
        setCouponError(response.message || "Invalid coupon");
        setAppliedCoupon(null);
        setDiscountedAmount(amount);
      }
    } catch (error) {
      setCouponError(error.message || "Failed to validate coupon");
      setAppliedCoupon(null);
      setDiscountedAmount(amount);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountedAmount(amount);
    setCouponCode("");
    setCouponError("");
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      const response = await createPaymentOrder(appointmentId, appliedCoupon?.couponId);

      if (response.status === 1) {
        const { paymentId, orderId, amount: orderAmount, currency, key } = response.data;

        const options = {
          key: key,
          amount: orderAmount,
          currency: currency,
          name: "Leaf Homeo Care",
          description: "Appointment Payment",
          order_id: orderId,
          handler: function (response) {
            // Payment successful
            Swal.fire({
              icon: "success",
              title: "Payment Successful",
              text: "Your payment has been processed successfully.",
              timer: 2000,
              showConfirmButton: false,
            }).then(() => {
              if (onSuccess) onSuccess(response);
            });
          },
          prefill: {
            name: "",
            email: "",
            contact: "",
          },
          theme: {
            color: "#10B981",
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
              if (onCancel) onCancel();
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: response.message || "Failed to create payment order",
        });
        setLoading(false);
      }
    } catch (error) {
      console.error("Payment error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Payment failed. Please try again.",
      });
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Price Breakdown */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-gray-600">
          <span>Original Amount:</span>
          <span className="font-medium">₹{amount}</span>
        </div>
        {appliedCoupon && (
          <div className="flex justify-between text-green-600">
            <span>Discount:</span>
            <span className="font-medium">-₹{appliedCoupon.discountAmount}</span>
          </div>
        )}
        <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
          <span>Total Amount:</span>
          <span>₹{discountedAmount}</span>
        </div>
      </div>

      {/* Coupon Section Toggle */}
      {!appliedCoupon && (
        <button
          onClick={() => setShowCouponSection(!showCouponSection)}
          className="w-full text-sm font-medium text-green-600 hover:text-green-700 py-2 text-center"
        >
          {showCouponSection ? (
            <>
              <ChevronUp className="h-4 w-4 inline mr-1" />
              Hide Coupon Section
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 inline mr-1" />
              Have a coupon code?
            </>
          )}
        </button>
      )}

      {/* Coupon Section */}
      {showCouponSection && (
        <div className="bg-gray-50 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Enter coupon code
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            disabled={appliedCoupon !== null}
            placeholder="Enter coupon code"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          {!appliedCoupon ? (
            <button
              onClick={() => handleApplyCoupon()}
              disabled={validatingCoupon || !couponCode.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {validatingCoupon ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Applying...
                </>
              ) : (
                "Apply"
              )}
            </button>
          ) : (
            <button
              onClick={handleRemoveCoupon}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Remove
            </button>
          )}
        </div>
        {couponError && (
          <p className="text-red-500 text-sm mt-2">{couponError}</p>
        )}
        {appliedCoupon && (
          <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">{appliedCoupon.code}</p>
                <p className="text-sm text-green-600">
                  {appliedCoupon.discountType === "fixed"
                    ? `₹${appliedCoupon.discountValue} off`
                    : `${appliedCoupon.discountValue}% off`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Available Coupons Section */}
        {availableCoupons.length > 0 && !appliedCoupon && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Available Coupons:</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
                {loadingCoupons ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-green-600" />
                  </div>
                ) : (
                  availableCoupons.map((coupon) => (
                    <div
                      key={coupon.id}
                      onClick={() => handleApplyCoupon(coupon.code)}
                      className="bg-white border border-green-200 rounded-lg p-3 cursor-pointer hover:bg-green-50 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-green-100 rounded-lg p-2">
                          <Tag className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{coupon.code}</p>
                          <p className="text-xs text-gray-600">
                            {coupon.discountType === "fixed"
                              ? `Flat ₹${coupon.discountValue} off`
                              : `${coupon.discountValue}% off`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <button className="text-xs bg-green-600 text-white px-3 py-1 rounded-full hover:bg-green-700 transition-colors">
                          Apply
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
          </div>
        )}
      </div>
      )}

      {/* Payment Button */}
      <button
        onClick={handlePayment}
        disabled={loading}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Processing..." : `Pay ₹${discountedAmount}`}
      </button>
    </div>
  );
};

export default Payment;
