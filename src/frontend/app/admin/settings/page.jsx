"use client";
import { useState } from "react";
import { Box, Title, Text, Paper, Group, Button, Container, Alert, Badge, ActionIcon, useMantineTheme, useMantineColorScheme } from "@mantine/core";
import { IconSettings, IconBell, IconArrowLeft } from "@tabler/icons-react";
import { SettingsNavigation } from "@/app/components/settings/SettingsNavigation";
import { ProfileSection } from "@/app/components/settings/SettingsSections/ProfileSection";
import { SecuritySection } from "@/app/components/settings/SettingsSections/SecuritySection";
import { PreferencesSection } from "@/app/components/settings/SettingsSections/PreferencesSection";
import { NotificationsSection } from "@/app/components/settings/SettingsSections/NotificationsSection";
import { PrivacySection } from "@/app/components/settings/SettingsSections/PrivacySection";
import { useSettingsForm } from "@/app/components/settings/hooks/useSettingsForm";
import { useUnsavedChanges } from "@/app/components/settings/hooks/useUnsavedChanges";
import { validateSettings } from "@/app/components/settings/utils/validators";
import { GRADIENT_PRIMARY } from "@/app/components/settings/utils/constants";

const getBg = (colorScheme, light, dark) => (colorScheme === "dark" ? dark : light);

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const settingsForm = useSettingsForm();
  const formData = settingsForm.formData;
  const isLoading = settingsForm.isLoading;
  const notification = settingsForm.notification;
  const setNotification = settingsForm.setNotification;
  const errors = settingsForm.errors;
  const setErrors = settingsForm.setErrors;
  const handleChange = settingsForm.handleChange;
  const saveSettings = settingsForm.saveSettings;

  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const mainBg = getBg(colorScheme, "#F4F7FE", theme.colors.dark[7]);
  const headerBg = getBg(colorScheme, "white", theme.colors.dark[6]);
  const hasUnsavedChanges = useUnsavedChanges(formData);

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

  return (
    <Box bg={mainBg} style={{ minHeight: "100vh" }}>
      <Group bg={headerBg} p="md" style={{ borderBottom: "1px solid #E9EDF7" }} justify="space-between">
        <Group gap="md">
          <ActionIcon variant="subtle" color="gray" onClick={() => window.history.back()}>
            <IconArrowLeft size={20} />
          </ActionIcon>
          <Title order={3} fw={700}>Admin Settings</Title>
          <Badge color="blue" variant="light" size="sm">ADMIN</Badge>
        </Group>
        <Group gap="xs">
          <ActionIcon variant="subtle" color="gray"><IconSettings size={20} /></ActionIcon>
          <ActionIcon variant="subtle" color="red"><IconBell size={20} /></ActionIcon>
        </Group>
      </Group>

      <Container size="xl" py="xl" px="md">
        <Box style={{ background: GRADIENT_PRIMARY, padding: "3rem 0", marginBottom: "2rem", borderRadius: "16px" }}>
          <Container size="xl">
            <Group justify="space-between" align="center">
              <div>
                <Title order={1} c="white">Admin Settings</Title>
                <Text c="white" size="lg" opacity={0.9}>Manage system and account preferences</Text>
              </div>
              <Badge size="xl" variant="filled" style={{ background: hasUnsavedChanges ? "rgba(255,255,255,0.2)" : "rgba(74,222,128,0.3)" }}>
                {hasUnsavedChanges ? "Unsaved Changes" : "All Saved"}
              </Badge>
            </Group>
          </Container>
        </Box>

        {notification && (
          <Alert mb="md" variant="filled" color={notification.type === "success" ? "green" : "red"} title={notification.type === "success" ? "Success!" : "Error!"} withCloseButton onClose={() => setNotification(null)}>
            {notification.message}
          </Alert>
        )}

        <SettingsNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

        <Paper withBorder shadow="xl" p="xl" radius="lg" bg={getBg(colorScheme, "white", theme.colors.dark[6])}>
          <form onSubmit={handleSubmit}>
            {activeTab === "profile" && <ProfileSection formData={formData} handleChange={handleChange} errors={errors} />}
            {activeTab === "security" && <SecuritySection formData={formData} handleChange={handleChange} errors={errors} />}
            {activeTab === "preferences" && <PreferencesSection formData={formData} handleChange={handleChange} />}
            {activeTab === "notifications" && <NotificationsSection formData={formData} handleChange={handleChange} />}
            {activeTab === "privacy" && <PrivacySection formData={formData} handleChange={handleChange} />}
            <Group justify="space-between" mt="lg" pt="lg" style={{ borderTop: "1px solid #e9ecef" }}>
              <Button variant="light" color="gray" component="a" href="/admin" size="lg" radius="md" leftSection={<IconArrowLeft size={20} />}>Back</Button>
              <Button type="submit" loading={isLoading} disabled={isLoading || !hasUnsavedChanges} size="lg" radius="md" style={{ background: GRADIENT_PRIMARY }}>{isLoading ? "Saving..." : "Save changes"}</Button>
            </Group>
          </form>
        </Paper>
      </Container>
    </Box>
  );
}
