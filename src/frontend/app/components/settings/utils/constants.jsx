// Gradient constants
export const GRADIENT_PRIMARY = "linear-gradient(135deg, #4158D0 0%, #C850C0 46%, #FFCC70 100%)";
export const GRADIENT_SECONDARY = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
export const GRADIENT_SUCCESS = "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)";
export const GRADIENT_WARNING = "linear-gradient(135deg, #fa709a 0%, #fee140 100%)";
export const GRADIENT_INFO = "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)";

// Options for selects
export const languages = [
  { value: "en", label: "🇬🇧 English" },
  { value: "am", label: "🇪🇹 Amharic" },
  { value: "om", label: "🇪🇹 Oromo" },
];

export const timezones = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Shanghai",
];

export const tabs = [
  { id: "profile", label: "Profile", icon: "IconUser" },
  { id: "security", label: "Security", icon: "IconShieldLock" },
  { id: "preferences", label: "Preferences", icon: "IconPalette" },
  { id: "notifications", label: "Notifications", icon: "IconBellRinging" },
  { id: "privacy", label: "Privacy", icon: "IconShield" },
];

export const defaultFormData = {
  // Profile
  displayName: "",
  email: "",
  avatar: null,
  // Security
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
  // Preferences
  language: "en",
  theme: "system",
  timezone: "UTC",
  // Notifications
  emailNotifications: true,
  pushNotifications: false,
  marketingEmails: false,
  // Privacy
  profileVisibility: "public",
  showEmail: false,
  allowDataCollection: true,
};