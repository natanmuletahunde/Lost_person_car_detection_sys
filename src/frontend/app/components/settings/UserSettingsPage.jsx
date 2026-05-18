"use client";

import React, { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Alert,
  Box,
  Group,
  Button,
  Text,
  Title,
  Divider,
  Avatar,
  ActionIcon,
  Menu,
  UnstyledButton,
  Grid,
  ThemeIcon,
  Badge,
  useMantineTheme,
  useMantineColorScheme,
  Stack,
} from "@mantine/core";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconCheck,
  IconX,
  IconCircleCheck,
  IconAlertTriangle,
  IconHome,
  IconLogout,
  IconUser,
  IconBell,
  IconShieldLock,
  IconPalette,
  IconBellRinging,
  IconShield,
  IconInfoCircle,
} from "@tabler/icons-react";
import Image from "next/image";

import { ProfileSection } from "./SettingsSections/ProfileSection";
import { SecuritySection } from "./SettingsSections/SecuritySection";
import { PreferencesSection } from "./SettingsSections/PreferencesSection";
import { NotificationsSection } from "./SettingsSections/NotificationsSection";
import { PrivacySection } from "./SettingsSections/PrivacySection";
import { useSettingsForm } from "./hooks/useSettingsForm";
import { useUnsavedChanges } from "./hooks/useUnsavedChanges";
import { validateSettings } from "./utils/validators";
import DashboardHeader from "../../user/dashboard/DashboardHeader";

const getBg = (colorScheme, light, dark) =>
  colorScheme === "dark" ? dark : light;

