"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Box,
  Container,
  Title,
  Text,
  Group,
  Button,
  Paper,
  Stack,
  Avatar,
  Badge,
  SimpleGrid,
  ActionIcon,
  Loader,
  Card,
  TextInput,
  Menu,
  UnstyledButton,
  Checkbox,
  Image as MantineImage,
  Grid,
  useMantineTheme,
  useMantineColorScheme,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconMapPin,
  IconCalendar,
  IconArrowLeft,
  IconDownload,
  IconCamera,
  IconCheck,
  IconSearch,
  IconHome,
  IconUser,
  IconBell,
  IconShieldCheck,
  IconHistory,
  IconSettings,
  IconLogout,
  IconPhoto,
  IconMap,
  IconMapPinFilled,
} from "@tabler/icons-react";
import Link from "next/link";
import Image from "next/image";
import MainFooter from "../../../../../../components/MainFooter";
import { notifications } from "@mantine/notifications";

// Leaflet imports
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// API Endpoints
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
const MISSING_PERSONS_API = `${API_BASE_URL}/missingPersons`;
const MISSING_VEHICLES_API = `${API_BASE_URL}/missingVehicles`;
const SIGHTINGS_API = `${API_BASE_URL}/sightings`;

// Helper to get dynamic background/color values
const getBg = (colorScheme, light, dark) => (colorScheme === 'dark' ? dark : light);
const getTextColor = (colorScheme, light, dark) => (colorScheme === 'dark' ? dark : light);

