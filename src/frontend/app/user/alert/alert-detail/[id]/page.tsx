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
  ScrollArea,
  Table,
  Grid,
  Loader,
  Card,
  Divider,
  Pagination,
  TextInput,
  Menu,
  UnstyledButton,
  useMantineTheme,
  useMantineColorScheme,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconMapPin,
  IconCalendar,
  IconArrowLeft,
  IconDownload,
  IconFilter,
  IconTable,
  IconMap,
  IconMapPinFilled,
  IconCar,
  IconCamera,
  IconClock,
  IconEye,
  IconShield,
  IconCheck,
  IconStar,
  IconChevronRight,
  IconSearch,
  IconHome,
  IconUser,
  IconBell,
  IconShieldCheck,
  IconHistory,
  IconSettings,
  IconLogout,
  IconBike,
  IconTruck,
  IconBattery,
} from "@tabler/icons-react";
import Link from "next/link";
import Image from "next/image";
import MainFooter from "../../../../components/MainFooter";
import { apiClient } from "../../../../lib/apiClient";
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

// ---------- API Configuration ----------
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';
const MISSING_VEHICLES_API = `${API_BASE_URL}/missing-vehicles`;
const MISSING_PERSONS_API = `${API_BASE_URL}/missing-persons`;
const MY_SIGHTINGS_API = `${API_BASE_URL}/sightings/my-sightings`;

const extractData = (payload: any) => payload?.data ?? payload;
const extractArray = (payload: any) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

// ---------- Helper Functions ----------
const determineVehicleType = (vehicle) => {
  if (vehicle.type) return vehicle.type;
  if (vehicle.brand?.toLowerCase().includes('motor') || vehicle.model?.toLowerCase().includes('motor')) return 'motorcycle';
  if (vehicle.brand?.toLowerCase().includes('truck') || vehicle.model?.toLowerCase().includes('truck')) return 'truck';
  if (vehicle.technicalSpecs?.electric) return 'electric';
  return 'car';
};

const calculateDuration = (reportDate) => {
  if (!reportDate) return 'Unknown';
  const days = Math.floor((new Date().getTime() - new Date(reportDate).getTime()) / (1000 * 60 * 60 * 24));
  return `${days} day${days !== 1 ? 's' : ''}`;
};

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  const baseUrl = API_BASE_URL.replace("/api/v1", "");
  return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
};

const getVehicleIcon = (type, size = 24) => {
  switch (type) {
    case 'motorcycle': return <IconBike size={size} />;
    case 'truck': return <IconTruck size={size} />;
    case 'electric': return <IconBattery size={size} />;
    case 'person': return <IconUser size={size} />;
    default: return <IconCar size={size} />;
  }
};

// Transform a raw vehicle/person into the base alert object
const transformAlert = (item, type) => {
  return {
    id: item._id || item.id,
    code: item.caseId || `CASE-${item._id || item.id}`,
    brand: type === 'person'
      ? `${item.firstName || ''} ${item.middleName || ''} ${item.lastName || ''}`.trim()
      : `${item.brand || ''} ${item.model || ''} ${item.submodel || ''}`.trim(),
    type: type,
    status: item.status?.toLowerCase() || 'active',
    location: item.lastSeenLocation || item.location || 'Unknown',
    date: item.lastSeenDate ? new Date(item.lastSeenDate).toLocaleDateString() : 
           item.reportDate ? new Date(item.reportDate).toLocaleDateString() : 'Unknown',
    startTime: item.lastSeenTime || item.reportTime || 'Unknown',
    description: item.vehicleDescription || item.description || 'No description provided',
    lastSeen: item.lastSeenLocation || 'Unknown',
    mapLocation: item.lastSeenLocation || 'Unknown',
    reportDate: item.reportDate,
    duration: calculateDuration(item.reportDate),
    // Detection history will be populated separately from sightings
    detectionHistory: [],
    cctvInfo: item.cctvInfo || { confidence: 'N/A' },
    title: type === 'person' ? 'Missing Person Alert' : 'Missing Vehicle Alert',
    imageUrl: type === 'person' 
      ? getImageUrl(item.images?.[0]) || "/default-person.jpg"
      : getImageUrl(item.imagePreview) || "/default-car.jpg",
  };
};

const getBg = (colorScheme, light, dark) => (colorScheme === 'dark' ? dark : light);
const getTextColor = (colorScheme, light, dark) => (colorScheme === 'dark' ? dark : light);

