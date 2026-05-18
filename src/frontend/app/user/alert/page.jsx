"use client";
import { notifications } from "@mantine/notifications";

import {
  Box,
  Container,
  Title,
  Text,
  Card,
  Group,
  Button,
  Paper,
  Stack,
  Avatar,
  Badge,
  SimpleGrid,
  ActionIcon,
  Menu,
  UnstyledButton,
  TextInput,
  ScrollArea,
  Divider,
  useMantineTheme,
  useMantineColorScheme,
  Loader,
  Checkbox,
  Modal,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconChevronRight,
  IconMapPin,
  IconCalendar,
  IconCar,
  IconSearch,
  IconHome,
  IconUser,
  IconBell,
  IconHistory,
  IconSettings,
  IconLogout,
  IconShieldCheck,
  IconChevronLeft,
  IconX,
  IconCheck,
  IconInfoCircle,
  IconMapPinFilled,
  IconPhone,
  IconMail,
  IconDots,
  IconEdit,
  IconTrash,
  IconBike,
  IconTruck,
  IconBattery,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import MainFooter from "../../components/MainFooter";
import Link from "next/link";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import { apiClient } from "../../lib/apiClient";
import DashboardHeader from "../dashboard/DashboardHeader";

// API Endpoints
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";
const MY_MISSING_VEHICLES_API = `${API_BASE_URL}/missing-vehicles/my-reports`;
const MY_MISSING_PERSONS_API = `${API_BASE_URL}/missing-persons/my-reports`;
const MISSING_VEHICLES_API = `${API_BASE_URL}/missing-vehicles`;
const MISSING_PERSONS_API = `${API_BASE_URL}/missing-persons`;
const SIGHTINGS_API = `${API_BASE_URL}/sightings`;
const MY_SIGHTINGS_API = `${API_BASE_URL}/sightings/my-sightings`;

// Helper to get dynamic background/color values
const getBg = (colorScheme, light, dark) =>
  colorScheme === "dark" ? dark : light;
const getBorderColor = (colorScheme, light, dark) =>
  colorScheme === "dark" ? dark : light;

export default function AlertPage() {
  const router = useRouter();
  const scrollRef = useRef(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [persons, setPersons] = useState([]);
  const [sightings, setSightings] = useState([]); // NEW: store all sightings
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, resolved: 0, active: 0 });
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();

  // State for logged-in username
  const [username, setUsername] = useState("User");

  // State for delete confirmation modal (optional)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteAlertInfo, setDeleteAlertInfo] = useState(null);
  const [deleteSightingsToo, setDeleteSightingsToo] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const extractArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http") || path.startsWith("data:")) return path;
    const baseUrl = API_BASE_URL.replace("/api/v1", "");
    return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
  };

  // Fetch user data from localStorage on mount
  // Fetch user data from localStorage on mount

  // Add this function after your useState declarations
  const handleLogout = async () => {
    try {
      // Removed logging to JSON Server
      // Optional: Log logout event (removed)
    } catch (error) {
      console.error("Failed to log logout", error);
    }

    // Clear authentication data
    localStorage.removeItem("currentUser");
    localStorage.removeItem("isAuthenticated");

    // Redirect to home page
    router.push("/");
  };
  
  useEffect(() => {
    try {
      // Use 'currentUser' instead of 'user' to match dashboard
      const storedUser = localStorage.getItem("currentUser");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        // Get the full name properly
        const fullName =
          `${user.firstName || ""} ${user.lastName || ""}`.trim();
        setUsername(
          fullName ||
            user.name ||
            user.username ||
            user.email?.split("@")[0] ||
            "User",
        );
      }
    } catch (error) {
      console.error("Failed to parse user data from localStorage", error);
    }
  }, []);

  // Authentication check
  useEffect(() => {
    const checkAuth = () => {
      const isAuthenticated = localStorage.getItem('isAuthenticated');
      const userData = localStorage.getItem('currentUser');

      if (!isAuthenticated || !userData || isAuthenticated !== 'true') {
        notifications.show({ title: 'Login Required', message: 'Please login to view alerts', color: 'yellow', icon: <IconAlertCircle size={20} /> });
        router.push('/authentication/login');
        return;
      }
      try {
        setCurrentUser(JSON.parse(userData));
      } catch (e) {}
    };
    checkAuth();
  }, [router]);

  // Fetch real data from backend (including sightings)
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);

        // Fetch vehicles, persons, and sightings in parallel
        const [vehiclesResponse, personsResponse, sightingsResponse] =
          await Promise.all([
            apiClient(MY_MISSING_VEHICLES_API),
            apiClient(MY_MISSING_PERSONS_API),
            apiClient(MY_SIGHTINGS_API),
          ]);

        const vehiclesData = extractArray(await vehiclesResponse.json());
        const personsData = extractArray(await personsResponse.json());
        const sightingsData = extractArray(await sightingsResponse.json());

        setSightings(sightingsData);

        // Transform vehicle data
        const transformedVehicles = vehiclesData.map((vehicle) => {
          const caseId = vehicle.caseId || `CASE-${vehicle.id}`;
          
          // Match sightings by plate number
          const vehicleSightings = sightingsData.filter(s => 
            s.type === 'vehicle' && 
            s.plateNumber && 
            vehicle.plateNumber && 
            s.plateNumber.toUpperCase() === vehicle.plateNumber.toUpperCase()
          );
          return {
            id: vehicle._id || vehicle.id,
            code: vehicle.caseId || caseId,
            brand:
              `${vehicle.brand || ""} ${vehicle.model || ""} ${vehicle.submodel || ""}`.trim(),
            type: determineVehicleType(vehicle),
            status: vehicle.status?.toLowerCase() || "active",
            location: vehicle.lastSeenLocation || vehicle.location || "Unknown",
            time: vehicle.lastSeenDate
              ? new Date(vehicle.lastSeenDate).toLocaleDateString()
              : vehicle.reportDate
                ? new Date(vehicle.reportDate).toLocaleDateString()
                : "Unknown",
            imageUrl: getImageUrl(vehicle.imagePreview) || "/ebs.jpg",
            details:
              vehicle.vehicleDescription ||
              `${vehicle.color || ""} ${vehicle.brand || ""}`.trim(),
            fullDescription:
              vehicle.vehicleDescription || "No description provided",
            lastSeen: vehicle.lastSeenLocation || "Unknown",
            mapLocation: vehicle.lastSeenLocation || "Unknown",
            reportDate: vehicle.reportDate,
            duration: calculateDuration(vehicle.reportDate),

            // NEW: attach sightings
            detectionHistory: vehicleSightings,

            contactInfo: vehicle.reportedBy
              ? {
                  name:
                    `${vehicle.reportedBy.firstName || ""} ${vehicle.reportedBy.lastName || ""}`.trim() ||
                    "Unknown",
                  phone: vehicle.reportedBy.phone || "Not provided",
                  email: vehicle.reportedBy.email || "Not provided",
                  role: vehicle.reportedBy.role || "Reporter",
                }
              : {
                  name: "Unknown",
                  phone: "Not provided",
                  email: "Not provided",
                },

            technicalSpecs: {
              color: vehicle.color || "Unknown",
              plateNumber: vehicle.plateNumber || "Unknown",
              plateType: vehicle.plateType || "Unknown",
              region: vehicle.region || "Unknown",
              ...vehicle.technicalSpecs,
            },

            features: vehicle.features || [],
            additionalImages: vehicle.images || [],

            cctvInfo: vehicle.cctvInfo || { confidence: "N/A" },

            // NEW: stats including total detections
            stats: {
              totalDetections: vehicleSightings.length,
            },
          };
        });

        // Transform person data
        const transformedPersons = personsData.map((person) => {
          const caseId = person.caseId || `CASE-${person.id}`;
          
          // Match sightings by name
          const firstName = (person.firstName || "").toLowerCase();
          const lastName = (person.lastName || "").toLowerCase();
          
          const personSightings = sightingsData.filter(s => {
             if (s.type !== 'person' || !s.name) return false;
             const sName = s.name.toLowerCase();
             return (firstName && sName.includes(firstName)) || (lastName && sName.includes(lastName));
          });
          return {
            id: person._id || person.id,
            code: person.caseId || caseId,
            brand:
              `${person.firstName || ""} ${person.middleName || ""} ${person.lastName || ""}`.trim(),
            type: "person",
            status: person.status?.toLowerCase() || "active",
            location: person.lastSeenLocation || person.location || "Unknown",
            time: person.lastSeenDate
              ? new Date(person.lastSeenDate).toLocaleDateString()
              : person.reportDate
                ? new Date(person.reportDate).toLocaleDateString()
                : "Unknown",
            imageUrl: getImageUrl(person.images?.[0]) || "/surveillance-man.jpg",
            details: `Age: ${person.age || "Unknown"}, Gender: ${person.gender || "Unknown"}`,
            fullDescription: person.description || "No description provided",
            lastSeen: person.lastSeenLocation || "Unknown",
            mapLocation: person.lastSeenLocation || "Unknown",
            reportDate: person.reportDate,
            duration: calculateDuration(person.reportDate),

            // NEW: attach sightings
            detectionHistory: personSightings,

            contactInfo: person.reportedBy
              ? {
                  name:
                    `${person.reportedBy.firstName || ""} ${person.reportedBy.lastName || ""}`.trim() ||
                    "Unknown",
                  phone: person.reportedBy.phone || "Not provided",
                  email: person.reportedBy.email || "Not provided",
                  role: person.reportedBy.role || "Reporter",
                }
              : {
                  name: "Unknown",
                  phone: "Not provided",
                  email: "Not provided",
                },

            technicalSpecs: {
              age: person.age || "Unknown",
              gender: person.gender || "Unknown",
              height: person.height ? `${person.height} cm` : "Unknown",
              weight: person.weight ? `${person.weight} kg` : "Unknown",
            },

            features: person.features || [],
            additionalImages: person.images || [],

            // NEW: stats including total detections
            stats: {
              totalDetections: personSightings.length,
            },
          };
        });

        const allAlerts = [...transformedVehicles, ...transformedPersons];

        setVehicles(transformedVehicles);
        setPersons(transformedPersons);
        setFilteredAlerts(allAlerts);

        // Calculate stats
        const activeCount = allAlerts.filter(
          (v) => v.status === "active",
        ).length;
        const resolvedCount = allAlerts.filter(
          (v) => v.status === "resolved" || v.status === "inactive",
        ).length;

        setStats({
          total: allAlerts.length,
          active: activeCount,
          resolved: resolvedCount,
        });
      } catch (error) {
        console.error("Error fetching alerts:", error);
        notifications.show({
          title: "Error",
          message: "Failed to load alerts from database",
          color: "red",
          icon: <IconAlertCircle size={16} />,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [currentUser]);

  // Helper function to determine vehicle type
  const determineVehicleType = (vehicle) => {
    if (vehicle.type) return vehicle.type;
    if (
      vehicle.brand?.toLowerCase().includes("motor") ||
      vehicle.model?.toLowerCase().includes("motor")
    )
      return "motorcycle";
    if (
      vehicle.brand?.toLowerCase().includes("truck") ||
      vehicle.model?.toLowerCase().includes("truck")
    )
      return "truck";
    if (vehicle.technicalSpecs?.electric) return "electric";
    return "car";
  };

  // Helper function to calculate duration
  const calculateDuration = (reportDate) => {
    if (!reportDate) return "Unknown";
    const days = Math.floor(
      (new Date() - new Date(reportDate)) / (1000 * 60 * 60 * 24),
    );
    return `${days} day${days !== 1 ? "s" : ""}`;
  };

  // Search functionality
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredAlerts([...vehicles, ...persons]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = [...vehicles, ...persons].filter(
      (alert) =>
        alert.brand.toLowerCase().includes(query) ||
        alert.code.toLowerCase().includes(query) ||
        alert.location.toLowerCase().includes(query) ||
        alert.details.toLowerCase().includes(query) ||
        alert.status.toLowerCase().includes(query) ||
        (alert.technicalSpecs?.plateNumber || "").toLowerCase().includes(query),
    );
    setFilteredAlerts(filtered);
  }, [searchQuery, vehicles, persons]);

  // Freeze background scrolling when popup is open
  useEffect(() => {
    if (selectedAlert) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedAlert]);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -350, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 350, behavior: "smooth" });
    }
  };

  const handleViewDetail = (alert) => {
    setSelectedAlert(alert);
  };

  const handleCloseDetail = () => {
    setSelectedAlert(null);
  };

  const handleBackgroundClick = (e) => {
    e.stopPropagation();
    handleCloseDetail();
  };

  // MODIFIED: delete function with option to delete associated sightings
  const handleDeleteAlert = async (alertId, alertCode) => {
    const alertToDelete = filteredAlerts.find((alert) => alert.id === alertId);
    if (!alertToDelete) return;

    // Open confirmation modal instead of window.confirm
    setDeleteAlertInfo({ alertId, alertCode, alertToDelete });
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteAlertInfo) return;
    const { alertId, alertCode, alertToDelete } = deleteAlertInfo;

    try {
      // Determine which API to use
      const isVehicle = alertToDelete.type !== "person";
      const apiUrl = isVehicle ? MISSING_VEHICLES_API : MISSING_PERSONS_API;

      // Delete the main alert
      await fetch(`${apiUrl}/${alertId}`, {
        method: "DELETE",
      });

      // If user chose to delete associated sightings
      if (deleteSightingsToo && alertToDelete.detectionHistory?.length > 0) {
        // Delete each sighting
        await Promise.all(
          alertToDelete.detectionHistory.map((sighting) =>
            fetch(`${SIGHTINGS_API}/${sighting.id}`, { method: "DELETE" }),
          ),
        );
        // Update local sightings state
        setSightings((prev) =>
          prev.filter(
            (s) => !alertToDelete.detectionHistory.some((d) => d.id === s.id),
          ),
        );
      }

      // Update local state
      if (isVehicle) {
        setVehicles((prev) => prev.filter((alert) => alert.id !== alertId));
      } else {
        setPersons((prev) => prev.filter((alert) => alert.id !== alertId));
      }

      setFilteredAlerts((prevAlerts) =>
        prevAlerts.filter((alert) => alert.id !== alertId),
      );

      if (selectedAlert && selectedAlert.id === alertId) {
        setSelectedAlert(null);
      }

      // Update stats
      const newTotal = stats.total - 1;
      const newActive =
        alertToDelete.status === "active" ? stats.active - 1 : stats.active;
      const newResolved =
        alertToDelete.status === "resolved"
          ? stats.resolved - 1
          : stats.resolved;

      setStats({
        total: newTotal,
        active: newActive,
        resolved: newResolved,
      });

      notifications.show({
        title: "Alert Deleted",
        message: `Alert "${alertCode}" has been successfully deleted${deleteSightingsToo ? " along with its associated sightings" : ""}.`,
        color: "red",
        icon: <IconTrash size={16} />,
      });
    } catch (error) {
      console.error("Error deleting alert:", error);
      notifications.show({
        title: "Error",
        message: "Failed to delete alert from database",
        color: "red",
        icon: <IconAlertCircle size={16} />,
      });
    } finally {
      setDeleteModalOpen(false);
      setDeleteAlertInfo(null);
      setDeleteSightingsToo(false);
    }
  };

  // Get icon based on vehicle type
  const getVehicleIcon = (type) => {
    switch (type) {
      case "motorcycle":
        return <IconBike size={16} color="blue" />;
      case "truck":
        return <IconTruck size={16} color="blue" />;
      case "electric":
        return <IconBattery size={16} color="blue" />;
      case "person":
        return <IconUser size={16} color="blue" />;
      default:
        return <IconCar size={16} color="blue" />;
    }
  };

  // Dynamic colors
  const mainBg = getBg(colorScheme, "white", theme.colors.dark[7]);
  const headerBg = getBg(colorScheme, "white", theme.colors.dark[6]);
  const borderColor = getBorderColor(
    colorScheme,
    "#E9ECEF",
    theme.colors.dark[5],
  );
  const paperBg = getBg(colorScheme, "white", theme.colors.dark[6]);
  const blueLightBg = getBg(colorScheme, "blue.0", theme.colors.blue[9]);
  const grayLightBg = getBg(colorScheme, "gray.0", theme.colors.dark[5]);
  const overlayBg =
    colorScheme === "dark" ? "rgba(0, 0, 0, 0.85)" : "rgba(0, 0, 0, 0.75)";
  const cardBorder = colorScheme === "dark" ? theme.colors.dark[4] : "#e0e0e0";

  return (
    <Box bg={mainBg} style={{ minHeight: "100vh", position: "relative" }}>
      {/* ── Reusable Unified Header ── */}
      <DashboardHeader />

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Delete"
        centered
      >
        <Stack>
          <Text>
            Are you sure you want to delete alert "{deleteAlertInfo?.alertCode}
            "?
          </Text>
          <Checkbox
            label="Also delete all associated sightings"
            checked={deleteSightingsToo}
            onChange={(e) => setDeleteSightingsToo(e.currentTarget.checked)}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button color="red" onClick={confirmDelete}>
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Main Content */}
      <Container size="xl" py={40}>
        <Paper p="md" mb="xl" bg={blueLightBg} radius="md">
          <Group>
            <IconAlertCircle size={24} color={theme.colors.blue[6]} />
            <div>
              <Text fw={600}>Alert Notifications</Text>
              <Text size="sm" c="dimmed">
                {loading
                  ? "Loading..."
                  : `You have ${filteredAlerts.filter((a) => a.status === "active").length} active alerts ${searchQuery && `matching "${searchQuery}"`}`}
              </Text>
            </div>
          </Group>
        </Paper>

        {loading ? (
          <Box
            style={{
              minHeight: "60vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Stack align="center" gap="md">
              <Loader size="xl" color="blue" />
              <Text>Loading alerts from database...</Text>
            </Stack>
          </Box>
        ) : (
          <>
            <Title order={2} style={{ textAlign: "center", marginBottom: 20 }}>
              Reported Cases ({filteredAlerts.length} found)
            </Title>

            <Box style={{ position: "relative", marginBottom: 40 }}>
              {filteredAlerts.length > 3 && (
                <ActionIcon
                  variant="filled"
                  color="gray"
                  radius="xl"
                  size="xl"
                  style={{
                    position: "absolute",
                    left: -25,
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 10,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  }}
                  onClick={scrollLeft}
                >
                  <IconChevronLeft size={20} />
                </ActionIcon>
              )}

              <ScrollArea
                w="100%"
                type="hover"
                viewportRef={scrollRef}
                scrollbarSize={0}
                styles={{ scrollbar: { display: "none" } }}
              >
                <Group wrap="nowrap" gap="lg" p="md">
                  {filteredAlerts.map((alert) => (
                    <Card
                      key={alert.id}
                      withBorder
                      shadow="sm"
                      radius="md"
                      p={0}
                      style={{
                        overflow: "hidden",
                        minWidth: 320,
                        flexShrink: 0,
                        border: `1px solid ${cardBorder}`,
                        position: "relative",
                      }}
                    >
                      {/* Vehicle/Person Image with Overlay Icons */}
                      <Box style={{ height: 180, position: "relative" }}>
                        <Image
                          src={alert.imageUrl}
                          alt={alert.brand}
                          fill
                          style={{ objectFit: "cover" }}
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          onError={(e) => {
                            e.currentTarget.src =
                              alert.type === "person"
                                ? "/surveillance-man.jpg"
                                : "/ebs.jpg";
                          }}
                        />

                        {/* Overlay Icons Container */}
                        <Box
                          style={{
                            position: "absolute",
                            top: 12,
                            left: 12,
                            right: 12,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            zIndex: 2,
                          }}
                        >
                          {/* Bell Icon - Left side */}
                          <ActionIcon
                            variant="filled"
                            color="white"
                            size="md"
                            radius="xl"
                            style={{
                              backgroundColor: "rgba(0, 0, 0, 0.4)",
                              backdropFilter: "blur(4px)",
                              border: "1px solid rgba(255, 255, 255, 0.2)",
                            }}
                            onClick={() =>
                              router.push(
                                `/user/alert/alert-detail/${alert.id}`,
                              )
                            }
                          >
                            <IconBell size={18} />
                          </ActionIcon>

                          {/* Menu Icon - Right side */}
                          <Menu
                            shadow="md"
                            width={120}
                            position="bottom-end"
                            withArrow
                            arrowPosition="center"
                            transitionProps={{ transition: "pop-top-right" }}
                          >
                            <Menu.Target>
                              <ActionIcon
                                variant="filled"
                                color="white"
                                size="md"
                                radius="xl"
                                style={{
                                  backgroundColor: "rgba(0, 0, 0, 0.4)",
                                  backdropFilter: "blur(4px)",
                                  border: "1px solid rgba(255, 255, 255, 0.2)",
                                }}
                              >
                                <IconDots size={18} />
                              </ActionIcon>
                            </Menu.Target>

                            <Menu.Dropdown>
                              <Menu.Item
                                leftSection={<IconEdit size={16} />}
                                onClick={() => {
                                  notifications.show({
                                    title: "Edit Alert",
                                    message: `Edit functionality for ${alert.code} would open here`,
                                    color: "blue",
                                  });
                                }}
                              >
                                Edit
                              </Menu.Item>
                              <Menu.Divider />
                              <Menu.Item
                                color="red"
                                leftSection={<IconTrash size={16} />}
                                onClick={() =>
                                  handleDeleteAlert(alert.id, alert.code)
                                }
                              >
                                Delete
                              </Menu.Item>
                            </Menu.Dropdown>
                          </Menu>
                        </Box>

                        {/* Dark gradient overlay at top for better icon visibility */}
                        <Box
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            height: "50px",
                            background:
                              "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 100%)",
                            zIndex: 1,
                          }}
                        />
                      </Box>

                      <Box p="lg">
                        <Group justify="space-between" mb="md">
                          <Badge
                            color={alert.status === "active" ? "red" : "green"}
                            variant="light"
                          >
                            {alert.status === "active" ? "ACTIVE" : "RESOLVED"}
                          </Badge>
                          <Text fw={700} size="lg" c="blue.6">
                            {alert.code}
                          </Text>
                        </Group>

                        <Stack gap="xs">
                          <Group gap="xs">
                            {getVehicleIcon(alert.type)}
                            <Text fw={700} size="lg">
                              {alert.brand}
                            </Text>
                          </Group>

                          <Text size="md" fw={500}>
                            {alert.details}
                          </Text>

                          <Group gap="xs">
                            <IconMapPin size={16} color="gray" />
                            <Text size="sm">{alert.location}</Text>
                          </Group>

                          <Group gap="xs">
                            <IconCalendar size={16} color="gray" />
                            <Text size="sm">{alert.time}</Text>
                          </Group>

                          <Group gap="xs">
                            <IconAlertCircle
                              size={16}
                              color={
                                alert.status === "active" ? "red" : "green"
                              }
                            />
                            <Text
                              size="sm"
                              c={alert.status === "active" ? "red" : "green"}
                            >
                              {alert.status === "active"
                                ? `${alert.stats?.totalDetections || 0} sighting${alert.stats?.totalDetections !== 1 ? "s" : ""}`
                                : "Case resolved"}
                            </Text>
                          </Group>
                        </Stack>

                        <Button
                          fullWidth
                          mt="md"
                          variant="light"
                          color="blue"
                          rightSection={<IconChevronRight size={16} />}
                          onClick={() => handleViewDetail(alert)}
                        >
                          View Detail
                        </Button>
                      </Box>
                    </Card>
                  ))}
                </Group>
              </ScrollArea>

              {filteredAlerts.length > 3 && (
                <ActionIcon
                  variant="filled"
                  color="black"
                  radius="xl"
                  size="xl"
                  style={{
                    position: "absolute",
                    right: -25,
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 10,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  }}
                  onClick={scrollRight}
                >
                  <IconChevronRight size={20} />
                </ActionIcon>
              )}
            </Box>

            <Paper withBorder p="lg" mt="xl" radius="md" bg={paperBg}>
              <SimpleGrid cols={{ base: 1, sm: 3 }}>
                <Stack align="center" gap={0}>
                  <Text size="xl" fw={800} c="blue.6">
                    {stats.total}
                  </Text>
                  <Text size="sm" c="dimmed">
                    Total Alerts
                  </Text>
                </Stack>
                <Stack align="center" gap={0}>
                  <Text size="xl" fw={800} c="green.6">
                    {stats.resolved}
                  </Text>
                  <Text size="sm" c="dimmed">
                    Resolved
                  </Text>
                </Stack>
                <Stack align="center" gap={0}>
                  <Text size="xl" fw={800} c="red.6">
                    {stats.active}
                  </Text>
                  <Text size="sm" c="dimmed">
                    Active
                  </Text>
                </Stack>
              </SimpleGrid>
            </Paper>
          </>
        )}
      </Container>

      {/* POPUP DETAIL CARD - FIXED SCROLLING */}
      {selectedAlert && (
        <>
          {/* Overlay */}
          <Box
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: overlayBg,
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              zIndex: 1000,
            }}
            onClick={handleBackgroundClick}
          />

          {/* Detail Card Container */}
          <Box
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "95%",
              maxWidth: "900px",
              height: "90vh",
              backgroundColor: paperBg,
              borderRadius: "20px",
              overflow: "hidden",
              boxShadow: "0 25px 50px rgba(0, 0, 0, 0.5)",
              zIndex: 1001,
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <ActionIcon
              variant="filled"
              color="dark"
              radius="xl"
              size="lg"
              style={{
                position: "absolute",
                top: 20,
                right: 20,
                zIndex: 1002,
              }}
              onClick={handleCloseDetail}
            >
              <IconX size={20} />
            </ActionIcon>

            {/* SCROLLABLE CONTENT */}
            <Box
              style={{
                flex: 1,
                overflowY: "auto",
                paddingBottom: "20px",
              }}
            >
              {/* Main Image */}
              <Box style={{ height: 300, position: "relative" }}>
                <Image
                  src={selectedAlert.imageUrl}
                  alt={selectedAlert.brand}
                  fill
                  style={{ objectFit: "cover" }}
                  sizes="100vw"
                  priority
                />
              </Box>

              {/* Content */}
              <Box p="xl">
                <Group justify="space-between" mb="xl">
                  <Badge
                    size="xl"
                    color={selectedAlert.status === "active" ? "red" : "green"}
                  >
                    {selectedAlert.status === "active"
                      ? "ACTIVE ALERT"
                      : "RESOLVED"}
                  </Badge>
                  <Text fw={800} size="2rem" c="blue.6">
                    {selectedAlert.code}
                  </Text>
                </Group>

                <Box mb="xl">
                  <Group gap="md" mb="xs">
                    {getVehicleIcon(selectedAlert.type)}
                    <Text fw={800} size="2rem">
                      {selectedAlert.brand}
                    </Text>
                  </Group>
                  <Text size="xl" c="dimmed" fw={500}>
                    {selectedAlert.details}
                  </Text>
                </Box>

                <Divider mb="xl" color={borderColor} />

                {/* Full Description Section */}
                <Box mb="xl">
                  <Group mb="md">
                    <IconInfoCircle size={24} />
                    <Text fw={700} size="xl">
                      Full Description
                    </Text>
                  </Group>
                  <Paper p="xl" withBorder radius="md" bg={grayLightBg}>
                    <Text
                      size="lg"
                      style={{ lineHeight: 1.6, whiteSpace: "pre-line" }}
                    >
                      {selectedAlert.fullDescription}
                    </Text>
                  </Paper>
                </Box>

                {/* Features Grid */}
                {selectedAlert.features &&
                  selectedAlert.features.length > 0 && (
                    <Box mb="xl">
                      <Text fw={700} size="xl" mb="lg">
                        Features
                      </Text>
                      <SimpleGrid cols={3} spacing="lg">
                        {selectedAlert.features.map((feature, index) => (
                          <Group key={index} gap="sm">
                            <IconCheck size={20} color="green" />
                            <Text fw={500}>{feature}</Text>
                          </Group>
                        ))}
                      </SimpleGrid>
                    </Box>
                  )}

                {/* Technical Specifications */}
                {selectedAlert.technicalSpecs &&
                  Object.keys(selectedAlert.technicalSpecs).length > 0 && (
                    <Box mb="xl">
                      <Text fw={700} size="xl" mb="lg">
                        {selectedAlert.type === "person"
                          ? "Personal Details"
                          : "Technical Specifications"}
                      </Text>
                      <Paper p="xl" withBorder radius="md" bg={grayLightBg}>
                        <SimpleGrid cols={2} spacing="lg">
                          {Object.entries(selectedAlert.technicalSpecs).map(
                            ([key, value]) =>
                              value &&
                              value !== "Unknown" &&
                              value !== "Not provided" && (
                                <Box key={key}>
                                  <Text fw={600} mb="xs" tt="capitalize">
                                    {key.replace(/([A-Z])/g, " $1")}
                                  </Text>
                                  <Text>{value}</Text>
                                </Box>
                              ),
                          )}
                        </SimpleGrid>
                      </Paper>
                    </Box>
                  )}

                {/* Location & Time */}
                <SimpleGrid cols={2} mb="xl">
                  <Paper p="xl" withBorder radius="md" bg={grayLightBg}>
                    <Group mb="md">
                      <IconMapPinFilled size={24} color="blue" />
                      <Text fw={700} size="lg">
                        Last Known Location
                      </Text>
                    </Group>
                    <Text size="md">{selectedAlert.lastSeen}</Text>
                    <Text size="sm" c="dimmed" mt="sm">
                      {selectedAlert.mapLocation}
                    </Text>
                  </Paper>
                  <Paper p="xl" withBorder radius="md" bg={grayLightBg}>
                    <Group mb="md">
                      <IconCalendar size={24} color="blue" />
                      <Text fw={700} size="lg">
                        Report Timeline
                      </Text>
                    </Group>
                    <Text size="md">
                      Reported:{" "}
                      {selectedAlert.reportDate
                        ? new Date(
                            selectedAlert.reportDate,
                          ).toLocaleDateString()
                        : "Unknown"}
                    </Text>
                    <Text size="md" mt="sm">
                      Duration: {selectedAlert.duration}
                    </Text>
                    <Text size="sm" c="dimmed" mt="sm">
                      Last Updated:{" "}
                      {selectedAlert.reportDate
                        ? new Date(
                            selectedAlert.reportDate,
                          ).toLocaleDateString()
                        : "Today"}
                    </Text>
                  </Paper>
                </SimpleGrid>

                {/* NEW: Sighting History Section */}
                {selectedAlert.detectionHistory &&
                  selectedAlert.detectionHistory.length > 0 && (
                    <Paper
                      p="xl"
                      withBorder
                      radius="md"
                      mb="xl"
                      bg={grayLightBg}
                    >
                      <Text fw={700} size="xl" mb="lg">
                        Sighting History (
                        {selectedAlert.detectionHistory.length})
                      </Text>
                      <Stack gap="md">
                        {selectedAlert.detectionHistory.map((sighting, idx) => (
                          <Card key={idx} withBorder p="sm" radius="md">
                            <Group gap="sm" align="flex-start">
                              <Avatar color="blue" radius="xl">
                                {sighting.type === "Person" ? (
                                  <IconUser size={16} />
                                ) : (
                                  <IconCar size={16} />
                                )}
                              </Avatar>
                              <Box style={{ flex: 1 }}>
                                <Text size="sm" fw={500}>
                                  {sighting.type === "Person"
                                    ? sighting.name
                                    : sighting.plateNumber}
                                </Text>
                                <Group gap="xs" mt={4}>
                                  <IconMapPin size={12} />
                                  <Text size="xs" c="dimmed">
                                    {sighting.location?.address || 'Unknown location'}
                                  </Text>
                                </Group>
                                <Group gap="xs" mt={4}>
                                  <IconCalendar size={12} />
                                  <Text size="xs" c="dimmed">
                                    {new Date(
                                      sighting.reportDate,
                                    ).toLocaleString()}
                                  </Text>
                                </Group>
                                {sighting.description && (
                                  <Text size="xs" c="dimmed" mt={4}>
                                    {sighting.description}
                                  </Text>
                                )}
                              </Box>
                              <Badge size="sm" color="green">
                                Sighting
                              </Badge>
                            </Group>
                          </Card>
                        ))}
                      </Stack>
                    </Paper>
                  )}

                {/* Contact Information */}
                {selectedAlert.contactInfo && (
                  <Paper p="xl" withBorder radius="md" bg={blueLightBg} mb="xl">
                    <Text fw={700} size="xl" mb="lg">
                      Contact Information
                    </Text>
                    <Stack gap="xl">
                      <Box>
                        <Group mb="sm">
                          <IconUser size={22} />
                          <Text fw={600} size="lg">
                            Reported By
                          </Text>
                        </Group>
                        <Text size="md">{selectedAlert.contactInfo.name}</Text>
                        <Text size="sm" c="dimmed" mt={4}>
                          {selectedAlert.contactInfo.role}
                        </Text>
                      </Box>
                      <Box>
                        <Group mb="sm">
                          <IconPhone size={22} />
                          <Text fw={600} size="lg">
                            Contact Number
                          </Text>
                        </Group>
                        <Text size="md">{selectedAlert.contactInfo.phone}</Text>
                      </Box>
                      <Box>
                        <Group mb="sm">
                          <IconMail size={22} />
                          <Text fw={600} size="lg">
                            Email Address
                          </Text>
                        </Group>
                        <Text size="md">{selectedAlert.contactInfo.email}</Text>
                      </Box>
                    </Stack>
                  </Paper>
                )}

                {/* Additional Images */}
                {selectedAlert.additionalImages &&
                  selectedAlert.additionalImages.length > 0 && (
                    <Box mb="xl">
                      <Text fw={700} size="xl" mb="lg">
                        Additional Evidence
                      </Text>
                      <Group gap="lg">
                        {selectedAlert.additionalImages
                          .slice(0, 4)
                          .map((img, i) => (
                            <Box
                              key={i}
                              style={{
                                width: 150,
                                height: 150,
                                position: "relative",
                                borderRadius: "12px",
                                overflow: "hidden",
                                cursor: "pointer",
                                border: `3px solid ${borderColor}`,
                              }}
                            >
                              <Image
                                src={img}
                                alt={`Evidence ${i + 1}`}
                                fill
                                style={{ objectFit: "cover" }}
                              />
                            </Box>
                          ))}
                      </Group>
                    </Box>
                  )}

                {/* Detection Statistics */}
                {selectedAlert.stats && (
                  <Paper p="xl" withBorder radius="md" mb="xl" bg={grayLightBg}>
                    <Text fw={700} size="xl" mb="lg">
                      Detection Statistics
                    </Text>
                    <SimpleGrid cols={3} spacing="lg">
                      <Box ta="center">
                        <Text size="sm" c="dimmed" mb="xs">
                          Total Sightings
                        </Text>
                        <Title order={2}>
                          {selectedAlert.stats.totalDetections || 0}
                        </Title>
                      </Box>
                      <Box ta="center">
                        <Text size="sm" c="dimmed" mb="xs">
                          Active Duration
                        </Text>
                        <Title order={2}>
                          {selectedAlert.duration || "N/A"}
                        </Title>
                      </Box>
                      <Box ta="center">
                        <Text size="sm" c="dimmed" mb="xs">
                          CCTV Confidence
                        </Text>
                        <Title order={2}>
                          {selectedAlert.cctvInfo?.confidence || "N/A"}
                        </Title>
                      </Box>
                    </SimpleGrid>
                  </Paper>
                )}
              </Box>
            </Box>

            {/* Fixed Bottom Buttons */}
            <Box
              p="xl"
              style={{
                borderTop: `2px solid ${borderColor}`,
                background: paperBg,
                flexShrink: 0,
              }}
            >
              <Group justify="space-between">
                <Button
                  size="lg"
                  variant="light"
                  color="gray"
                  leftSection={<IconX size={20} />}
                  onClick={handleCloseDetail}
                  radius="md"
                >
                  Close Details
                </Button>
                <Group>
                  <Button
                    size="lg"
                    variant="outline"
                    color="blue"
                    leftSection={<IconBell size={20} />}
                    onClick={() => {
                      notifications.show({
                        title: "Notifications Sent",
                        message: `Updates will be sent for alert ${selectedAlert.code}`,
                        color: "blue",
                      });
                    }}
                    radius="md"
                  >
                    Notify Me
                  </Button>
                  <Button
                    size="lg"
                    color="blue"
                    leftSection={<IconCheck size={20} />}
                    onClick={() => {
                      notifications.show({
                        title: "Marked as Reviewed",
                        message: `Alert ${selectedAlert.code} has been reviewed`,
                        color: "green",
                      });
                      handleCloseDetail();
                    }}
                    radius="md"
                  >
                    Mark as Reviewed
                  </Button>
                </Group>
              </Group>
            </Box>
          </Box>
        </>
      )}

      <MainFooter />
    </Box>
  );
}