export default function SingleDetectionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const [alertData, setAlertData] = useState(null);
  const [detectionData, setDetectionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isFalseAlert, setIsFalseAlert] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const markerRef = useRef(null);

  // Dynamic colors
  const mainBg = getBg(colorScheme, 'white', theme.colors.dark[7]);
  const headerBg = getBg(colorScheme, 'white', theme.colors.dark[6]);
  const borderColor = getBg(colorScheme, '#E9ECEF', theme.colors.dark[5]);
  const paperBg = getBg(colorScheme, 'white', theme.colors.dark[6]);
  const detectionMetadataHeaderBg = getBg(colorScheme, '#f8f9fa', theme.colors.dark[5]);
  const detectionMetadataText = getTextColor(colorScheme, '#212529', theme.colors.gray[3]);
  const backButtonBg = '#399afc';

  // Load current user from localStorage for logging
  useEffect(() => {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      try {
        setCurrentUser(JSON.parse(userData));
      } catch (e) { /* ignore */ }
    }
  }, []);

  // ----------------- LOGGING FUNCTION -----------------
  const createActionLog = async (action, details = {}) => {
    try {
      if (!currentUser) return;
      let ip = 'unknown';
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipRes.json();
        ip = ipData.ip;
      } catch (e) { /* ignore */ }

      const logEntry = {
        userId: currentUser.id,
        userEmail: currentUser.email,
        action,
        ...details,
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        ipAddress: ip,
      };

      await fetch('http://localhost:3001/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry),
      });
    } catch (error) {
      console.error('Logging failed:', error);
    }
  };
  // ----------------------------------------------------

  // Fetch data from APIs
  useEffect(() => {
    const fetchData = async () => {
      const caseId = params?.id;
      const detectionId = params?.detection_id;

      if (!caseId || !detectionId) {
        setError('Missing case or detection ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // 1. Fetch the sighting by detection_id
        const sightingRes = await fetch(`${SIGHTINGS_API}/${detectionId}`);
        if (!sightingRes.ok) {
          throw new Error('Sighting not found');
        }
        const sighting = await sightingRes.json();

        // 2. Determine which type of case it belongs to (person or vehicle)
        let caseData = null;
        if (sighting.type === 'Person') {
          const personRes = await fetch(`${MISSING_PERSONS_API}/${caseId}`);
          if (personRes.ok) {
            caseData = await personRes.json();
          }
        } else if (sighting.type === 'Vehicle') {
          const vehicleRes = await fetch(`${MISSING_VEHICLES_API}/${caseId}`);
          if (vehicleRes.ok) {
            caseData = await vehicleRes.json();
          }
        } else {
          // If sighting doesn't have type, try both APIs
          const [personRes, vehicleRes] = await Promise.all([
            fetch(`${MISSING_PERSONS_API}/${caseId}`),
            fetch(`${MISSING_VEHICLES_API}/${caseId}`),
          ]);
          if (personRes.ok) {
            caseData = await personRes.json();
          } else if (vehicleRes.ok) {
            caseData = await vehicleRes.json();
          }
        }

        if (!caseData) {
          throw new Error('Original case not found');
        }

        // Transform sighting to match expected structure
        const transformedDetection = {
          id: sighting.id,
          name: sighting.type === 'Person' ? sighting.name : `${sighting.brand || ''} ${sighting.model || ''}`.trim() || sighting.plateNumber,
          location: sighting.location,
          date: sighting.date || new Date(sighting.reportDate).toLocaleDateString(),
          time: sighting.time || new Date(sighting.reportDate).toLocaleTimeString(),
          type: sighting.type === 'Person' ? 'Sighting' : 'Detection',
          accuracy: '98%', // placeholder
          description: sighting.description,
          image: sighting.imagePreview,
          latitude: sighting.latitude,
          longitude: sighting.longitude,
        };

        // Transform case data to match expected alert structure
        const transformedCase = {
          id: caseData.id,
          code: caseData.caseId || `CASE-${caseData.id}`,
          type: caseData.type || (caseData.firstName ? 'Person' : 'Vehicle'),
          category: {
            type: caseData.type || (caseData.firstName ? 'Person' : 'Vehicle'),
            brandName: caseData.brand || `${caseData.firstName || ''} ${caseData.lastName || ''}`.trim() || 'Unknown',
            plateNumber: caseData.plateNumber || 'N/A',
          },
          color: caseData.color || 'Unknown',
          registeredLocation: caseData.location || caseData.lastSeenLocation || 'Unknown',
          registeredDate: caseData.reportDate ? new Date(caseData.reportDate).toLocaleDateString() : 'Unknown',
          registeredTime: caseData.reportDate ? new Date(caseData.reportDate).toLocaleTimeString() : 'Unknown',
          capturedMedia: {
            photos: caseData.additionalImages || (caseData.imagePreview ? [caseData.imagePreview] : []),
          },
          additionalImages: caseData.additionalImages || [],
          detectionHistory: [],
          accuracy: '98%',
        };

        setDetectionData(transformedDetection);
        setAlertData(transformedCase);
        setError(null);

        // LOG PAGE VIEW after successful load
        createActionLog('detection_detail_view', {
          caseId,
          detectionId,
          name: transformedDetection.name,
          type: transformedDetection.type,
        });
      } catch (err) {
        console.error('Error fetching detection detail:', err);
        setError(err.message);
        notifications.show({
          title: 'Error',
          message: 'Failed to load detection details',
          color: 'red',
          icon: <IconAlertCircle size={16} />,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params?.id, params?.detection_id]);

  // Initialize Leaflet map when detectionData is available
  useEffect(() => {
    if (!detectionData || !mapRef.current) return;

    if (leafletMap.current) {
      leafletMap.current.remove();
      leafletMap.current = null;
    }

    const lat = detectionData.latitude ? parseFloat(detectionData.latitude) : 9.03;
    const lng = detectionData.longitude ? parseFloat(detectionData.longitude) : 38.74;

    const map = L.map(mapRef.current).setView([lat, lng], 15);
    leafletMap.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const marker = L.marker([lat, lng])
      .bindPopup(`
        <b>${detectionData.name}</b><br>
        ${detectionData.location}<br>
        ${detectionData.date} ${detectionData.time}<br>
        Accuracy: ${detectionData.accuracy}
      `)
      .addTo(map);
    marker.openPopup();
    markerRef.current = marker;

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, [detectionData]);

  // Handle confirmation selection (just sets state)
  const handleConfirmation = (type) => {
    if (type === 'owner') {
      setIsOwner(true);
      setIsFalseAlert(false);
    } else if (type === 'false') {
      setIsOwner(false);
      setIsFalseAlert(true);
    }
    // No logging here – logging will happen on Submit
  };

  // Handle submit of response
  const handleSubmitResponse = () => {
    if (!isOwner && !isFalseAlert) return;

    if (isOwner) {
      createActionLog('detection_owner_confirmed', {
        caseId: params.id,
        detectionId: params.detection_id,
      });
      console.log('Owner confirmed');
      // Future: send to backend
    } else if (isFalseAlert) {
      createActionLog('detection_false_alert', {
        caseId: params.id,
        detectionId: params.detection_id,
      });
      console.log('False alert reported');
      // Future: send to backend
    }

    // Optional notification
    notifications.show({
      title: 'Response Submitted',
      message: isOwner ? 'You confirmed ownership.' : 'You reported a false alert.',
      color: isOwner ? 'green' : 'red',
      icon: <IconCheck size={16} />,
    });
  };

  // Handle export details
  const handleExport = () => {
    createActionLog('detection_export', {
      caseId: params.id,
      detectionId: params.detection_id,
    });
    // Actual export logic could go here
    console.log('Exporting details...');
  };

  if (loading) {
    return (
      <Box
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: mainBg,
        }}
      >
        <Loader size="lg" />
      </Box>
    );
  }

  if (error || !alertData || !detectionData) {
    return (
      <Box style={{ padding: "40px", textAlign: "center", backgroundColor: mainBg }}>
        <Title order={2}>Detection Not Found</Title>
        <Text c="dimmed" mt="md">{error || 'The requested detection could not be loaded.'}</Text>
        <Button onClick={() => router.push(`/alert-detail/${params.id}`)} mt="md">
          Back to Alert
        </Button>
      </Box>
    );
  }

  return (
    <Box
      style={{
        minHeight: "100vh",
        backgroundColor: mainBg,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header - unchanged */}
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
            <Image
              src="/logo.jpg"
              alt="Logo"
              width={0}
              height={50}
              sizes="100vw"
              style={{ width: "auto", height: "50px", borderRadius: "8px" }}
            />

            <TextInput
              placeholder="Search alerts by brand, code, location..."
              leftSection={<IconSearch size={16} />}
              style={{ width: "40%" }}
              radius="xl"
            />

            <Group gap="lg">
              <ActionIcon
                variant="transparent"
                color="gray"
                size="lg"
                component={Link}
                href="/"
              >
                <IconHome size={28} />
              </ActionIcon>

              <Menu
                shadow="md"
                width={320}
                radius="md"
                transitionProps={{ transition: "pop-top-right" }}
              >
                <Menu.Target>
                  <UnstyledButton>
                    <Group gap="sm">
                      <Box ta="right" visibleFrom="xs">
                        <Text fw={800} size="md">
                          User
                        </Text>
                        <Text size="xs" c="dimmed">
                          Personal account
                        </Text>
                      </Box>
                      <Avatar
                        src={null}
                        alt="User"
                        color="blue"
                        size="md"
                        radius="xl"
                      />
                    </Group>
                  </UnstyledButton>
                </Menu.Target>
                <Menu.Dropdown p="md">
                  <Group justify="space-between" mb="xs">
                    <Text size="sm" fw={700}>
                      Personal account
                    </Text>
                    <ActionIcon variant="subtle" size="sm" color="gray">
                      <IconLogout size={14} />
                    </ActionIcon>
                  </Group>
                  <Stack gap={4}>
                    <Menu.Item leftSection={<IconUser size={20} />}>
                      Person
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<IconBell size={20} />}
                      onClick={() => router.push("/alert")}
                    >
                      Notification
                    </Menu.Item>
                    <Menu.Item leftSection={<IconShieldCheck size={20} />}>
                      Privacy and Policy
                    </Menu.Item>
                    <Menu.Item leftSection={<IconBell size={20} />}>
                      Alerts
                    </Menu.Item>
                    <Menu.Item leftSection={<IconHistory size={20} />}>
                      History
                    </Menu.Item>
                    <Menu.Item leftSection={<IconSettings size={20} />}>
                      Settings
                    </Menu.Item>
                  </Stack>
                  <Menu.Divider />
                  <Menu.Item
                    color="red"
                    leftSection={<IconLogout size={20} />}
                    onClick={() => {
                      // Optional: log logout
                      localStorage.removeItem('currentUser');
                      router.push('/login');
                    }}
                  >
                    Logout
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
          </Group>
        </Container>
      </Box>

      {/* Back Navigation - unchanged */}
      <Box style={{ padding: "24px 0 16px 0" }}>
        <Container size="xl">
          <Group>
            <Button
              variant="subtle"
              color="white"
              leftSection={<IconArrowLeft size={18} />}
              onClick={() => router.push(`/alert-detail/${params.id}`)}
              size="md"
              style={{
                backgroundColor: backButtonBg,
                padding: "10px"
              }}
            >
              
            </Button>
            <Box style={{ marginLeft: "16px" }}>
              <Text fw={800} size="xl" style={{ color: detectionMetadataText }}>
                Detection Detail
              </Text>
              <Text size="sm" c="dimmed">
                Alert: {alertData.code} • Detection: {detectionData.name} • {detectionData.location}
              </Text>
            </Box>
          </Group>
        </Container>
      </Box>

      {/* Main Content */}
      <Container size="xl" py={40} style={{ flex: 1 }}>
        <Box mb="xl">
          <Title order={1} style={{ color: detectionMetadataText }}>{detectionData.name}</Title>
        </Box>

        <Grid gutter="xl">
          {/* LEFT COLUMN: Map - unchanged */}
          <Grid.Col span={{ base: 12, md: 7 }}>
            <Paper withBorder radius="md" style={{ height: "500px", overflow: "hidden" }}> 
              <Box
                p="md"
                style={{
                  borderBottom: `1px solid ${borderColor}`,
                  backgroundColor: "#1e40af",
                  color: "white",
                  borderTopLeftRadius: "8px",
                  borderTopRightRadius: "8px",
                }}
              >
                <Group>
                  <IconMap size={20} />
                  <Text fw={600} size="lg">Detection Map - {detectionData.location}</Text>
                </Group>
              </Box>
              
              {/* Leaflet map container */}
              <div
                ref={mapRef}
                style={{
                  height: "calc(100% - 65px)",
                  width: "100%",
                  borderRadius: "0 0 8px 8px",
                }}
              />
            </Paper>
          </Grid.Col>

          {/* RIGHT COLUMN: Info Cards */}
          <Grid.Col span={{ base: 12, md: 5 }}>
            <Stack gap="lg">
              {/* Accuracy Card – unchanged */}
              <Paper 
                withBorder 
                radius="md"
                style={{
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                  overflow: "hidden",
                  borderLeft: "4px solid #3b82f6",
                }}
              >
                <Box
                  p="md"
                  style={{
                    background: getBg(colorScheme, "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)", "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)"),
                  }}
                >
                  <Group justify="space-between" align="center">
                    <Box>
                      <Text fw={700} size="lg" style={{ color: getBg(colorScheme, "#0369a1", theme.colors.blue[2]) }}>
                        🎯 Accuracy
                      </Text>
                      <Text size="sm" c="dimmed">
                        Detection confidence
                      </Text>
                    </Box>
                    <Badge
                      size="xl"
                      variant="filled"
                      color="blue"
                      style={{ 
                        fontWeight: 800,
                        fontSize: "16px",
                        padding: "8px 12px",
                        borderRadius: "8px",
                      }}
                    >
                      {detectionData.accuracy}
                    </Badge>
                  </Group>
                </Box>
              </Paper>

              {/* Category Card – unchanged */}
              <Paper 
                withBorder 
                radius="md"
                style={{
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                  overflow: "hidden",
                  borderLeft: "4px solid #10b981",
                }}
              >
                <Box
                  p="md"
                  style={{
                    background: getBg(colorScheme, "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)", "linear-gradient(135deg, #14532d 0%, #166534 100%)"),
                  }}
                >
                  <Text fw={700} size="lg" style={{ color: getBg(colorScheme, "#047857", theme.colors.green[2]) }} mb="12px">
                    🚗 Category
                  </Text>
                  <Stack gap="md">
                    <Box pl="md">
                      <Text size="sm" fw={600} style={{ color: getBg(colorScheme, "#065f46", theme.colors.green[2]) }}>
                        Type: <span style={{ color: getBg(colorScheme, "#374151", theme.colors.gray[3]) }}>{alertData.category?.type}</span>
                      </Text>
                      <Box pl="md" mt="xs">
                        <Text size="sm" fw={600} style={{ color: getBg(colorScheme, "#065f46", theme.colors.green[2]) }}>
                          Brand/Name: <span style={{ color: getBg(colorScheme, "#374151", theme.colors.gray[3]) }}>{alertData.category?.brandName}</span>
                        </Text>
                        <Box pl="md" mt="xs">
                          <Text size="sm" fw={600} style={{ color: getBg(colorScheme, "#065f46", theme.colors.green[2]) }}>
                            Plate:
                          </Text>
                          <Box 
                            p="xs" 
                            mt="xs" 
                            style={{ 
                              backgroundColor: "#10b981", 
                              borderRadius: "6px",
                              display: "inline-block",
                            }}
                          >
                            <Text size="sm" fw={800} style={{ color: "white", letterSpacing: "1px" }}>
                              {alertData.category?.plateNumber}
                            </Text>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                    <Box pl="md">
                      <Text size="sm" fw={600} style={{ color: getBg(colorScheme, "#065f46", theme.colors.green[2]) }}>
                        Color:
                      </Text>
                      <Group gap="xs" mt="xs">
                        <Box
                          style={{
                            width: "20px",
                            height: "20px",
                            backgroundColor: alertData.color === "Silver" ? "#d1d5db" : 
                                           alertData.color === "White" ? "#ffffff" :
                                           alertData.color === "Black" ? "#000000" :
                                           alertData.color === "Red" ? "#ef4444" : "#d1d5db",
                            borderRadius: "4px",
                            border: "1px solid #9ca3af",
                          }}
                        />
                        <Text size="sm" fw={600} style={{ color: getBg(colorScheme, "#374151", theme.colors.gray[3]) }}>
                          {alertData.color}
                        </Text>
                      </Group>
                    </Box>
                  </Stack>
                </Box>
              </Paper>

              {/* Registered Location Card – unchanged */}
              <Paper 
                withBorder 
                radius="md"
                style={{
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                  overflow: "hidden",
                  borderLeft: "4px solid #8b5cf6",
                }}
              >
                <Box
                  p="md"
                  style={{
                    background: getBg(colorScheme, "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)", "linear-gradient(135deg, #4c1d95 0%, #5b21b6 100%)"),
                  }}
                >
                  <Group align="flex-start">
                    <Box
                      style={{
                        backgroundColor: "#8b5cf6",
                        padding: "8px",
                        borderRadius: "8px",
                        color: "white",
                      }}
                    >
                      <IconMapPin size={20} />
                    </Box>
                    <Box style={{ flex: 1 }}>
                      <Text fw={700} size="lg" style={{ color: getBg(colorScheme, "#7c3aed", theme.colors.violet[2]) }}>
                        Registered Location
                      </Text>
                      <Text size="sm" style={{ color: getBg(colorScheme, "#6b7280", theme.colors.gray[3]) }} mt="4px">
                        {alertData.registeredLocation}
                      </Text>
                    </Box>
                  </Group>
                </Box>
              </Paper>

              {/* Registered Date Card – unchanged */}
              <Paper 
                withBorder 
                radius="md"
                style={{
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                  overflow: "hidden",
                  borderLeft: "4px solid #f59e0b",
                }}
              >
                <Box
                  p="md"
                  style={{
                    background: getBg(colorScheme, "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)", "linear-gradient(135deg, #92400e 0%, #b45309 100%)"),
                  }}
                >
                  <Group align="flex-start">
                    <Box
                      style={{
                        backgroundColor: "#f59e0b",
                        padding: "8px",
                        borderRadius: "8px",
                        color: "white",
                      }}
                    >
                      <IconCalendar size={20} />
                    </Box>
                    <Box style={{ flex: 1 }}>
                      <Text fw={700} size="lg" style={{ color: getBg(colorScheme, "#d97706", theme.colors.orange[2]) }}>
                        Registered Date
                      </Text>
                      <Stack gap="xs" mt="xs">
                        <Group gap="xs">
                          <Badge color="orange" variant="light" size="sm">
                            Date
                          </Badge>
                          <Text size="sm" fw={600} style={{ color: getBg(colorScheme, "#374151", theme.colors.gray[3]) }}>
                            {alertData.registeredDate}
                          </Text>
                        </Group>
                        <Group gap="xs">
                          <Badge color="orange" variant="light" size="sm">
                            Time
                          </Badge>
                          <Text size="sm" fw={600} style={{ color: getBg(colorScheme, "#374151", theme.colors.gray[3]) }}>
                            {alertData.registeredTime}
                          </Text>
                        </Group>
                      </Stack>
                    </Box>
                  </Group>
                </Box>
              </Paper>

              {/* Captured Media Card – unchanged */}
              <Paper 
                withBorder 
                radius="md"
                style={{
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                  overflow: "hidden",
                  borderLeft: "4px solid #ec4899",
                }}
              >
                <Box
                  p="md"
                  style={{
                    background: getBg(colorScheme, "linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)", "linear-gradient(135deg, #831843 0%, #9d174d 100%)"),
                  }}
                >
                  <Group justify="space-between" align="center" mb="md">
                    <Group>
                      <Box
                        style={{
                          backgroundColor: "#ec4899",
                          padding: "8px",
                          borderRadius: "8px",
                          color: "white",
                        }}
                      >
                        <IconCamera size={20} />
                      </Box>
                      <Box>
                        <Text fw={700} size="lg" style={{ color: getBg(colorScheme, "#db2777", theme.colors.pink[2]) }}>
                          Captured Media
                        </Text>
                        <Text size="sm" c="dimmed">
                          Photos & Videos
                        </Text>
                      </Box>
                    </Group>
                    <Badge color="pink" variant="light">
                      {alertData.capturedMedia?.photos?.length || 0} items
                    </Badge>
                  </Group>

                  {alertData.capturedMedia?.photos?.length > 0 ? (
                    <SimpleGrid cols={2} spacing="sm">
                      {alertData.capturedMedia.photos.slice(0, 4).map((img, index) => (
                        <Box
                          key={index}
                          style={{
                            aspectRatio: "1/1",
                            overflow: "hidden",
                            borderRadius: "8px",
                            border: `2px solid ${getBg(colorScheme, '#fbcfe8', theme.colors.pink[7])}`,
                            position: "relative",
                          }}
                        >
                          <MantineImage
                            src={img}
                            alt={`Evidence ${index + 1}`}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                          <Box
                            style={{
                              position: "absolute",
                              bottom: "0",
                              left: "0",
                              right: "0",
                              background: "rgba(236, 72, 153, 0.8)",
                              padding: "4px",
                              textAlign: "center",
                            }}
                          >
                            <Text size="10px" fw={700} color="white">
                              Photo {index + 1}
                            </Text>
                          </Box>
                        </Box>
                      ))}
                    </SimpleGrid>
                  ) : (
                    <Box 
                      style={{ 
                        textAlign: "center", 
                        padding: "20px",
                        border: `2px dashed ${getBg(colorScheme, '#fbcfe8', theme.colors.pink[7])}`,
                        borderRadius: "8px",
                        backgroundColor: getBg(colorScheme, 'rgba(252, 231, 243, 0.5)', 'rgba(157, 23, 77, 0.2)'),
                      }}
                    >
                      <IconPhoto size={48} color={getBg(colorScheme, '#f472b6', theme.colors.pink[5])} />
                      <Text mt="md" c="dimmed">No photos or videos available</Text>
                    </Box>
                  )}
                </Box>
              </Paper>

              {/* Confirmation Card – modified for logging */}
              <Paper 
                withBorder 
                radius="md"
                style={{
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                  overflow: "hidden",
                  borderLeft: "4px solid #ef4444",
                }}
              >
                <Box
                  p="md"
                  style={{
                    background: getBg(colorScheme, "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)", "linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)"),
                  }}
                >
                  <Text fw={700} size="lg" style={{ color: getBg(colorScheme, "#dc2626", theme.colors.red[2]) }} mb="16px">
                    ❓ Is this your car?
                  </Text>
                  
                  <Stack gap="md">
                    <Card
                      withBorder
                      style={{
                        cursor: "pointer",
                        backgroundColor: isOwner 
                          ? getBg(colorScheme, "#dcfce7", theme.colors.green[9]) 
                          : getBg(colorScheme, "white", theme.colors.dark[6]),
                        borderColor: isOwner 
                          ? "#22c55e" 
                          : getBg(colorScheme, "#e5e7eb", theme.colors.dark[4]),
                        borderLeft: isOwner 
                          ? "4px solid #22c55e" 
                          : `4px solid ${getBg(colorScheme, "#e5e7eb", theme.colors.dark[4])}`,
                        transition: "all 0.2s",
                      }}
                      onClick={() => handleConfirmation('owner')}
                    >
                      <Group justify="space-between">
                        <Group>
                          <Checkbox 
                            checked={isOwner}
                            onChange={() => handleConfirmation('owner')}
                            color="green"
                            size="lg"
                          />
                          <Box>
                            <Text fw={700} style={{ color: isOwner ? getBg(colorScheme, "#166534", theme.colors.green[3]) : getBg(colorScheme, "#374151", theme.colors.gray[3]) }}>
                              ✅ Yes, it is my car
                            </Text>
                            <Text size="sm" c="dimmed">
                              Confirm ownership of this vehicle
                            </Text>
                          </Box>
                        </Group>
                        {isOwner && (
                          <Badge color="green" variant="filled" size="lg">
                            Selected
                          </Badge>
                        )}
                      </Group>
                    </Card>

                    <Card
                      withBorder
                      style={{
                        cursor: "pointer",
                        backgroundColor: isFalseAlert 
                          ? getBg(colorScheme, "#fee2e2", theme.colors.red[9]) 
                          : getBg(colorScheme, "white", theme.colors.dark[6]),
                        borderColor: isFalseAlert 
                          ? "#ef4444" 
                          : getBg(colorScheme, "#e5e7eb", theme.colors.dark[4]),
                        borderLeft: isFalseAlert 
                          ? "4px solid #ef4444" 
                          : `4px solid ${getBg(colorScheme, "#e5e7eb", theme.colors.dark[4])}`,
                        transition: "all 0.2s",
                      }}
                      onClick={() => handleConfirmation('false')}
                    >
                      <Group justify="space-between">
                        <Group>
                          <Checkbox 
                            checked={isFalseAlert}
                            onChange={() => handleConfirmation('false')}
                            color="red"
                            size="lg"
                          />
                          <Box>
                            <Text fw={700} style={{ color: isFalseAlert ? getBg(colorScheme, "#dc2626", theme.colors.red[3]) : getBg(colorScheme, "#374151", theme.colors.gray[3]) }}>
                              ❌ No, false alert
                            </Text>
                            <Text size="sm" c="dimmed">
                              Report this as incorrect detection
                            </Text>
                          </Box>
                        </Group>
                        {isFalseAlert && (
                          <Badge color="red" variant="filled" size="lg">
                            Selected
                          </Badge>
                        )}
                      </Group>
                    </Card>

                    <Button
                      fullWidth
                      size="lg"
                      color={isOwner ? "green" : isFalseAlert ? "red" : "blue"}
                      leftSection={<IconCheck size={20} />}
                      mt="md"
                      disabled={!isOwner && !isFalseAlert}
                      style={{
                        fontWeight: 700,
                        fontSize: "16px",
                        padding: "12px",
                        borderRadius: "8px",
                      }}
                      onClick={handleSubmitResponse}
                    >
                      {isOwner ? "✅ Confirm Ownership" : 
                       isFalseAlert ? "❌ Report False Alert" : 
                       "Select an option above"}
                    </Button>
                  </Stack>
                </Box>
              </Paper>
            </Stack>
          </Grid.Col>
        </Grid>

        {/* Detection Metadata - unchanged */}
        <Paper withBorder radius="md" mt="xl" bg={paperBg}>
          <Box
            p="md"
            style={{
              borderBottom: `1px solid ${borderColor}`,
              backgroundColor: detectionMetadataHeaderBg,
            }}
          >
            <Text fw={600} size="lg">Detection Details</Text>
          </Box>
          <Box p="md">
            <SimpleGrid cols={{ base: 2, md: 4 }}>
              <Stack gap="xs">
                <Text size="sm" c="dimmed">Detection ID</Text>
                <Text fw={600}>{detectionData.id}</Text>
              </Stack>
              <Stack gap="xs">
                <Text size="sm" c="dimmed">Location</Text>
                <Text fw={600}>{detectionData.location}</Text>
              </Stack>
              <Stack gap="xs">
                <Text size="sm" c="dimmed">Date & Time</Text>
                <Text fw={600}>{detectionData.date} • {detectionData.time}</Text>
              </Stack>
              <Stack gap="xs">
                <Text size="sm" c="dimmed">Type</Text>
                <Badge
                  color={detectionData.type === "Suggestion" ? "yellow" : "blue"}
                  variant="light"
                >
                  {detectionData.type}
                </Badge>
              </Stack>
            </SimpleGrid>
            {detectionData.description && (
              <Box mt="md">
                <Text size="sm" c="dimmed">Description</Text>
                <Text>{detectionData.description}</Text>
              </Box>
            )}
          </Box>
        </Paper>

        {/* Action Buttons – modified for logging */}
        <Group justify="space-between" mt="xl">
          <Button
            variant="light"
            color="gray"
            leftSection={<IconArrowLeft size={18} />}
            onClick={() => router.push(`/alert-detail/${params.id}`)}
          >
            Back to Alert
          </Button>
          
          <Group>
            <Button
              variant="light"
              color="blue"
              leftSection={<IconDownload size={18} />}
              onClick={handleExport}
            >
              Export Details
            </Button>
            <Button
              color="blue"
              leftSection={<IconCheck size={18} />}
              onClick={handleSubmitResponse}
              disabled={!isOwner && !isFalseAlert}
            >
              Submit Response
            </Button>
          </Group>
        </Group>
      </Container>

      <MainFooter />
    </Box>
  );
}