export default function UserSettingsPage() {
  const router = useRouter();
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  
  const [activeTab, setActiveTab] = useState("profile");
  const [username, setUsername] = useState("User");

  // Custom Settings Hooks
  const settingsForm = useSettingsForm();
  const formData = settingsForm.formData;
  const isLoading = settingsForm.isLoading;
  const notification = settingsForm.notification;
  const setNotification = settingsForm.setNotification;
  const errors = settingsForm.errors;
  const setErrors = settingsForm.setErrors;
  const handleChange = settingsForm.handleChange;
  const saveSettings = settingsForm.saveSettings;
  const handleDeleteAccount = settingsForm.handleDeleteAccount;
  
  const hasUnsavedChanges = useUnsavedChanges(formData);

  const mainBg = getBg(colorScheme, "#F4F7FE", "#101113");
  const headerBg = getBg(colorScheme, "rgba(255, 255, 255, 0.85)", "rgba(26, 27, 30, 0.85)");
  const borderColor = getBg(colorScheme, "#E9ECEF", theme.colors.dark[5]);
  const cardBg = getBg(colorScheme, "white", theme.colors.dark[6]);
  const isDark = colorScheme === "dark";

  // Load User Info
  useEffect(() => {
    try {
      const stored = localStorage.getItem("currentUser");
      if (stored) {
        const u = JSON.parse(stored);
        setUsername(
          `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
            u.email?.split("@")[0] ||
            "User"
        );
      }
    } catch (_) {}
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("isAuthenticated");
    router.push("/");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validateSettings(formData);
    const errorKeys = Object.keys(validationErrors);
    if (errorKeys.length > 0) {
      setErrors(validationErrors);
      setNotification({ type: "error", message: "Please fix the errors above" });
      return;
    }
    await saveSettings();
  };

  // Tabs layout configuration
  const tabsList = [
    { id: "profile", label: "Profile Information", icon: IconUser, color: "blue", desc: "Display name & email info" },
    { id: "security", label: "Security & Credentials", icon: IconShieldLock, color: "red", desc: "Passwords & login details" },
    { id: "preferences", label: "System Preferences", icon: IconPalette, color: "violet", desc: "Themes, language & timezone" },
    { id: "notifications", label: "Alert Notifications", icon: IconBellRinging, color: "orange", desc: "Configure dispatch parameters" },
    { id: "privacy", label: "Privacy & Analytics", icon: IconShield, color: "green", desc: "Data collection & visibility" },
  ];

  return (
    <Box bg={mainBg} style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      
      {/* Dynamic Keyframes Styling */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .hover-lift {
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .hover-lift:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px -10px rgba(0, 0, 0, 0.08) !important;
        }
        .settings-sidebar-btn {
          width: 100%;
          text-align: left;
          padding: 12px 16px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 14px;
          transition: all 0.2s ease;
          border-left: 3px solid transparent;
        }
        .settings-sidebar-btn[data-active="true"] {
          background-color: ${isDark ? "rgba(47, 128, 237, 0.08)" : "rgba(47, 128, 237, 0.04)"};
          color: #2f80ed !important;
          border-left: 3px solid #2f80ed;
          font-weight: 700;
        }
        .settings-sidebar-btn[data-active="false"]:hover {
          background-color: ${isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)"};
        }
      ` }} />

      {/* ── Reusable Unified Header ── */}
      <DashboardHeader />

      {/* ── Main Dashboard Settings Layout ── */}
      <Container size="xl" py={40} style={{ flex: 1 }}>
        <Stack gap="xl" className="animate-fade-in">
          
          {/* Header Banner & Save indicator */}
          <Paper withBorder radius="lg" p="xl" style={{ 
            background: "linear-gradient(135deg, #2f80ed 0%, #1e56a0 100%)",
            color: "white",
            position: "relative",
            overflow: "hidden"
          }}>
            <Box style={{ position: "absolute", top: -30, right: -30, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.03)" }} />
            <Box style={{ position: "absolute", bottom: -60, left: -20, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.02)" }} />

            <Group justify="space-between" align="center" wrap="nowrap">
              <Box>
                <Group gap="xs" mb={4}>
                  <Badge color="blue" variant="filled" size="sm" style={{ textTransform: "uppercase" }}>System Config</Badge>
                  {hasUnsavedChanges && (
                    <Badge color="orange" variant="light" size="sm">Unsaved edits pending</Badge>
                  )}
                </Group>
                <Title order={2} fw={900} style={{ letterSpacing: -0.5 }}>
                  Account settings
                </Title>
                <Text size="xs" style={{ opacity: 0.85 }}>
                  Configure your display details, privacy levels, and background active CCTV notification settings.
                </Text>
              </Box>

              <Badge
                size="lg"
                variant="filled"
                visibleFrom="sm"
                style={{
                  background: hasUnsavedChanges ? "rgba(253, 126, 20, 0.2)" : "rgba(64, 192, 87, 0.2)",
                  border: `1px solid ${hasUnsavedChanges ? "rgba(253,126,20,0.4)" : "rgba(64,192,87,0.4)"}`,
                  padding: "10px 20px",
                  borderRadius: "9999px",
                  fontWeight: 800,
                  color: hasUnsavedChanges ? "#FFE8CC" : "#D3F9D8"
                }}
              >
                <Group gap="xs">
                  <ThemeIcon size="xs" radius="xl" color={hasUnsavedChanges ? "orange" : "green"}>
                    {hasUnsavedChanges ? <IconAlertTriangle size={10} /> : <IconCheck size={10} />}
                  </ThemeIcon>
                  <span>{hasUnsavedChanges ? "UNSAVED CHANGES" : "SYNCHRONIZED"}</span>
                </Group>
              </Badge>
            </Group>
          </Paper>

          {/* Form alert */}
          {notification && (
            <Alert
              variant="filled"
              color={notification.type === "success" ? "green" : "red"}
              title={notification.type === "success" ? "Changes Saved!" : "Validation Error"}
              withCloseButton={true}
              onClose={() => setNotification(null)}
              icon={notification.type === "success" ? <IconCircleCheck size={18} /> : <IconAlertTriangle size={18} />}
              style={{ borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
            >
              {notification.message}
            </Alert>
          )}

          {/* Split Pane Layout */}
          <Grid gutter="xl">
            
            {/* Left Sidebar Menu */}
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Paper withBorder radius="lg" p="md" style={{ background: cardBg, position: "sticky", top: 100 }}>
                <Text fw={800} size="xs" c="dimmed" mb="md" style={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Preferences Navigation
                </Text>
                
                <Stack gap="xs">
                  {tabsList.map((tab) => {
                    const TabIcon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <UnstyledButton
                        key={tab.id}
                        className="settings-sidebar-btn"
                        data-active={isActive}
                        onClick={() => setActiveTab(tab.id)}
                      >
                        <ThemeIcon size="md" color={isActive ? "blue" : "gray"} variant={isActive ? "filled" : "light"}>
                          <TabIcon size={16} />
                        </ThemeIcon>
                        <Box style={{ flex: 1, minWidth: 0 }}>
                          <Text size="sm" fw={isActive ? 800 : 650} truncate>{tab.label}</Text>
                          <Text size="10px" c="dimmed" truncate>{tab.desc}</Text>
                        </Box>
                      </UnstyledButton>
                    );
                  })}
                </Stack>
              </Paper>
            </Grid.Col>

            {/* Right Form Card Side */}
            <Grid.Col span={{ base: 12, md: 9 }}>
              <form onSubmit={handleSubmit}>
                <Stack gap="lg">
                  
                  <Paper withBorder radius="lg" p="lg" style={{ background: cardBg }} className="hover-lift">
                    {/* Render active section tab inside the gorgeous container */}
                    {activeTab === "profile" && (
                      <ProfileSection
                        formData={formData}
                        handleChange={handleChange}
                        errors={errors}
                      />
                    )}
                    {activeTab === "security" && (
                      <SecuritySection
                        formData={formData}
                        handleChange={handleChange}
                        errors={errors}
                        handleDeleteAccount={handleDeleteAccount}
                        router={router}
                      />
                    )}
                    {activeTab === "preferences" && (
                      <PreferencesSection
                        formData={formData}
                        handleChange={handleChange}
                      />
                    )}
                    {activeTab === "notifications" && (
                      <NotificationsSection
                        formData={formData}
                        handleChange={handleChange}
                      />
                    )}
                    {activeTab === "privacy" && (
                      <PrivacySection
                        formData={formData}
                        handleChange={handleChange}
                      />
                    )}
                  </Paper>

                  {/* Actions Footer row */}
                  <Paper withBorder radius="lg" p="md" style={{ background: cardBg }}>
                    <Group justify="space-between" align="center">
                      <Button
                        variant="light"
                        color="gray"
                        component={Link}
                        href="/user/dashboard"
                        radius="xl"
                        size="md"
                        leftSection={<IconX size={18} />}
                      >
                        Cancel
                      </Button>

                      <Button
                        type="submit"
                        loading={isLoading}
                        disabled={isLoading || !hasUnsavedChanges}
                        radius="xl"
                        size="md"
                        leftSection={<IconCheck size={18} />}
                        bg="linear-gradient(135deg, #2f80ed 0%, #1e56a0 100%)"
                        style={{
                          boxShadow: hasUnsavedChanges 
                            ? "0 4px 14px rgba(47, 128, 237, 0.35)" 
                            : "none",
                          transition: "all 0.3s ease"
                        }}
                      >
                        {isLoading ? "Saving changes..." : "Save Config Details"}
                      </Button>
                    </Group>
                  </Paper>

                  {/* Trust Badge alert */}
                  <Alert
                    variant="light"
                    color="blue"
                    title="🔒 Verified Cloud Synchronization"
                    radius="lg"
                    icon={<IconInfoCircle size={18} />}
                    styles={{
                      root: {
                        border: isDark ? '1px solid rgba(34, 139, 230, 0.2)' : '1px solid rgba(34, 139, 230, 0.1)',
                        background: isDark ? 'rgba(34, 139, 230, 0.03)' : 'rgba(34, 139, 230, 0.01)',
                      },
                    }}
                  >
                    <Text size="xs" c="dimmed" style={{ lineHeight: 1.6 }}>
                      Your preferences and credentials are encrypted during transmission and securely stored in Flega's central MongoDB database. Unsaved changes are monitored locally in real-time to prevent accidental navigation loss.
                    </Text>
                  </Alert>

                </Stack>
              </form>
            </Grid.Col>

          </Grid>

        </Stack>
      </Container>
    </Box>
  );
}