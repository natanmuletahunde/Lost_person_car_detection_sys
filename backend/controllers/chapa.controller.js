const Subscription = require("../models/Subscription");
const User = require("../models/User");
const ApiResponse = require("../utils/ApiResponse");

const CHAPA_SECRET_KEY = "CHASECK_TEST-mbwvpX0Oj2qbShCaTJZEEXqC1T6pRcFk";
const CHAPA_INIT_URL = "https://api.chapa.co/v1/transaction/initialize";
const CHAPA_VERIFY_URL = "https://api.chapa.co/v1/transaction/verify/";

// Helper function for fetch with timeout
const fetchWithTimeout = async (url, options = {}, timeout = 30000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await response.json();
    return { data, status: response.status };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

const plans = {
  monthly: { name: "Monthly", price: 400, billing: "400.00" },
  annual: { name: "Annual", price: 4380, billing: "4380.00" },
};

exports.initializePayment = async (req, res) => {
  try {
    const { plan, userId, email, firstName, lastName, phone } = req.body;

    if (!plan || !userId || !email) {
      return ApiResponse.error(res, "Missing required fields", 400);
    }

    const selectedPlan = plans[plan];
    if (!selectedPlan) {
      return ApiResponse.error(res, "Invalid plan", 400);
    }

    const tx_ref = `tx_${plan}_${Date.now()}_${userId}`;

    const callback_url = `http://localhost:3001/api/v1/chapa/callback`;
    const return_url = `http://localhost:3000/user/register?payment=success&tx_ref=${tx_ref}`;

    const payload = {
      amount: selectedPlan.price.toString(),
      currency: "ETB",
      email,
      first_name: firstName || "User",
      last_name: lastName || "User",
      tx_ref,
      callback_url,
      return_url,
      customization: {
        title: "LPC Premium",
        description: `${selectedPlan.name} Plan Subscription`,
      },
    };

    if (phone && phone.trim() !== "") {
      payload.phone_number = phone.trim();
    }

    const response = await fetchWithTimeout(CHAPA_INIT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (response.data.status === "success") {
      return ApiResponse.success(res, "Payment initialized", {
        checkout_url: response.data.data.checkout_url,
        tx_ref,
      });
    }

    console.error("Chapa API responded with failure:", response.data);
    return ApiResponse.error(res, response.data?.message || "Failed to initialize payment", 400);
  } catch (error) {
    console.error("Chapa init error:", error.message);
    return ApiResponse.error(res, "Payment initialization failed", 500);
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { tx_ref } = req.params;

    const response = await fetchWithTimeout(`${CHAPA_VERIFY_URL}${tx_ref}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
      },
    });

    if (response.data.status === "success" && response.data.data.status === "success") {
      const { email, first_name, last_name, amount, tx_ref } = response.data.data;

      const user = await User.findOne({ email });
      if (user) {
        const planType = tx_ref.includes("monthly") ? "monthly" : "annual";
        const expiryDate = new Date();
        if (planType === "annual") {
          expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        } else {
          expiryDate.setMonth(expiryDate.getMonth() + 1);
        }

        await Subscription.findOneAndUpdate(
          { userId: user._id },
          {
            userId: user._id,
            plan: planType,
            status: "active",
            amountPaid: amount,
            tx_ref,
            paymentMethod: "chapa",
            expiresAt: expiryDate,
          },
          { upsert: true, new: true }
        );

        await User.findByIdAndUpdate(user._id, { hasPaidSubscription: true });
      }

      return ApiResponse.success(res, "Payment verified", { verified: true, data: response.data.data });
    }

    return ApiResponse.error(res, "Payment verification failed", 400);
  } catch (error) {
    console.error("Chapa verify error:", error.message);
    return ApiResponse.error(res, "Payment verification failed", 500);
  }
};

exports.handleCallback = async (req, res) => {
  try {
    const { tx_ref } = req.query;

    if (!tx_ref) {
      return res.redirect(`http://localhost:3000/user/subscribe?payment=failed`);
    }

    // Verify payment with Chapa
    const response = await fetchWithTimeout(`${CHAPA_VERIFY_URL}${tx_ref}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
      },
    });

    if (response.data.status === "success" && response.data.data.status === "success") {
      const { email, amount } = response.data.data;

      // Update user subscription
      const user = await User.findOne({ email });
      if (user) {
        const planType = tx_ref.includes("monthly") ? "monthly" : "annual";
        const expiryDate = new Date();
        if (planType === "annual") {
          expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        } else {
          expiryDate.setMonth(expiryDate.getMonth() + 1);
        }

        await Subscription.findOneAndUpdate(
          { userId: user._id },
          {
            userId: user._id,
            plan: planType,
            status: "active",
            amountPaid: amount,
            tx_ref,
            paymentMethod: "chapa",
            expiresAt: expiryDate,
          },
          { upsert: true, new: true }
        );

        await User.findByIdAndUpdate(user._id, { hasPaidSubscription: true });
      }

      res.redirect(`http://localhost:3000/user/register?payment=success&tx_ref=${tx_ref}`);
    } else {
      res.redirect(`http://localhost:3000/user/subscribe?payment=failed&tx_ref=${tx_ref}`);
    }
  } catch (error) {
    console.error("Chapa callback error:", error.message);
    res.redirect(`http://localhost:3000/user/subscribe?payment=failed`);
  }
};