export default function AlertDetailPage() {
  const router = useRouter();
  const params = useParams();
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const [alertData, setAlertData] = useState(null);
  const [detectionHistory, setDetectionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activePage, setActivePage] = useState(1);
  const [selectedDetection, setSelectedDetection] = useState(null);
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const markersRef = useRef([]);
  const itemsPerPage = 10;

  // Current user state for logging
  const [currentUser, setCurrentUser] = useState(null);

  // Dynamic colors
  const mainBg = getBg(colorScheme, 'white', theme.colors.dark[7]);
  const headerBg = getBg(colorScheme, 'white', theme.colors.dark[6]);
  const borderColor = getBg(colorScheme, '#E9ECEF', theme.colors.dark[5]);
  const paperBg = getBg(colorScheme, 'white', theme.colors.dark[6]);
  const lightBlueBg = getBg(colorScheme, '#f0f9ff', theme.colors.blue[9] + '40');
  const mapBorder = getBg(colorScheme, '#bfdbfe', theme.colors.blue[8]);
  const tableHeaderBg = getBg(colorScheme, '#dbeafe', theme.colors.blue[9]);
  const tableHeaderText = getBg(colorScheme, '#1e40af', theme.colors.blue[2]);
  const paginationBg = getBg(colorScheme, '#dbeafe', theme.colors.blue[9]);
  const paginationText = getBg(colorScheme, '#1e40af', theme.colors.blue[2]);
  const backButtonBg = '#399afc';
  const selectedRowBg = getBg(colorScheme, '#f0f9ff', theme.colors.blue[9] + '30');
  const selectedRowBorder = '#3b82f6';

  // Load current user from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      try {
        setCurrentUser(JSON.parse(userData));
      } catch (e) { /* ignore */ }
    }
  }, []);

  // Logging function
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
      // Add a backend logging endpoint later if needed.
    } catch (error) {
      console.error('Logging failed:', error);
      // Non-blocking
    }
  };

  // Logout handler
  const handleLogout = () => {
    createActionLog('logout', { fromPage: 'alert_detail' });
    localStorage.removeItem('currentUser');
    router.push('/authentication/login');
  };

  useEffect(() => {
    const fetchAlertAndSightings = async () => {
      try {
        setLoading(true);
        setError(null);

        const alertId = params?.id;
        if (!alertId) throw new Error('No alert ID provided');

        // 1. Fetch the main alert (vehicle or person)
        let alert = null;
        let response = await apiClient(`${MISSING_VEHICLES_API}/${alertId}`);
        if (response.ok) {
          const vehiclePayload = await response.json();
          const vehicle = extractData(vehiclePayload)?.vehicle || extractData(vehiclePayload);
          alert = transformAlert(vehicle, determineVehicleType(vehicle));
        } else {
          response = await apiClient(`${MISSING_PERSONS_API}/${alertId}`);
          if (response.ok) {
            const personPayload = await response.json();
            const person = extractData(personPayload)?.person || extractData(personPayload);
            alert = transformAlert(person, 'person');
          } else {
            throw new Error('Alert not found');
          }
        }

        // 2. Fetch sightings linked to this alert
        // Use the new MY_SIGHTINGS_API which users have access to, and filter by caseId
        let sightingsUrl = `${MY_SIGHTINGS_API}?caseId=${alert.id}`;
        let sightingsRes = await apiClient(sightingsUrl);
        let sightings = [];
        if (sightingsRes.ok) {
          sightings = extractArray(await sightingsRes.json());
        }

        // 3. Transform sightings into detection objects
        const detections = sightings.map((s, idx) => ({
          id: s._id || s.id,
          name: s.type === 'Person' ? s.name : s.plateNumber || `Sighting ${idx + 1}`,
          location: s.location?.address || s.location || 'Unknown',
          date: s.date ? new Date(s.date).toLocaleDateString() : (s.reportedAt ? new Date(s.reportedAt).toLocaleDateString() : 'Unknown'),
          time: s.time || (s.reportedAt ? new Date(s.reportedAt).toLocaleTimeString() : '00:00'),
          accuracy: (s.type === 'person' || s.type === 'Person') ? null : (s.confidence || '85%'),
          type: (s.type === 'person' || s.type === 'Person') ? 'Person' : 'CCTV',
          status: s.status || 'active',
          startDate: s.date || s.reportedAt,
          startTime: s.time || (s.reportedAt ? new Date(s.reportedAt).toLocaleTimeString() : '00:00'),
          lat: s.latitude || (s.location?.coordinates ? s.location.coordinates[1] : null) || 9.03 + (Math.random() - 0.5) * 0.1,
          lng: s.longitude || (s.location?.coordinates ? s.location.coordinates[0] : null) || 38.74 + (Math.random() - 0.5) * 0.1,
          description: s.description,
        }));

        setAlertData(alert);
        setDetectionHistory(detections);
        // Do NOT set selectedDetection by default so the map shows ALL pins on load

        createActionLog('alert_detail_view', {
          alertId: alert.id,
          alertCode: alert.code,
          alertType: alert.type,
          sightingCount: detections.length,
        });

      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAlertAndSightings();
  }, [params?.id]);

  // Initialize Leaflet map when alertData or detectionHistory changes
  useEffect(() => {
    if (!mapRef.current) return;

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

      const map = L.map(mapRef.current).setView([9.03, 38.74], 12);
      leafletMap.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      detectionHistory.forEach((detection) => {
        if (detection.lat && detection.lng) {
          const marker = L.marker([detection.lat, detection.lng])
            .bindPopup(`
              <b>${detection.name}</b><br>
              ${detection.location}<br>
              ${detection.date} ${detection.time}<br>
              ${detection.type !== 'Person' ? `Accuracy: ${detection.accuracy}` : `Type: Person`}
            `)
            .on('click', () => {
              setSelectedDetection(detection);
            });
          marker.addTo(map);
          markersRef.current.push(marker);
        }
      });

      if (markersRef.current.length > 0) {
        const group = L.featureGroup(markersRef.current);
        const mapBounds = group.getBounds();
        map.fitBounds(mapBounds, { padding: [50, 50] });
        
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
              
              // Adjust bounds to include both the user and all sightings
              mapBounds.extend([userLat, userLng]);
              map.fitBounds(mapBounds, { padding: [50, 50] });
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
  }, [detectionHistory]);

  // Fly to selected detection when it changes
  useEffect(() => {
    if (leafletMap.current && selectedDetection && selectedDetection.lat && selectedDetection.lng) {
      leafletMap.current.flyTo([selectedDetection.lat, selectedDetection.lng], 15, {
        duration: 1.5
      });
      markersRef.current.forEach(marker => {
        const latLng = marker.getLatLng();
        if (latLng.lat === selectedDetection.lat && latLng.lng === selectedDetection.lng) {
          marker.openPopup();
        } else {
          marker.closePopup();
        }
      });
    }
  }, [selectedDetection]);

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

  if (error || !alertData) {
    return (
      <Box style={{ padding: "40px", textAlign: "center", backgroundColor: mainBg }}>
        <Title order={2}>{error || 'Alert Not Found'}</Title>
        <Button onClick={() => router.push("/alert")} mt="md">
          Back to Alerts
        </Button>
      </Box>
    );
  }

  const startIndex = (activePage - 1) * itemsPerPage;
  const paginatedData = detectionHistory.slice(
    startIndex,
    startIndex + itemsPerPage,
  );
  const totalPages = Math.ceil(detectionHistory.length / itemsPerPage);

  const handleDetectionClick = (detection) => {
    setSelectedDetection(detection);
    createActionLog('detection_selected', {
      detectionId: detection.id,
      detectionName: detection.name,
      alertId: alertData.id,
    });
  };

  const handleRowClick = (detection, e) => {
    if (!e.target.closest(".arrow-button")) {
      handleDetectionClick(detection);
    }
  };

  const handleArrowClick = (detection, e) => {
    e.stopPropagation();
    createActionLog('detection_detail_navigate', {
      detectionId: detection.id,
      alertId: alertData.id,
    });
    router.push(`/user/alert/alert-detail/${params.id}/detection/${detection.id}`);
  };

  const handleExportClick = () => {
    createActionLog('export_clicked', { alertId: alertData.id });
    // actual export logic here
  };

  const handleFilterClick = () => {
    createActionLog('filter_clicked', { alertId: alertData.id });
    // actual filter logic here
  };

  const handleDownloadReport = () => {
    createActionLog('download_report_clicked', { alertId: alertData.id });
    // actual download logic here
  };

  return (
    <Box
      style={{
        minHeight: "100vh",
        backgroundColor: mainBg,
        display: "flex",
        flexDirection: "column",
      }}
    >
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
        <Container fluid px="md">
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
              placeholder="Search alerts..."
              leftSection={<IconSearch size={16} />}
              style={{ width: "40%", minWidth: 200 }}
              radius="xl"
              visibleFrom="sm"
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
                          {currentUser ? `${currentUser.firstName}` : "User"}
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
                      onClick={() => router.push("/user/alert")}
                    >
                      Notification
                    </Menu.Item>
                    <Menu.Item leftSection={<IconShieldCheck size={20} />}>
                      Privacy and Policy
                    </Menu.Item>
                    <Menu.Item leftSection={<IconBell size={20} />}
                    component={Link}
                    href="/user/alert">
                      Alerts
                    </Menu.Item>
                    <Menu.Item leftSection={<IconHistory size={20} />}>
                      History
                    </Menu.Item>
                    <Menu.Item leftSection={<IconSettings size={20} />}
                    component={Link}
                    href="/user/account_setting">
                      Settings
                    </Menu.Item>
                  </Stack>
                  <Menu.Divider />
                  {/* ========== CHANGED to custom handler ========== */}
                  <Menu.Item
                    color="red"
                    leftSection={<IconLogout size={20} />}
                    onClick={handleLogout}
                  >
                    Logout
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
          </Group>
        </Container>
      </Box>

      {/* Back to Alerts Section */}
      <Box style={{ padding: "24px 16px 16px 16px" }}>
        <Container fluid px="md">
          <Group>
            <Button
              variant="subtle"
              color="white"
              leftSection={<IconArrowLeft size={18} />}
              onClick={() => router.push("/user/alert")}
              size="md"
              style={{ backgroundColor: backButtonBg, padding: "10px" }}
            />
            <Box style={{ marginLeft: "16px" }}>
              <Text fw={800} size="xl" style={{ color: getTextColor(colorScheme, '#212529', theme.colors.gray[3]) }}>
                Alert Detail
              </Text>
              <Text size="sm" c="dimmed">
                ID: {alertData.code} • {alertData.brand} • {alertData.location}
              </Text>
            </Box>
          </Group>
        </Container>
      </Box>

      {/* Main Content */}
      <Box px="md" py={40} style={{ flex: 1 }}>
        {/* Alert Header */}
        <Paper p="xl" mb="xl" withBorder radius="md" bg={paperBg}>
          <Group justify="space-between" mb="md" wrap="wrap">
            <Group gap="xl">
              <Avatar 
                src={alertData.imageUrl} 
                size={120} 
                radius="md" 
                style={{ border: `2px solid ${borderColor}` }}
              />
              <Box>
                <Title order={2} mb="xs">
                  {alertData.title || alertData.brand}
                </Title>
              <Group gap="lg" wrap="wrap">
                <Badge size="lg" color={alertData.status === "active" ? "red" : "green"}>
                  {alertData.status.toUpperCase()}
                </Badge>
                <Group gap="xs">
                  <IconMapPin size={16} />
                  <Text>{alertData.location}</Text>
                </Group>
                <Group gap="xs">
                  <IconCalendar size={16} />
                  <Text>{alertData.date} • {alertData.startTime}</Text>
                </Group>
                <Group gap="xs">
                  <IconCar size={16} />
                  <Text>{alertData.type}</Text>
                </Group>
              </Group>
            </Box>
          </Group>
          <Group>
              {/* ========== CHANGED to custom handler ========== */}
              <Button 
                leftSection={<IconDownload size={18} />} 
                variant="light" 
                size="sm" 
                visibleFrom="xs"
                onClick={handleExportClick}
              >
                Export
              </Button>
              {/* ========== CHANGED to custom handler ========== */}
              <Button 
                leftSection={<IconFilter size={18} />} 
                variant="light" 
                size="sm" 
                visibleFrom="xs"
                onClick={handleFilterClick}
              >
                Filter
              </Button>
            </Group>
          </Group>
          <Text size="lg" c="dimmed">
            {alertData.description}
          </Text>
        </Paper>

        {/* Stats Grid */}
        <SimpleGrid cols={{ base: 2, sm: 4 }} mb="xl">
          <Paper p="md" withBorder radius="md" ta="center">
            <Group justify="center" mb="xs">
              <IconEye size={20} />
              <Text size="sm" c="dimmed">Total Sightings</Text>
            </Group>
            <Title order={2}>{detectionHistory.length || 0}</Title>
          </Paper>
          <Paper p="md" withBorder radius="md" ta="center">
            <Group justify="center" mb="xs">
              <IconClock size={20} />
              <Text size="sm" c="dimmed">Active Duration</Text>
            </Group>
            <Title order={2}>{alertData.duration || "N/A"}</Title>
          </Paper>
          <Paper p="md" withBorder radius="md" ta="center">
            <Group justify="center" mb="xs">
              <IconCamera size={20} />
              <Text size="sm" c="dimmed">CCTV Confidence</Text>
            </Group>
            <Title order={2}>{alertData.cctvInfo?.confidence || "N/A"}</Title>
          </Paper>
          <Paper p="md" withBorder radius="md" ta="center">
            <Group justify="center" mb="xs">
              <IconShield size={20} />
              <Text size="sm" c="dimmed">Status</Text>
            </Group>
            <Title order={2}>{alertData.status === "active" ? "Active" : "Resolved"}</Title>
          </Paper>
        </SimpleGrid>

        {/* Map + Table */}
        <Grid gutter="xl">
          {/* Map Section */}
          <Grid.Col span={12}>
            <Paper withBorder radius="md" style={{ height: "auto", minHeight: 400 }}>
              <Box
                p="md"
                style={{
                  borderBottom: `1px solid ${borderColor}`,
                  backgroundColor: "#1e40af",
                  color: "white",
                  borderTopLeftRadius: "8px",
                  borderTopRightRadius: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <Group>
                  <IconMap size={20} />
                  <Text fw={600}>
                    Sighting Map -{" "}
                    {selectedDetection ? selectedDetection.location : alertData.location}
                  </Text>
                </Group>
                {selectedDetection && (
                  <Badge color="white" variant="filled" size="lg">
                    Selected: {selectedDetection.name}
                  </Badge>
                )}
              </Box>
              <div
                ref={mapRef}
                style={{
                  height: "clamp(300px, 50vh, 400px)",
                  width: "100%",
                  background: lightBlueBg,
                  borderRadius: "0 0 8px 8px",
                  zIndex: 1,
                }}
              />
            </Paper>
          </Grid.Col>

          {/* Table Section */}
          <Grid.Col span={12}>
            <Paper
              withBorder
              radius="md"
              style={{
                height: "auto",
                minHeight: 400,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Box
                p="md"
                style={{
                  borderBottom: `1px solid ${borderColor}`,
                  backgroundColor: "#3b82f6",
                  color: "white",
                  borderTopLeftRadius: "8px",
                  borderTopRightRadius: "8px",
                }}
              >
                <Group justify="space-between" wrap="wrap" gap="xs">
                  <Group>
                    <IconTable size={20} />
                    <Text fw={600}>Sightings History</Text>
                  </Group>
                  <Group>
                    <Badge color="white" variant="filled" size="lg">
                      {detectionHistory.filter(a => a.status === "active").length} Active
                    </Badge>
                    <Badge color="white" variant="filled" size="lg">
                      {detectionHistory.length} Total
                    </Badge>
                  </Group>
                </Group>
              </Box>

              <Box style={{ flex: 1, overflowX: "auto" }}>
                <ScrollArea style={{ height: "100%", minWidth: "100%" }}>
                  <Table striped highlightOnHover style={{ minWidth: 800 }}>
                    <Table.Thead style={{ backgroundColor: tableHeaderBg }}>
                      <Table.Tr>
                        <Table.Th style={{ textAlign: "center", fontWeight: 700, color: tableHeaderText }}>Sighting</Table.Th>
                        <Table.Th style={{ textAlign: "center", fontWeight: 700, color: tableHeaderText }}>Location</Table.Th>
                        <Table.Th style={{ textAlign: "center", fontWeight: 700, color: tableHeaderText }}>Date</Table.Th>
                        <Table.Th style={{ textAlign: "center", fontWeight: 700, color: tableHeaderText }}>Time</Table.Th>
                        <Table.Th style={{ textAlign: "center", fontWeight: 700, color: tableHeaderText }}>Accuracy</Table.Th>
                        <Table.Th style={{ textAlign: "center", fontWeight: 700, color: tableHeaderText }}>Type</Table.Th>
                        <Table.Th style={{ textAlign: "center", fontWeight: 700, color: tableHeaderText }}>Status</Table.Th>
                        <Table.Th style={{ textAlign: "center", fontWeight: 700, color: tableHeaderText }}>Actions</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {paginatedData.map((detection) => {
                        const accuracy = detection.accuracy || "--";
                        const isSelected = selectedDetection?.id === detection.id;

                        return (
                          <Table.Tr
                            key={detection.id}
                            style={{
                              backgroundColor: isSelected ? selectedRowBg : undefined,
                              cursor: "pointer",
                              borderLeft: isSelected ? `4px solid ${selectedRowBorder}` : "none",
                            }}
                            onClick={(e) => handleRowClick(detection, e)}
                          >
                            <Table.Td style={{ textAlign: "center" }}>
                              <Group justify="center" gap="xs">
                                <IconAlertCircle size={16} color={detection.type === "Suggestion" ? "#f59e0b" : "#ef4444"} />
                                <Text fw={600}>{detection.name}</Text>
                              </Group>
                            </Table.Td>
                            <Table.Td style={{ textAlign: "center" }}>
                              <Group justify="center" gap="xs">
                                <IconMapPin size={14} color="#3b82f6" />
                                <Text>{detection.location}</Text>
                              </Group>
                            </Table.Td>
                            <Table.Td style={{ textAlign: "center" }}>
                              <Group justify="center" gap="xs">
                                <IconCalendar size={14} color="#3b82f6" />
                                <Text>{detection.date}</Text>
                              </Group>
                            </Table.Td>
                            <Table.Td style={{ textAlign: "center" }}>
                              {detection.time}
                            </Table.Td>
                            <Table.Td style={{ textAlign: "center" }}>
                              {detection.type === "Person" || !accuracy || accuracy === "--" ? (
                                <Text c="dimmed">--</Text>
                              ) : (
                                <Badge
                                  color={
                                    parseFloat(accuracy) >= 80 ? "green" :
                                    parseFloat(accuracy) >= 60 ? "yellow" : "red"
                                  }
                                  variant="light"
                                  size="sm"
                                >
                                  {accuracy}
                                </Badge>
                              )}
                            </Table.Td>
                            <Table.Td style={{ textAlign: "center" }}>
                              <Group justify="center" gap="xs">
                                {detection.type === "Person" ? (
                                  <IconUser size={14} color="#3b82f6" />
                                ) : detection.type === "Suggestion" ? (
                                  <IconStar size={14} color="#f59e0b" />
                                ) : (
                                  <IconCamera size={14} color="#3b82f6" />
                                )}
                                <Badge
                                  color={detection.type === "Suggestion" ? "yellow" : "blue"}
                                  variant="light"
                                  size="sm"
                                >
                                  {detection.type || "CCTV"}
                                </Badge>
                              </Group>
                            </Table.Td>
                            <Table.Td style={{ textAlign: "center" }}>
                              <Badge
                                color={detection.status === "active" ? "red" : "green"}
                                variant="filled"
                                size="sm"
                              >
                                {detection.status === "active" ? "ACTIVE" : "RESOLVED"}
                              </Badge>
                            </Table.Td>
                            <Table.Td style={{ textAlign: "center" }}>
                              <ActionIcon
                                variant="subtle"
                                color="blue"
                                size="lg"
                                className="arrow-button"
                                onClick={(e) => handleArrowClick(detection, e)}
                                style={{
                                  backgroundColor: isSelected
                                    ? getBg(colorScheme, '#dbeafe', theme.colors.blue[9])
                                    : "transparent",
                                  borderRadius: "50%",
                                }}
                              >
                                <IconChevronRight size={18} />
                              </ActionIcon>
                            </Table.Td>
                          </Table.Tr>
                        );
                      })}
                    </Table.Tbody>
                  </Table>
                </ScrollArea>
              </Box>

              {/* Pagination */}
              <Box
                p="md"
                style={{
                  borderTop: `1px solid ${borderColor}`,
                  backgroundColor: paginationBg,
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Text size="sm" c={paginationText} fw={500}>
                  Page {activePage} of {totalPages} • {detectionHistory.length} total sightings
                  {selectedDetection && ` • Selected: ${selectedDetection.name}`}
                </Text>
                <Pagination
                  value={activePage}
                  onChange={setActivePage}
                  total={totalPages}
                  size="sm"
                  radius="sm"
                  withEdges
                  siblings={1}
                  color="blue"
                />
              </Box>
            </Paper>
          </Grid.Col>
        </Grid>

        {/* Actions */}
        <Group justify="center" mt="xl">
          <Button
            size="lg"
            variant="light"
            color="gray"
            leftSection={<IconArrowLeft size={18} />}
            onClick={() => router.push("/user/alert")}
          >
            Back to Alerts
          </Button>
          {/* ========== CHANGED to custom handler ========== */}
          <Button 
            size="lg" 
            color="blue" 
            leftSection={<IconDownload size={18} />}
            onClick={handleDownloadReport}
          >
            Download Full Report
          </Button>
        </Group>
      </Box>

      <MainFooter />
    </Box>
  );
}