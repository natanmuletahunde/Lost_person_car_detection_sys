"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Container,
  Title,
  Text,
  Button,
  TextInput,
  Select,
  Paper,
  Stack,
  Group,
  Avatar,
  ActionIcon,
  Menu,
  UnstyledButton,
  useMantineTheme,
  useMantineColorScheme,
  Loader,
  Alert,
  Card,
  Checkbox,
  NumberInput,
  Divider,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconDeviceMobile,
  IconCheck,
  IconAlertCircle,
  IconHome,
  IconUser,
  IconBell,
  IconSettings,
  IconLogout,
  IconMapPin,
  IconMap,
  IconCirclePlus,
} from "@tabler/icons-react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import MainFooter from "../../../components/MainFooter";
import { notifications } from "@mantine/notifications";

// Dynamically import LocationPicker to avoid SSR issues
const LocationPicker = dynamic(() => import("../../../components/LocationPicker"), {
  ssr: false,
  loading: () => (
    <Box
      style={{
        height: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f0f5ff",
        borderRadius: "12px",
      }}
    >
      <Loader size="lg" color="#2f80ed" />
    </Box>
  ),
});

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";
const GPS_DEVICES_API = `${API_BASE_URL}/gpsDevices`;

export default function RegisterBeltPage() {
  const router = useRouter();
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const [form, setForm] = useState({
    name: "",
    serialNumber: "",
    assignedTo: "",
    status: "active",
    battery: 100,
  });

  // Location & geofence state
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [enableGeofence, setEnableGeofence] = useState(false);
  const [geofenceRadius, setGeofenceRadius] = useState(100);

  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const getBg = (light, dark) => (colorScheme === "dark" ? dark : light);
  const headerBg = getBg("white", theme.colors.dark[6]);
  const borderColor = getBg("#E9ECEF", theme.colors.dark[5]);
  const mainBg = getBg("white", theme.colors.dark[7]);

  // ----------------- LOGGING FUNCTION -----------------
  const createActionLog = async (action, details = {}) => {
    try {
      if (!currentUser) return;
      let ip = "unknown";
      try {
        const ipRes = await fetch("https://api.ipify.org?format=json");
        const ipData = await ipRes.json();
        ip = ipData.ip;
      } catch (e) { /* ignore */ }

      const logEntry = {
        userId: currentUser.id,
        userEmail: currentUser.email,
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
      console.error("Action log failed:", error);
      // Non‑blocking
    }
  };
  // -----------------------------------------------------

  // Load current user and log page view
  useEffect(() => {
    const userData = localStorage.getItem("currentUser");
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
      createActionLog("register_belt_page_view");
    } else {
      // If no user, redirect to login (optional)
      router.push("/login");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLocationSelect = (lat, lng, address) => {
    setSelectedLocation({ lat, lng, address });
  };

  const handleSubmit = async () => {
    if (!form.name || !form.serialNumber) {
      notifications.show({
        title: "Missing Fields",
        message: "Device name and serial number are required",
        color: "yellow",
        icon: <IconAlertCircle size={16} />,
      });
      return;
    }

    setSubmitting(true);
    try {
      const newDevice = {
        id: Date.now().toString(),
        ...form,
        battery: parseInt(form.battery, 10),
        lastLocation: selectedLocation
          ? {
              lat: selectedLocation.lat,
              lng: selectedLocation.lng,
              address: selectedLocation.address,
              location: selectedLocation.address,
              timestamp: new Date().toISOString(),
            }
          : null,
        geofence: enableGeofence && selectedLocation
          ? {
              lat: selectedLocation.lat,
              lng: selectedLocation.lng,
              radius: geofenceRadius,
            }
          : null,
        createdAt: new Date().toISOString(),
      };
      const res = await fetch(GPS_DEVICES_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDevice),
      });
      if (!res.ok) throw new Error("Failed to register");

      // Log successful registration
      createActionLog("device_registered", {
        deviceName: form.name,
        serialNumber: form.serialNumber,
        hasGeofence: enableGeofence,
      });

      notifications.show({
        title: "Success",
        message: `${form.name} has been registered with initial location${enableGeofence ? " and geofence" : ""}.`,
        color: "green",
        icon: <IconCheck size={16} />,
      });
      router.push("/gps-tracking");
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Could not register device",
        color: "red",
        icon: <IconAlertCircle size={16} />,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    createActionLog("logout", { fromPage: "register-belt" });
    localStorage.removeItem("currentUser");
    router.push("/login");
  };

  return (
    <Box bg={mainBg} style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Box
        bg={headerBg}
        py="sm"
        style={{
          borderBottom: `1px solid ${borderColor}`,
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <Container size="xl">
          <Group justify="space-between">
            <Link href="/" style={{ flexShrink: 0 }}>
              <Image
                src="/logo.jpg"
                alt="Logo"
                width={0}
                height={50}
                sizes="100vw"
                style={{ width: "auto", height: "50px", borderRadius: "8px" }}
              />
            </Link>
            <Group gap="lg">
              <ActionIcon variant="transparent" color="gray" size="lg" component={Link} href="/">
                <IconHome size={28} />
              </ActionIcon>
              <Menu shadow="md" width={320} radius="md">
                <Menu.Target>
                  <UnstyledButton>
                    <Group gap="sm">
                      <Box ta="right" visibleFrom="xs">
                        <Text fw={800} size="md">
                          {currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "User"}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {currentUser?.role || "Personal account"}
                        </Text>
                      </Box>
                      <Avatar src={null} alt="User" color="blue" size="md" radius="xl" />
                    </Group>
                  </UnstyledButton>
                </Menu.Target>
                <Menu.Dropdown p="md">
                  <Stack gap={4}>
                    <Menu.Item leftSection={<IconUser size={20} />} component={Link} href="/profile">
                      Profile
                    </Menu.Item>
                    <Menu.Item leftSection={<IconBell size={20} />} component={Link} href="/alert">
                      Notifications
                    </Menu.Item>
                    <Menu.Item leftSection={<IconSettings size={20} />} component={Link} href="/settings">
                      Settings
                    </Menu.Item>
                    <Menu.Divider />
                    <Menu.Item
                      color="red"
                      leftSection={<IconLogout size={20} />}
                      onClick={handleLogout}
                    >
                      Logout
                    </Menu.Item>
                  </Stack>
                </Menu.Dropdown>
              </Menu>
            </Group>
          </Group>
        </Container>
      </Box>

      <Container size="md" py={40} style={{ flex: 1 }}>
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={18} />}
          onClick={() => router.push("/gps-tracking")}
          mb="lg"
        >
          Back to GPS Tracking
        </Button>

        <Paper withBorder radius="lg" p="xl" shadow="sm">
          <Group gap="sm" mb="lg">
            <IconDeviceMobile size={32} color="#2f80ed" />
            <Title order={2}>Register New Smart Belt</Title>
          </Group>
          <Text c="dimmed" mb="xl">
            Fill in the details to add a new GPS tracking device to the system. You can optionally set its initial location and a geofence.
          </Text>

          <Stack gap="md">
            <TextInput
              label="Device Name"
              placeholder="e.g., Belt for Patient A"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              radius="md"
            />
            <TextInput
              label="Serial Number"
              placeholder="Unique hardware ID"
              value={form.serialNumber}
              onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
              required
              radius="md"
            />
            <TextInput
              label="Assigned To (optional)"
              placeholder="Person name or case ID"
              value={form.assignedTo}
              onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
              radius="md"
            />
            <Select
              label="Initial Status"
              data={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
                { value: "low_battery", label: "Low Battery" },
              ]}
              value={form.status}
              onChange={(value) => setForm({ ...form, status: value })}
              radius="md"
            />
            <NumberInput
              label="Initial Battery (%)"
              min={0}
              max={100}
              value={form.battery}
              onChange={(value) => setForm({ ...form, battery: value || 0 })}
              radius="md"
            />

            <Divider label="Location & Geofence" labelPosition="center" my="md" />

            {/* Map picker for initial location */}
            <Card withBorder radius="md" padding={0} style={{ overflow: "hidden" }}>
              <LocationPicker onLocationSelect={handleLocationSelect} />
            </Card>

            {selectedLocation && (
              <Alert icon={<IconMapPin size={16} />} color="blue" variant="light">
                Selected location: {selectedLocation.address || `${selectedLocation.lat}, ${selectedLocation.lng}`}
              </Alert>
            )}

            <Checkbox
              label="Set a geofence at this location"
              checked={enableGeofence}
              onChange={(e) => setEnableGeofence(e.currentTarget.checked)}
              disabled={!selectedLocation}
            />
            {enableGeofence && selectedLocation && (
              <NumberInput
                label="Geofence radius (meters)"
                min={10}
                max={5000}
                value={geofenceRadius}
                onChange={(value) => setGeofenceRadius(value || 100)}
                radius="md"
                leftSection={<IconCirclePlus size={16} />}
              />
            )}

            <Group justify="flex-end" mt="lg">
              <Button variant="default" onClick={() => router.push("/gps-tracking")}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} loading={submitting} color="blue">
                Register Device
              </Button>
            </Group>
          </Stack>
        </Paper>
      </Container>

      <MainFooter />
    </Box>
  );
}