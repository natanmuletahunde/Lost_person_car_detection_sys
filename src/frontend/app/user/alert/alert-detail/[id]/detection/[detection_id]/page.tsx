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
import { apiClient } from "../../../../../../lib/apiClient";

// Leaflet imports
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

// API Endpoints
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';
const MISSING_PERSONS_API = `${API_BASE_URL}/missing-persons`;
const MISSING_VEHICLES_API = `${API_BASE_URL}/missing-vehicles`;
const SIGHTINGS_API = `${API_BASE_URL}/sightings`;

const extractData = (payload: any) => payload?.data ?? payload;

// Helper to get dynamic background/color values
const getBg = (colorScheme, light, dark) => (colorScheme === 'dark' ? dark : light);
const getTextColor = (colorScheme, light, dark) => (colorScheme === 'dark' ? dark : light);

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  const baseUrl = API_BASE_URL.replace("/api/v1", "");
  return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
};

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

      // Logging is currently disabled for JSON Server cleanup.
      // You can add a backend logging endpoint later if needed.
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
        const sightingRes = await apiClient(`${SIGHTINGS_API}/${detectionId}`);
        if (!sightingRes.ok) {
          throw new Error('Sighting not found');
        }
        const sightingPayload = await sightingRes.json();
        const sighting = extractData(sightingPayload)?.sighting || extractData(sightingPayload);

        // 2. Determine which type of case it belongs to (person or vehicle)
        let caseData = null;
        if (sighting.type === 'Person') {
          const personRes = await apiClient(`${MISSING_PERSONS_API}/${caseId}`);
          if (personRes.ok) {
            const payload = await personRes.json();
            caseData = extractData(payload)?.person || extractData(payload);
          }
        } else if (sighting.type === 'Vehicle') {
          const vehicleRes = await apiClient(`${MISSING_VEHICLES_API}/${caseId}`);
          if (vehicleRes.ok) {
            const payload = await vehicleRes.json();
            caseData = extractData(payload)?.vehicle || extractData(payload);
          }
        } else {
          // If sighting doesn't have type, try both APIs
          const [personRes, vehicleRes] = await Promise.all([
            apiClient(`${MISSING_PERSONS_API}/${caseId}`),
            apiClient(`${MISSING_VEHICLES_API}/${caseId}`),
          ]);
          if (personRes.ok) {
            const payload = await personRes.json();
            caseData = extractData(payload)?.person || extractData(payload);
          } else if (vehicleRes.ok) {
            const payload = await vehicleRes.json();
            caseData = extractData(payload)?.vehicle || extractData(payload);
          }
        }

        if (!caseData) {
          throw new Error('Original case not found');
        }

        // Transform sighting to match expected structure
        // For CCTV sightings, the ML-captured image is stored in sighting.images[]
        const isCCTV = sighting.type === 'cctv' || sighting.type === 'CCTV';
        const cctvCapturedImages = (sighting.images || []).map(img => getImageUrl(img) || img);

        const transformedDetection = {
          id: sighting._id || sighting.id,
          name: sighting.type === 'Person' ? sighting.name : `${sighting.brand || ''} ${sighting.model || ''}`.trim() || sighting.plateNumber || sighting.name,
          location: sighting.location?.address || sighting.location || 'Unknown',
          date: sighting.date || (sighting.reportedAt ? new Date(sighting.reportedAt).toLocaleDateString() : 'Unknown'),
          time: sighting.time || (sighting.reportedAt ? new Date(sighting.reportedAt).toLocaleTimeString() : 'Unknown'),
          type: isCCTV ? 'CCTV' : (sighting.type === 'person' || sighting.type === 'Person' ? 'Person' : 'Detection'),
          accuracy: isCCTV ? (sighting.description?.match(/(\d+\.?\d*)%/)?.[1] ? `${sighting.description.match(/(\d+\.?\d*)%/)[1]}%` : 'N/A') : null,
          description: sighting.description,
          // Primary image: for CCTV use the ML-captured image, otherwise fallback
          image: isCCTV ? (cctvCapturedImages[0] || null) : getImageUrl(sighting.images?.[0]),
          // All ML-captured images
          cctvImages: isCCTV ? cctvCapturedImages : [],
          isCCTV,
          latitude: sighting.latitude || (sighting.location?.coordinates ? sighting.location.coordinates[1] : null),
          longitude: sighting.longitude || (sighting.location?.coordinates ? sighting.location.coordinates[0] : null),
        };

        // Transform case data to match expected alert structure
        const transformedCase = {
          id: caseData._id || caseData.id,
          code: caseData.caseId || `CASE-${caseData._id || caseData.id}`,
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
            photos: (caseData.additionalImages || (caseData.imagePreview ? [caseData.imagePreview] : [])).map(img => getImageUrl(img)),
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

    let isMounted = true;

    const initMap = async () => {
      // Dynamically import Leaflet to prevent SSR "window is not defined" errors
      const L = (await import('leaflet')).default;
      
      // Fix Leaflet default icon paths dynamically using CDN to bypass Next.js Turbopack image loader issues
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!isMounted) return;

      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }

      const lat = detectionData.latitude ? parseFloat(detectionData.latitude) : 9.03;
      const lng = detectionData.longitude ? parseFloat(detectionData.longitude) : 38.74;

      const map = L.map(mapRef.current).setView([lat, lng], 17);
      leafletMap.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      const marker = L.marker([lat, lng])
        .bindPopup(`
          <b>${detectionData.name}</b><br>
          ${detectionData.location}<br>
          ${detectionData.date} ${detectionData.time}<br>
          ${detectionData.type !== 'Person' ? `Accuracy: ${detectionData.accuracy}` : `Type: Person`}
        `)
        .addTo(map);
      marker.openPopup();
      markerRef.current = marker;

      // Add user's current location if available
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;
            
            // Add a distinct circle marker for the user
            L.circleMarker([userLat, userLng], {
              color: '#ffffff', // White border
              fillColor: '#2563eb', // Blue fill
              fillOpacity: 1,
              radius: 10,
              weight: 3
            }).addTo(map).bindPopup('<b>📍 Your Current Location</b>');
            
            // Adjust map view to include both the user and the detection
            const bounds = L.latLngBounds([lat, lng], [userLat, userLng]);
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 17 });
          },
          (err) => {
            console.warn('Geolocation error:', err);
            notifications.show({
              title: 'Location Unavailable',
              message: 'Could not access your location. Please check your browser permissions.',
              color: 'orange',
            });
          }
        );
      }
    };

    initMap();

    return () => {
      isMounted = false;
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
            <Paper withBorder radius="md" style={{ height: "100%", minHeight: "500px", display: "flex", flexDirection: "column", overflow: "hidden" }}> 
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
                  flex: 1,
                  width: "100%",
                  borderRadius: "0 0 8px 8px",
                }}
              />
            </Paper>
          </Grid.Col>

          {/* RIGHT COLUMN: Info Cards */}
          <Grid.Col span={{ base: 12, md: 5 }}>
            <Stack gap="lg">
              {/* Accuracy Card */}
              {detectionData.type !== 'Person' && (
                <Paper 
                  withBorder 
                  radius="md"
                  style={{
                    boxShadow: "0 2px 8px rgba(37, 99, 235, 0.05)",
                    overflow: "hidden",
                    borderLeft: "4px solid #2563eb",
                  }}
                >
                  <Box
                    p="md"
                    style={{
                      background: getBg(colorScheme, "white", theme.colors.dark[6]),
                    }}
                  >
                    <Group justify="space-between" align="center">
                      <Box>
                        <Text fw={700} size="lg" style={{ color: getBg(colorScheme, "#1e40af", theme.colors.blue[2]) }}>
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
              )}

              {/* Category Card */}
              <Paper 
                withBorder 
                radius="md"
                style={{
                  boxShadow: "0 2px 8px rgba(37, 99, 235, 0.05)",
                  overflow: "hidden",
                  borderLeft: "4px solid #3b82f6",
                }}
              >
                <Box
                  p="md"
                  style={{
                    background: getBg(colorScheme, "white", theme.colors.dark[6]),
                  }}
                >
                  <Text fw={700} size="lg" style={{ color: getBg(colorScheme, "#1e40af", theme.colors.blue[2]) }} mb="12px">
                    🚗 Category
                  </Text>
                  <Stack gap="md">
                    <Box pl="md">
                      <Text size="sm" fw={600} style={{ color: getBg(colorScheme, "#1e3a8a", theme.colors.blue[2]) }}>
                        Type: <span style={{ color: getBg(colorScheme, "#374151", theme.colors.gray[3]) }}>{alertData.category?.type}</span>
                      </Text>
                      <Box pl="md" mt="xs">
                        <Text size="sm" fw={600} style={{ color: getBg(colorScheme, "#1e3a8a", theme.colors.blue[2]) }}>
                          Brand/Name: <span style={{ color: getBg(colorScheme, "#374151", theme.colors.gray[3]) }}>{alertData.category?.brandName}</span>
                        </Text>
                        <Box pl="md" mt="xs">
                          <Text size="sm" fw={600} style={{ color: getBg(colorScheme, "#1e3a8a", theme.colors.blue[2]) }}>
                            Plate:
                          </Text>
                          <Box 
                            p="xs" 
                            mt="xs" 
                            style={{ 
                              backgroundColor: "#eff6ff", 
                              border: "1px solid #bfdbfe",
                              borderRadius: "6px",
                              display: "inline-block",
                            }}
                          >
                            <Text size="sm" fw={800} style={{ color: "#1d4ed8", letterSpacing: "1px" }}>
                              {alertData.category?.plateNumber}
                            </Text>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                    <Box pl="md">
                      <Text size="sm" fw={600} style={{ color: getBg(colorScheme, "#1e3a8a", theme.colors.blue[2]) }}>
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

              {/* Registered Location Card */}
              <Paper 
                withBorder 
                radius="md"
                style={{
                  boxShadow: "0 2px 8px rgba(37, 99, 235, 0.05)",
                  overflow: "hidden",
                  borderLeft: "4px solid #60a5fa",
                }}
              >
                <Box
                  p="md"
                  style={{
                    background: getBg(colorScheme, "white", theme.colors.dark[6]),
                  }}
                >
                  <Group align="flex-start">
                    <Box
                      style={{
                        backgroundColor: "#eff6ff",
                        padding: "8px",
                        borderRadius: "8px",
                        color: "#2563eb",
                        border: "1px solid #bfdbfe"
                      }}
                    >
                      <IconMapPin size={20} />
                    </Box>
                    <Box style={{ flex: 1 }}>
                      <Text fw={700} size="lg" style={{ color: getBg(colorScheme, "#1e40af", theme.colors.blue[2]) }}>
                        Registered Location
                      </Text>
                      <Text size="sm" style={{ color: getBg(colorScheme, "#6b7280", theme.colors.gray[3]) }} mt="4px">
                        {alertData.registeredLocation}
                      </Text>
                    </Box>
                  </Group>
                </Box>
              </Paper>

              {/* Registered Date Card */}
              <Paper 
                withBorder 
                radius="md"
                style={{
                  boxShadow: "0 2px 8px rgba(37, 99, 235, 0.05)",
                  overflow: "hidden",
                  borderLeft: "4px solid #93c5fd",
                }}
              >
                <Box
                  p="md"
                  style={{
                    background: getBg(colorScheme, "white", theme.colors.dark[6]),
                  }}
                >
                  <Group align="flex-start">
                    <Box
                      style={{
                        backgroundColor: "#eff6ff",
                        padding: "8px",
                        borderRadius: "8px",
                        color: "#3b82f6",
                        border: "1px solid #bfdbfe"
                      }}
                    >
                      <IconCalendar size={20} />
                    </Box>
                    <Box style={{ flex: 1 }}>
                      <Text fw={700} size="lg" style={{ color: getBg(colorScheme, "#1e40af", theme.colors.blue[2]) }}>
                        Registered Date
                      </Text>
                      <Stack gap="xs" mt="xs">
                        <Group gap="xs">
                          <Badge color="blue" variant="light" size="sm">
                            Date
                          </Badge>
                          <Text size="sm" fw={600} style={{ color: getBg(colorScheme, "#374151", theme.colors.gray[3]) }}>
                            {alertData.registeredDate}
                          </Text>
                        </Group>
                        <Group gap="xs">
                          <Badge color="blue" variant="light" size="sm">
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

              {/* CCTV ML Captured Image Card — shown only for CCTV detections */}
              {detectionData.isCCTV && (
                <Paper
                  withBorder
                  radius="md"
                  style={{
                    boxShadow: "0 4px 16px rgba(37, 99, 235, 0.15)",
                    overflow: "hidden",
                    borderLeft: "4px solid #ef4444",
                  }}
                >
                  <Box
                    p="md"
                    style={{
                      background: getBg(colorScheme, "white", theme.colors.dark[6]),
                    }}
                  >
                    <Group justify="space-between" align="center" mb="md">
                      <Group>
                        <Box
                          style={{
                            backgroundColor: "#fef2f2",
                            padding: "8px",
                            borderRadius: "8px",
                            color: "#ef4444",
                            border: "1px solid #fecaca",
                          }}
                        >
                          <IconCamera size={20} />
                        </Box>
                        <Box>
                          <Text fw={700} size="lg" style={{ color: "#dc2626" }}>
                            📷 CCTV Capture
                          </Text>
                          <Text size="sm" c="dimmed">
                            Image captured by ML detection system
                          </Text>
                        </Box>
                      </Group>
                      <Group gap="xs">
                        {detectionData.accuracy && detectionData.accuracy !== 'N/A' && (
                          <Badge color="red" variant="filled" size="lg">
                            {detectionData.accuracy} match
                          </Badge>
                        )}
                        <Badge color="gray" variant="light">
                          {detectionData.cctvImages?.length || 0} frame(s)
                        </Badge>
                      </Group>
                    </Group>

                    {detectionData.cctvImages?.length > 0 ? (
                      <Stack gap="sm">
                        {/* Primary large capture */}
                        <Box
                          style={{
                            borderRadius: "10px",
                            overflow: "hidden",
                            border: "2px solid #fecaca",
                            position: "relative",
                            backgroundColor: "#000",
                          }}
                        >
                          <MantineImage
                            src={detectionData.cctvImages[0]}
                            alt="ML CCTV Capture"
                            style={{ width: "100%", maxHeight: "280px", objectFit: "contain" }}
                          />
                          <Box
                            style={{
                              position: "absolute",
                              top: 8,
                              left: 8,
                              background: "rgba(220, 38, 38, 0.85)",
                              borderRadius: "6px",
                              padding: "2px 8px",
                            }}
                          >
                            <Text size="xs" fw={700} c="white">🔴 CCTV FRAME</Text>
                          </Box>
                        </Box>

                        {/* Additional frames if any */}
                        {detectionData.cctvImages.length > 1 && (
                          <SimpleGrid cols={3} spacing="xs">
                            {detectionData.cctvImages.slice(1).map((img, i) => (
                              <Box
                                key={i}
                                style={{
                                  borderRadius: "6px",
                                  overflow: "hidden",
                                  border: "1px solid #fecaca",
                                  backgroundColor: "#000",
                                }}
                              >
                                <MantineImage
                                  src={img}
                                  alt={`Frame ${i + 2}`}
                                  style={{ width: "100%", aspectRatio: "1/1", objectFit: "contain" }}
                                />
                              </Box>
                            ))}
                          </SimpleGrid>
                        )}

                        <Text size="xs" c="dimmed" ta="center">
                          Captured at: {detectionData.date} {detectionData.time} • {detectionData.location}
                        </Text>
                      </Stack>
                    ) : (
                      <Box
                        style={{
                          textAlign: "center",
                          padding: "20px",
                          border: "2px dashed #fecaca",
                          borderRadius: "8px",
                          backgroundColor: "rgba(254, 242, 242, 0.5)",
                        }}
                      >
                        <IconCamera size={48} color="#fca5a5" />
                        <Text mt="md" c="dimmed">No CCTV capture image available</Text>
                      </Box>
                    )}
                  </Box>
                </Paper>
              )}

              {/* Captured Media Card — registered case photos */}
              <Paper 
                withBorder 
                radius="md"
                style={{
                  boxShadow: "0 2px 8px rgba(37, 99, 235, 0.05)",
                  overflow: "hidden",
                  borderLeft: "4px solid #bfdbfe",
                }}
              >
                <Box
                  p="md"
                  style={{
                    background: getBg(colorScheme, "white", theme.colors.dark[6]),
                  }}
                >
                  <Group justify="space-between" align="center" mb="md">
                    <Group>
                      <Box
                        style={{
                          backgroundColor: "#eff6ff",
                          padding: "8px",
                          borderRadius: "8px",
                          color: "#60a5fa",
                          border: "1px solid #dbeafe"
                        }}
                      >
                        <IconPhoto size={20} />
                      </Box>
                      <Box>
                        <Text fw={700} size="lg" style={{ color: getBg(colorScheme, "#1e40af", theme.colors.blue[2]) }}>
                          Registered Photos
                        </Text>
                        <Text size="sm" c="dimmed">
                          Original case registration images
                        </Text>
                      </Box>
                    </Group>
                    <Badge color="blue" variant="light">
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
                            border: `2px solid ${getBg(colorScheme, '#dbeafe', theme.colors.blue[7])}`,
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
                              background: "rgba(37, 99, 235, 0.8)",
                              padding: "4px",
                              textAlign: "center",
                            }}
                          >
                            <Text size="10px" fw={700} c="white">
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
                        border: `2px dashed ${getBg(colorScheme, '#bfdbfe', theme.colors.blue[7])}`,
                        borderRadius: "8px",
                        backgroundColor: getBg(colorScheme, 'rgba(239, 246, 255, 0.5)', 'rgba(30, 58, 138, 0.2)'),
                      }}
                    >
                      <IconPhoto size={48} color={getBg(colorScheme, '#93c5fd', theme.colors.blue[5])} />
                      <Text mt="md" c="dimmed">No registered photos available</Text>
                    </Box>
                  )}
                </Box>
              </Paper>

              {/* Confirmation Card */}
              <Paper 
                withBorder 
                radius="md"
                style={{
                  boxShadow: "0 2px 8px rgba(37, 99, 235, 0.05)",
                  overflow: "hidden",
                  borderLeft: "4px solid #1e40af",
                }}
              >
                <Box
                  p="md"
                  style={{
                    background: getBg(colorScheme, "white", theme.colors.dark[6]),
                  }}
                >
                  <Text fw={700} size="lg" style={{ color: getBg(colorScheme, "#1e3a8a", theme.colors.blue[3]) }} mb="16px">
                    ❓ Is this your car?
                  </Text>
                  
                  <Stack gap="md">
                    <Card
                      withBorder
                      style={{
                        cursor: "pointer",
                        backgroundColor: isOwner 
                          ? getBg(colorScheme, "#eff6ff", theme.colors.blue[9]) 
                          : getBg(colorScheme, "white", theme.colors.dark[6]),
                        borderColor: isOwner 
                          ? "#3b82f6" 
                          : getBg(colorScheme, "#e5e7eb", theme.colors.dark[4]),
                        borderLeft: isOwner 
                          ? "4px solid #3b82f6" 
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
                            color="blue"
                            size="lg"
                          />
                          <Box>
                            <Text fw={700} style={{ color: isOwner ? getBg(colorScheme, "#1d4ed8", theme.colors.blue[3]) : getBg(colorScheme, "#374151", theme.colors.gray[3]) }}>
                              ✅ Yes, it is my car
                            </Text>
                            <Text size="sm" c="dimmed">
                              Confirm ownership of this vehicle
                            </Text>
                          </Box>
                        </Group>
                        {isOwner && (
                          <Badge color="blue" variant="filled" size="lg">
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
                          ? getBg(colorScheme, "#eff6ff", theme.colors.blue[9]) 
                          : getBg(colorScheme, "white", theme.colors.dark[6]),
                        borderColor: isFalseAlert 
                          ? "#3b82f6" 
                          : getBg(colorScheme, "#e5e7eb", theme.colors.dark[4]),
                        borderLeft: isFalseAlert 
                          ? "4px solid #3b82f6" 
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
                            color="blue"
                            size="lg"
                          />
                          <Box>
                            <Text fw={700} style={{ color: isFalseAlert ? getBg(colorScheme, "#1d4ed8", theme.colors.blue[3]) : getBg(colorScheme, "#374151", theme.colors.gray[3]) }}>
                              ❌ No, false alert
                            </Text>
                            <Text size="sm" c="dimmed">
                              Report this as incorrect detection
                            </Text>
                          </Box>
                        </Group>
                        {isFalseAlert && (
                          <Badge color="blue" variant="filled" size="lg">
                            Selected
                          </Badge>
                        )}
                      </Group>
                    </Card>

                    <Button
                      fullWidth
                      size="lg"
                      color="blue"
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