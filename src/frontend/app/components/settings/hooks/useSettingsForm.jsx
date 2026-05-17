// components/settings/hooks/useSettingsForm.jsx
import { useState, useEffect } from "react";
import { defaultFormData } from "../utils/constants";
import { apiClient } from "../../../lib/apiClient";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

export const useSettingsForm = () => {
  const [formData, setFormData] = useState(defaultFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [errors, setErrors] = useState({});

  // ── LOAD: Fetch real profile settings from MongoDB via /auth/me ──
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await apiClient(`${API_BASE_URL}/auth/me`);
        if (response.ok) {
          const payload = await response.json();
          const user = payload?.data?.user;
          
          if (user) {
            const userId = user._id || user.id;
            
            // Fetch local preferences scoped to this unique user
            let localPrefs = {};
            try {
              const storedPrefs = localStorage.getItem(`user_preferences_${userId}`);
              if (storedPrefs) {
                localPrefs = JSON.parse(storedPrefs);
              }
            } catch (e) {
              console.error("Failed parsing local preferences:", e);
            }

            // Fetch user-scoped avatar string from localStorage
            const savedAvatar = localStorage.getItem(`userAvatar_${userId}`);

            setFormData((prev) => ({
              ...prev,
              displayName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
              email: user.email || "",
              avatar: savedAvatar || user.profileImage || null,
              // Apply preferences with database/local values
              language: localPrefs.language || "en",
              theme: localPrefs.theme || "system",
              timezone: localPrefs.timezone || "UTC",
              emailNotifications: localPrefs.emailNotifications ?? true,
              pushNotifications: localPrefs.pushNotifications ?? false,
              marketingEmails: localPrefs.marketingEmails ?? false,
              profileVisibility: localPrefs.profileVisibility || "public",
              showEmail: localPrefs.showEmail ?? false,
              allowDataCollection: localPrefs.allowDataCollection ?? true,
            }));
          }
        }
      } catch (error) {
        console.error("Failed to load user settings:", error);
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // ── SAVE: Synchronize profile, credentials & preferences with DB ──
  const saveSettings = async () => {
    setIsLoading(true);
    setNotification(null);
    try {
      // 1. Fetch latest user session details to confirm ID
      const userRes = await apiClient(`${API_BASE_URL}/auth/me`);
      if (!userRes.ok) {
        throw new Error("Could not retrieve user session");
      }
      const userPayload = await userRes.json();
      const user = userPayload?.data?.user;
      if (!user) {
        throw new Error("User session details not found");
      }
      const userId = user._id || user.id;

      // 2. Parse display name back into First & Last Name for MongoDB schema
      const parts = formData.displayName.trim().split(/\s+/);
      const firstName = parts[0] || "";
      const lastName = parts.slice(1).join(" ") || "";

      // 3. Upload/Save user avatar base64 string
      let avatarUrl = formData.avatar;
      if (formData.avatar && formData.avatar instanceof File) {
        const reader = new FileReader();
        const avatarPromise = new Promise((resolve) => {
          reader.onloadend = () => {
            localStorage.setItem(`userAvatar_${userId}`, reader.result);
            resolve(reader.result);
          };
          reader.readAsDataURL(formData.avatar);
        });
        avatarUrl = await avatarPromise;
      }

      // 4. Update Profile attributes in MongoDB
      const profileRes = await apiClient(`${API_BASE_URL}/auth/profile`, {
        method: "PATCH",
        body: JSON.stringify({
          firstName,
          lastName,
          email: formData.email,
          profileImage: typeof avatarUrl === "string" ? avatarUrl : null,
        }),
      });

      if (!profileRes.ok) {
        const errPayload = await profileRes.json();
        throw new Error(errPayload.message || "Failed to update profile details");
      }

      // Update cached user object in localStorage for visual consistency across pages
      const updatedUserPayload = await profileRes.json();
      const updatedUser = updatedUserPayload?.data?.user;
      if (updatedUser) {
        const normalized = {
          id: updatedUser._id || updatedUser.id,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          email: updatedUser.email,
          phone: updatedUser.phone,
          role: updatedUser.role,
          address: updatedUser.address || "",
          profileImage: updatedUser.profileImage || "",
        };
        localStorage.setItem("currentUser", JSON.stringify(normalized));
      }

      // 5. Update Password in MongoDB if specified
      if (formData.currentPassword && formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          throw new Error("Confirmation password does not match new password");
        }
        
        const passwordRes = await apiClient(`${API_BASE_URL}/auth/change-password`, {
          method: "PATCH",
          body: JSON.stringify({
            currentPassword: formData.currentPassword,
            newPassword: formData.newPassword,
            confirmPassword: formData.confirmPassword,
          }),
        });

        if (!passwordRes.ok) {
          const errPayload = await passwordRes.json();
          throw new Error(errPayload.message || "Failed to update password");
        }
      }

      // 6. Save system preferences scoped to the user in localStorage
      const prefsToSave = {
        language: formData.language,
        theme: formData.theme,
        timezone: formData.timezone,
        emailNotifications: formData.emailNotifications,
        pushNotifications: formData.pushNotifications,
        marketingEmails: formData.marketingEmails,
        profileVisibility: formData.profileVisibility,
        showEmail: formData.showEmail,
        allowDataCollection: formData.allowDataCollection,
      };
      localStorage.setItem(`user_preferences_${userId}`, JSON.stringify(prefsToSave));

      // 7. Clear password input fields in UI and update the visual avatar state
      setFormData((prev) => ({
        ...prev,
        avatar: typeof avatarUrl === "string" ? avatarUrl : prev.avatar,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));

      setNotification({
        type: "success",
        message: "Settings synchronized successfully with the database!",
      });

      return true;
    } catch (error) {
      console.error("Failed to synchronize settings:", error);
      setNotification({
        type: "error",
        message: error.message || "Could not save settings. Please try again.",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // ── DELETE: Permanently delete user account ──
  const handleDeleteAccount = async () => {
    setIsLoading(true);
    try {
      // Get ID before deletion to clean up preferences
      let userId = null;
      try {
        const stored = localStorage.getItem("currentUser");
        if (stored) {
          const u = JSON.parse(stored);
          userId = u._id || u.id;
        }
      } catch (e) {}

      const res = await apiClient(`${API_BASE_URL}/auth/me`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errPayload = await res.json();
        throw new Error(errPayload.message || "Failed to delete account");
      }

      // Clear local storage and redirect to login
      localStorage.removeItem("currentUser");
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("token");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      
      // Clear preferences and avatar if we got the ID
      if (userId) {
        localStorage.removeItem(`user_preferences_${userId}`);
        localStorage.removeItem(`userAvatar_${userId}`);
      }

      return true;
    } catch (error) {
      console.error("Failed to delete account:", error);
      setNotification({
        type: "error",
        message: error.message || "Could not delete account. Please try again.",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    formData,
    isLoading,
    notification,
    setNotification,
    errors,
    setErrors,
    handleChange,
    saveSettings,
    handleDeleteAccount,
  };
};