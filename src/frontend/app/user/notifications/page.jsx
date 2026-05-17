"use client";
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
  ActionIcon,
  Menu,
  UnstyledButton,
  TextInput,
  Loader,
  Tabs,
  Divider,
  useMantineTheme,
  useMantineColorScheme,
  ThemeIcon,
  Tooltip,
  SimpleGrid,
  RingProgress,
  Grid,
  ScrollArea,
} from "@mantine/core";
import {
  IconBell,
  IconAlertCircle,
  IconCheck,
  IconCheckbox,
  IconSearch,
  IconHome,
  IconLogout,
  IconUser,
  IconMail,
  IconBellOff,
  IconAlertTriangle,
  IconInfoCircle,
  IconCircleCheck,
  IconSparkles,
  IconCalendar,
  IconInbox,
  IconTrendingUp,
  IconArrowLeft,
  IconArrowRight,
  IconChevronRight,
  IconMapPin,
  IconTrash,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { apiClient } from "../../lib/apiClient";
import { notifications as toast } from "@mantine/notifications";
import MainFooter from "../../components/MainFooter";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";
const NOTIFICATIONS_API = `${API_BASE_URL}/notifications/my-notifications`;

const getBg = (colorScheme, light, dark) =>
  colorScheme === "dark" ? dark : light;

// Premium type configs with beautiful modern soft colors & gradients
const typeConfig = {
  alert: { 
    icon: IconAlertTriangle, 
    color: "red", 
    label: "Alert", 
    bgColor: "rgba(250, 82, 82, 0.12)",
    accentColor: "#FA5252",
    gradient: "linear-gradient(135deg, #FF6B6B 0%, #FA5252 100%)",
    sender: "AI Camera Detection System"
  },
  info: { 
    icon: IconInfoCircle, 
    color: "blue", 
    label: "Info", 
    bgColor: "rgba(34, 139, 230, 0.12)",
    accentColor: "#228BE6",
    gradient: "linear-gradient(135deg, #4DABF7 0%, #228BE6 100%)",
    sender: "System Administrator"
  },
  success: { 
    icon: IconCircleCheck, 
    color: "green", 
    label: "Success", 
    bgColor: "rgba(64, 192, 87, 0.12)",
    accentColor: "#40C057",
    gradient: "linear-gradient(135deg, #69DB7C 0%, #40C057 100%)",
    sender: "Verification Center"
  },
  warning: { 
    icon: IconAlertCircle, 
    color: "orange", 
    label: "Warning", 
    bgColor: "rgba(253, 126, 20, 0.12)",
    accentColor: "#FD7E14",
    gradient: "linear-gradient(135deg, #FFA94D 0%, #FD7E14 100%)",
    sender: "Security Desk"
  },
  general: { 
    icon: IconBell, 
    color: "gray", 
    label: "General", 
    bgColor: "rgba(134, 142, 150, 0.12)",
    accentColor: "#868E96",
    gradient: "linear-gradient(135deg, #ADB5BD 0%, #868E96 100%)",
    sender: "Support Team"
  },
  feedback: { 
    icon: IconMail, 
    color: "purple", 
    label: "Feedback", 
    bgColor: "rgba(190, 75, 219, 0.12)",
    accentColor: "#BE4BDB",
    gradient: "linear-gradient(135deg, #E599F7 0%, #BE4BDB 100%)",
    sender: "Administrator Review"
  },
};

function getTypeConfig(type) {
  return typeConfig[type] || typeConfig.general;
}

// Utility to calculate human-readable relative time
function formatRelativeTime(dateString) {
  if (!dateString) return "Just now";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function NotificationsPage() {
  const router = useRouter();
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();

  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [username, setUsername] = useState("User");
  const [markingAll, setMarkingAll] = useState(false);
  const [selectedNotifId, setSelectedNotifId] = useState(null);
  
  // Track viewport height responsiveness
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 992);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const mainBg = getBg(colorScheme, "#F4F7FE", "#101113");
  const headerBg = getBg(colorScheme, "rgba(255, 255, 255, 0.85)", "rgba(26, 27, 30, 0.85)");
  const borderColor = getBg(colorScheme, "#E9ECEF", theme.colors.dark[5]);
  const cardBg = getBg(colorScheme, "white", theme.colors.dark[6]);
  const isDark = colorScheme === "dark";

  // Load username
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

  // Auth guard
  useEffect(() => {
    const isAuth = localStorage.getItem("isAuthenticated");
    if (!isAuth || isAuth !== "true") {
      router.push("/authentication/login");
    }
  }, [router]);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        setLoading(true);
        const res = await apiClient(NOTIFICATIONS_API);
        if (!res.ok) throw new Error("Failed to fetch");
        const payload = await res.json();
        const data = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
          ? payload
          : [];
        setNotifs(data);
        
        // Auto-select first notification on desktop if available
        if (data.length > 0 && window.innerWidth >= 992) {
          setSelectedNotifId(data[0]._id);
        }
      } catch (err) {
        toast.show({
          title: "Error",
          message: "Could not load notifications",
          color: "red",
          icon: <IconAlertCircle size={16} />,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchNotifs();
  }, []);

  // Filter by tab and search
  const filtered = notifs.filter((n) => {
    const matchesTab =
      activeTab === "all"
        ? true
        : activeTab === "unread"
        ? !n.isRead
        : activeTab === "system"
        ? ["system", "general", "info", "warning"].includes(n.type)
        : n.type === activeTab;
    const matchesSearch =
      !searchQuery ||
      (n.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.message || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Mark single as read
  const handleMarkRead = async (id) => {
    try {
      const target = notifs.find(n => n._id === id);
      if (!target || target.isRead) return;

      await apiClient(`${API_BASE_URL}/notifications/${id}/read`, {
        method: "PATCH",
      });
      setNotifs((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (_) {}
  };

  // Select a notification
  const handleSelectNotif = (id) => {
    setSelectedNotifId(id);
    handleMarkRead(id);
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    const unread = notifs.filter((n) => !n.isRead);
    await Promise.allSettled(
      unread.map((n) =>
        apiClient(`${API_BASE_URL}/notifications/${n._id}/read`, {
          method: "PATCH",
        })
      )
    );
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setMarkingAll(false);
    toast.show({
      title: "Inbox Cleared",
      message: "All notifications marked as read",
      color: "green",
      icon: <IconSparkles size={16} />,
    });
  };

  // Delete single notification
  const handleDeleteNotif = async (id) => {
    try {
      await apiClient(`${API_BASE_URL}/notifications/${id}`, {
        method: "DELETE",
      });
      setNotifs((prev) => prev.filter((n) => n._id !== id));
      if (selectedNotifId === id) {
        setSelectedNotifId(null);
      }
      toast.show({
        title: "Deleted",
        message: "Notification removed from inbox",
        color: "blue",
      });
    } catch (_) {
      toast.show({
        title: "Error",
        message: "Failed to delete notification",
        color: "red",
      });
    }
  };

  // Clear all notifications
  const handleClearAll = async () => {
    setMarkingAll(true);
    try {
      await apiClient(`${API_BASE_URL}/notifications`, {
        method: "DELETE",
      });
      setNotifs([]);
      setSelectedNotifId(null);
      toast.show({
        title: "Inbox Cleared",
        message: "All notifications have been permanently removed",
        color: "blue",
        icon: <IconSparkles size={16} />,
      });
    } catch (_) {
      toast.show({
        title: "Error",
        message: "Failed to clear notifications",
        color: "red",
      });
    } finally {
      setMarkingAll(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("isAuthenticated");
    router.push("/authentication/login");
  };

  const unreadCount = notifs.filter((n) => !n.isRead).length;
  const selectedNotif = notifs.find(n => n._id === selectedNotifId);

  return (
    <Box bg={mainBg} style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Premium Keyframes and Email Style Classes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pulseDot {
          0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(34, 139, 230, 0.5); }
          70% { transform: scale(1.1); box-shadow: 0 0 0 6px rgba(34, 139, 230, 0); }
          100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(34, 139, 230, 0); }
        }
        .animate-slide-in {
          animation: slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-fade-in {
          animation: fadeIn 0.25s ease-out forwards;
        }
        .pulse-dot {
          animation: pulseDot 2s infinite;
        }
        .hover-card {
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .hover-card:hover {
          background-color: ${isDark ? "#2A2B2F" : "#F1F3F9"} !important;
        }
        .selected-card {
          background-color: ${isDark ? "#2B367433" : "#F0F4FF"} !important;
          border-left: 4px solid #228BE6 !important;
        }
        .email-sidebar {
          border-right: 1px solid ${borderColor};
          display: flex;
          flex-direction: column;
          height: calc(100vh - 80px);
        }
        .email-reader {
          height: calc(100vh - 80px);
          display: flex;
          flex-direction: column;
        }
        .premium-tab {
          transition: all 0.2s ease;
          border-radius: 9999px !important;
          padding: 6px 12px !important;
          font-weight: 600;
          font-size: 13px;
        }
        .premium-tab[data-active] {
          background-color: #228BE6 !important;
          color: white !important;
        }
      ` }} />

      {/* ── Header ── */}
      <Box
        bg={headerBg}
        py="xs"
        style={{
          borderBottom: `1px solid ${borderColor}`,
          zIndex: 100,
          backdropFilter: "blur(14px)",
          boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 20px rgba(0,0,0,0.03)",
        }}
      >
        <Container size="xl" fluid>
          <Group justify="space-between">
            <Group gap="md">
              <Link href="/user/dashboard">
                <Image
                  src="/logo.jpg"
                  alt="Logo"
                  width={0}
                  height={45}
                  sizes="100vw"
                  style={{ width: "auto", height: "45px", borderRadius: "8px" }}
                />
              </Link>
              <Divider orientation="vertical" h={25} />
              <Group gap="xs">
                <IconMail size={20} color={theme.colors.blue[6]} />
                <Title order={4} fw={800} style={{ letterSpacing: -0.3 }}>Inbox Hub</Title>
                {unreadCount > 0 && (
                  <Badge size="xs" color="red" variant="filled" className="pulse-dot">
                    {unreadCount} Unread
                  </Badge>
                )}
              </Group>
            </Group>

            <Group gap="lg">
              <ActionIcon
                variant="subtle"
                color="gray"
                size="lg"
                component={Link}
                href="/user/dashboard"
                title="Dashboard"
              >
                <IconHome size={22} />
              </ActionIcon>

              <Menu shadow="lg" width={220} radius="md" transitionProps={{ transition: 'pop' }}>
                <Menu.Target>
                  <UnstyledButton style={{ padding: '4px 8px', borderRadius: '8px' }}>
                    <Group gap="xs">
                      <Avatar src={null} alt="User" color="blue" size="sm" radius="xl" fw={700} bg="linear-gradient(135deg, #4DABF7 0%, #228BE6 100%)">
                        {username[0]?.toUpperCase()}
                      </Avatar>
                      <Text fw={700} size="sm" visibleFrom="xs">{username}</Text>
                    </Group>
                  </UnstyledButton>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item leftSection={<IconUser size={16} />} component={Link} href="/user/profile">
                    My Profile
                  </Menu.Item>
                  <Menu.Item leftSection={<IconBell size={16} />} component={Link} href="/user/alert">
                    CCTV & Sightings Alerts
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Item color="red" leftSection={<IconLogout size={16} />} onClick={handleLogout}>
                    Logout
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
          </Group>
        </Container>
      </Box>

      {/* ── Main Layout (Email Split View) ── */}
      <Container size="xl" fluid p={0} style={{ flex: 1, display: "flex" }}>
        
        {/* If Mobile and an email is selected, we show only the Reader, else show split view */}
        <Grid gutter={0} style={{ width: "100%", flex: 1 }}>
          
          {/* ────── LEFT COLUMN: INBOX LIST ────── */}
          {(!isMobile || !selectedNotifId) && (
            <Grid.Col span={{ base: 12, lg: 4 }} style={{ background: isDark ? "#141517" : "#F8F9FD" }} className="email-sidebar">
              
              {/* Sidebar Search and Clear All actions */}
              <Box p="md" style={{ borderBottom: `1px solid ${borderColor}` }}>
                <Stack gap="xs">
                  <TextInput
                    placeholder="Search messages..."
                    leftSection={<IconSearch size={16} color={theme.colors.blue[6]} />}
                    radius="md"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    styles={{
                      input: {
                        backgroundColor: isDark ? "#1E1F22" : "white",
                        borderWidth: 1,
                      }
                    }}
                  />
                  <Group justify="space-between" align="center">
                    <Text size="xs" c="dimmed" fw={700}>
                      {filtered.length} {filtered.length === 1 ? "Message" : "Messages"}
                    </Text>
                    <Group gap="xs">
                      {unreadCount > 0 && (
                        <Button
                          size="xs"
                          variant="subtle"
                          color="blue"
                          leftSection={<IconCheckbox size={14} />}
                          onClick={handleMarkAllRead}
                          styles={{ root: { padding: "0 8px" } }}
                        >
                          Mark all as read
                        </Button>
                      )}
                      {notifs.length > 0 && (
                        <Button
                          size="xs"
                          variant="subtle"
                          color="red"
                          leftSection={<IconTrash size={14} />}
                          onClick={handleClearAll}
                          styles={{ root: { padding: "0 8px" } }}
                        >
                          Clear All
                        </Button>
                      )}
                    </Group>
                  </Group>
                </Stack>
              </Box>

              {/* Segmented Mail Filters */}
              <Box px="md" py="xs" style={{ borderBottom: `1px solid ${borderColor}`, background: isDark ? "#1a1b1e" : "#F1F3F7" }}>
                <Tabs value={activeTab} onChange={(val) => { setActiveTab(val); }} variant="unstyled">
                  <Tabs.List style={{ display: 'flex', gap: '4px', overflowX: 'auto', flexWrap: 'nowrap' }}>
                    <Tabs.Tab value="all" className="premium-tab">All</Tabs.Tab>
                    <Tabs.Tab value="unread" className="premium-tab">Unread</Tabs.Tab>
                    <Tabs.Tab value="alert" className="premium-tab">Alerts</Tabs.Tab>
                    <Tabs.Tab value="feedback" className="premium-tab">Feedback</Tabs.Tab>
                    <Tabs.Tab value="system" className="premium-tab">System</Tabs.Tab>
                  </Tabs.List>
                </Tabs>
              </Box>

              {/* Scrollable list of email items */}
              <ScrollArea style={{ flex: 1 }} p={0}>
                {loading ? (
                  <Box py={50} ta="center">
                    <Loader size="md" color="blue" variant="dots" />
                    <Text size="xs" c="dimmed" mt="xs">Updating Inbox Feed...</Text>
                  </Box>
                ) : filtered.length === 0 ? (
                  <Box py={80} ta="center" px="xl">
                    <ThemeIcon size={55} radius="xl" color="gray" variant="light" mx="auto" mb="sm">
                      <IconInbox size={26} />
                    </ThemeIcon>
                    <Text fw={700} size="sm">No Messages Found</Text>
                    <Text size="xs" c="dimmed" mt={4}>
                      Your search or tab filters contain no incoming logs.
                    </Text>
                  </Box>
                ) : (
                  filtered.map((n) => {
                    const cfg = getTypeConfig(n.type);
                    const isSelected = n._id === selectedNotifId;
                    const isUnread = !n.isRead;
                    const MailIcon = cfg.icon;

                    return (
                      <Box
                        key={n._id}
                        p="md"
                        style={{
                          borderBottom: `1px solid ${borderColor}`,
                          cursor: "pointer",
                          borderLeft: `4px solid ${isUnread ? cfg.accentColor : "transparent"}`,
                          position: "relative",
                        }}
                        className={`hover-card ${isSelected ? 'selected-card' : ''}`}
                        onClick={() => handleSelectNotif(n._id)}
                      >
                        <Group justify="space-between" wrap="nowrap" align="flex-start" mb={4}>
                          <Group gap="xs" wrap="nowrap">
                            <ThemeIcon size="xs" radius="xl" color={cfg.color} variant="light" style={{ flexShrink: 0 }}>
                              <MailIcon size={10} />
                            </ThemeIcon>
                            <Text size="xs" fw={700} c={isUnread ? cfg.color : "dimmed"}>
                              {cfg.sender}
                            </Text>
                          </Group>
                          <Text size="10px" c="dimmed" fw={600}>
                            {formatRelativeTime(n.createdAt)}
                          </Text>
                        </Group>

                        <Text size="sm" fw={isUnread ? 800 : 600} c={isDark ? "white" : "dark"} truncate mb={2}>
                          {n.title || "Notification"}
                        </Text>
                        <Text size="xs" c="dimmed" lineClamp={2} style={{ lineHeight: 1.4 }}>
                          {n.message}
                        </Text>

                        {isUnread && (
                          <Box style={{
                            position: "absolute",
                            right: "12px",
                            bottom: "12px",
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: theme.colors.blue[6]
                          }} />
                        )}
                      </Box>
                    );
                  })
                )}
              </ScrollArea>
            </Grid.Col>
          )}

          {/* ────── RIGHT COLUMN: MAIL READER VIEW ────── */}
          {(!isMobile || selectedNotifId) && (
            <Grid.Col span={{ base: 12, lg: 8 }} className="email-reader" style={{ background: cardBg }}>
              {selectedNotif ? (
                <Box style={{ flex: 1, display: "flex", flexDirection: "column" }} className="animate-slide-in">
                  
                  {/* Reader Header Actions */}
                  <Group justify="space-between" p="md" style={{ borderBottom: `1px solid ${borderColor}` }}>
                    <Group gap="sm">
                      {isMobile && (
                        <Button
                          size="xs"
                          variant="subtle"
                          color="gray"
                          leftSection={<IconArrowLeft size={16} />}
                          onClick={() => setSelectedNotifId(null)}
                        >
                          Back to Inbox
                        </Button>
                      )}
                      
                      <Badge color={getTypeConfig(selectedNotif.type).color} variant="light" size="sm" style={{ textTransform: 'uppercase' }}>
                        {getTypeConfig(selectedNotif.type).label} Message
                      </Badge>
                    </Group>

                    <Group gap="xs">
                      {/* Status marker indicator */}
                      <Text size="xs" c="dimmed" fw={700}>
                        Received via In-App Portal
                      </Text>
                      <Divider orientation="vertical" h={16} />
                      <ActionIcon 
                        variant="subtle" 
                        color="red" 
                        title="Delete Notification"
                        onClick={() => handleDeleteNotif(selectedNotif._id)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Group>

                  {/* Scrollable Message Details Box */}
                  <ScrollArea style={{ flex: 1 }} p="xl">
                    <Box style={{ maxWidth: 750, margin: "0 auto" }}>
                      
                      {/* Subject Line */}
                      <Title order={2} fw={900} style={{ letterSpacing: -0.5, lineHeight: 1.2 }} mb={20}>
                        {selectedNotif.title || "Notification Sighting Info"}
                      </Title>

                      {/* Sender Info Block */}
                      <Group gap="sm" mb={25} align="center">
                        <Avatar
                          color={getTypeConfig(selectedNotif.type).color}
                          size="md"
                          radius="xl"
                          fw={700}
                        >
                          {getTypeConfig(selectedNotif.type).sender[0]}
                        </Avatar>
                        <Box>
                          <Group gap="xs" align="center">
                            <Text size="sm" fw={700}>{getTypeConfig(selectedNotif.type).sender}</Text>
                            <Text size="xs" c="dimmed">&lt;surveillance-system@lost-detect.app&gt;</Text>
                          </Group>
                          <Group gap={6} align="center">
                            <Text size="xs" c="dimmed">To: Me ({username})</Text>
                            <Text size="xs" c="dimmed">•</Text>
                            <Group gap={3} align="center">
                              <IconCalendar size={10} color={theme.colors.gray[5]} />
                              <Text size="xs" c="dimmed">
                                {selectedNotif.createdAt ? new Date(selectedNotif.createdAt).toLocaleString(undefined, {
                                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                }) : "Unknown time"}
                              </Text>
                            </Group>
                          </Group>
                        </Box>
                      </Group>

                      <Divider mb={25} />

                      {/* Main Message Body styled like a professional email thread */}
                      <Paper p="lg" radius="md" style={{ background: isDark ? "#1a1b1e" : "#F8F9FD", border: `1px solid ${borderColor}` }} mb={30}>
                        <Text size="md" c={isDark ? "gray.3" : "gray.8"} style={{ lineHeight: 1.8, whiteSpace: "pre-wrap", fontFamily: 'Segoe UI, Roboto, Helvetica, sans-serif' }}>
                          {selectedNotif.message}
                        </Text>
                      </Paper>

                      {/* Smart Contextual Shortcut for Sighting matching alerts */}
                      {selectedNotif.type === 'alert' && (
                        <Paper p="md" radius="md" withBorder style={{ 
                          background: isDark ? "rgba(34, 139, 230, 0.08)" : "rgba(34, 139, 230, 0.03)", 
                          border: `1.5px dashed ${theme.colors.blue[4]}`
                        }} mb={30}>
                          <Group justify="space-between" align="center" gap="md">
                            <Group gap="xs">
                              <ThemeIcon size="md" radius="xl" color="blue">
                                <IconMapPin size={16} />
                              </ThemeIcon>
                              <Box>
                                <Text size="sm" fw={800}>CCTV Camera Sighting Match</Text>
                                <Text size="xs" c="dimmed">Open your missing alert cases to inspect matching logs and geographical markers.</Text>
                              </Box>
                            </Group>
                            <Button
                              rightSection={<IconChevronRight size={14} />}
                              size="xs"
                              variant="light"
                              color="blue"
                              component={Link}
                              href="/user/alert"
                              className="hover-lift"
                            >
                              Check My Alerts
                            </Button>
                          </Group>
                        </Paper>
                      )}

                      {/* Email Signature */}
                      <Box mt={40} style={{ borderTop: `1px solid ${borderColor}`, paddingTop: 20 }}>
                        <Text size="xs" c="dimmed" fw={700}>Best Regards,</Text>
                        <Text size="xs" fw={800} c="blue" mt={2}>Lost Person & Car AI Detection Team</Text>
                        <Text size="10px" c="dimmed">Autonomous Face & Vehicle License plate matching engine. 24/7 CCTV vigilance.</Text>
                      </Box>

                    </Box>
                  </ScrollArea>
                </Box>
              ) : (
                // Email Reader Placeholder state
                <Box style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }} className="animate-fade-in">
                  <Stack align="center" gap="md">
                    <ThemeIcon size={80} radius="xl" color="blue" variant="light" style={{ background: isDark ? '#2C2E33' : '#F1F3F5' }}>
                      <IconInbox size={40} color={theme.colors.blue[6]} />
                    </ThemeIcon>
                    <Title order={4} fw={800}>No Message Selected</Title>
                    <Text size="xs" c="dimmed" style={{ maxWidth: 300, textAlign: "center" }}>
                      Select a notification from the inbox panel on the left to view detailed information and associated match sightings.
                    </Text>
                  </Stack>
                </Box>
              )}
            </Grid.Col>
          )}

        </Grid>
      </Container>
    </Box>
  );
}
