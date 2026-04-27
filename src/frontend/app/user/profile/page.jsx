"use client";

import { useState, useEffect } from "react";
import { Box, Group, Title, ActionIcon, Button, Flex, Container } from "@mantine/core";
import { useMantineColorScheme } from "@mantine/core";
import { IconArrowLeft, IconDeviceFloppy } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

// Import components
import ProfileSidebar from "../../components/profile/ProfileSidebar";
import AccountTab from "../../components/profile/AccountTab";
import SecurityTab from "../../components/profile/SecurityTab";
import AppearanceTab from "../../components/profile/AppearanceTab";
import AlertHistoryTab from "../../components/profile/AlertHistoryTab";

// Helper
const getBg = (colorScheme, light, dark) => (colorScheme === "dark" ? dark : light);
const getBorderColor = (colorScheme) => (colorScheme === "dark" ? "#2c2e33" : "#eaeef2");

export default function ProfilePage() {
  const router = useRouter();
  const { colorScheme } = useMantineColorScheme();
  const [activeTab, setActiveTab] = useState("account");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("currentUser");
    if (userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  // --------------------- LOGGING FUNCTION ---------------------
  const createProfileLog = async (action, details = {}) => {
    try {
      if (!user) return;
      let ip = "unknown";
      try {
        const ipRes = await fetch("https://api.ipify.org?format=json");
        const ipData = await ipRes.json();
        ip = ipData.ip;
      } catch (e) { /* ignore */ }

      const logEntry = {
        userId: user.id,
        userEmail: user.email,
        action,
        ...details,
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
        ipAddress: ip,
      };

      await fetch("http://localhost:3001/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(logEntry),
      });
    } catch (error) {
      console.error("Profile log failed:", error);
      // Non‑blocking
    }
  };
  // -------------------------------------------------------------

  // Callback handlers for child components
  const handleAccountSave = (updatedUser) => {
    setUser(updatedUser);
    setDirty(false);
    // Log the profile update
    createProfileLog("profile_update", {
      updatedFields: "account info",  // could be more specific if needed
    });
    // Also update localStorage (the tab already does it, but we can do it here as well)
    localStorage.setItem("currentUser", JSON.stringify(updatedUser));
  };

  const handleSecurityChange = (changeType) => {
    createProfileLog("security_change", { change: changeType });
  };

  const handleAppearanceToggle = (newMode) => {
    createProfileLog("appearance_change", { colorMode: newMode });
  };

  const handleAlertHistoryClear = () => {
    createProfileLog("alert_history_cleared");
  };

  // The tabs that require logging will call the corresponding functions.
  // We pass them as props to the tab components.
  // Note: If the imported tab components do not yet accept these props, you'll need to add them.

  if (loading) {
    return (
      <Box bg={getBg(colorScheme, "#fff", "#1a1b1e")} style={{ minHeight: "100vh" }}>
        <Container size="lg" py={48}>
          <div>Loading...</div>
        </Container>
      </Box>
    );
  }

  return (
    <Box bg={getBg(colorScheme, "#fff", "#1a1b1e")} style={{ minHeight: "100vh" }}>
      {/* Header */}
      <Box
        bg={getBg(colorScheme, "#fff", "#1a1b1e")}
        style={{
          borderBottom: `1px solid ${getBorderColor(colorScheme)}`,
          padding: "12px 24px",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <Group justify="space-between">
          <Group gap="sm">
            <ActionIcon variant="subtle" onClick={() => router.back()} size="lg">
              <IconArrowLeft size={20} />
            </ActionIcon>
            <Title order={4} fw={400}>Settings</Title>
          </Group>
        </Group>
      </Box>

      <Flex justify="center">
        <ProfileSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          colorScheme={colorScheme}
        />

        <Box style={{ flex: 1, padding: "32px", maxWidth: 900, margin: "0 auto" }}>
          {activeTab === "account" && (
            <AccountTab
              user={user}
              setUser={setUser}
              setDirty={setDirty}
              colorScheme={colorScheme}
              onSave={handleAccountSave}        // <-- added
              onLog={createProfileLog}          // optional fallback
            />
          )}
          {activeTab === "security" && (
            <SecurityTab
              colorScheme={colorScheme}
              onLog={createProfileLog}
              onSecurityChange={handleSecurityChange}   // <-- added
            />
          )}
          {activeTab === "appearance" && (
            <AppearanceTab
              colorScheme={colorScheme}
              onLog={createProfileLog}
              onAppearanceToggle={handleAppearanceToggle} // <-- added
            />
          )}
          {activeTab === "alert-history" && (
            <AlertHistoryTab
              colorScheme={colorScheme}
              onLog={createProfileLog}
              onClearHistory={handleAlertHistoryClear}   // <-- added
            />
          )}
        </Box>
      </Flex>
    </Box>
  );
}