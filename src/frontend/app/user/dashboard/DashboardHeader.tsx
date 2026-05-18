// components/DashboardHeader.tsx
"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Group,
  TextInput,
  ActionIcon,
  Indicator,
  Menu,
  Avatar,
  UnstyledButton,
  Text,
  Badge,
  Button,
  Stack,
  Tooltip,
} from "@mantine/core";
import {
  IconSearch,
  IconBell,
  IconSun,
  IconMoon,
  IconLogin,
  IconUserPlus,
  IconLogout,
  IconUser,
  IconFileReport,
  IconHistory,
  IconSettings,
  IconMail,
  IconAlertCircle,
  IconMessage,
  IconHome,
} from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useMediaQuery } from "@mantine/hooks";
import { useMantineColorScheme } from "@mantine/core";
import { apiClient } from "../../lib/apiClient";
import { IconInfoCircle } from "@tabler/icons-react";

interface DashboardHeaderProps {
  user?: any;
  notifications?: any[];
  unreadCount?: number;
  colorScheme?: "light" | "dark";
  toggleColorScheme?: () => void;
  getUserInitials?: (firstName: string, lastName: string) => string;
  getUserRoute?: (path: string) => string;
  onLogout?: () => void;
  showGoToDashboard?: boolean;
}

export default function DashboardHeader({
  user: propUser,
  notifications: propNotifications,
  unreadCount: propUnreadCount,
  colorScheme: propColorScheme,
  toggleColorScheme: propToggleColorScheme,
  getUserInitials: propGetUserInitials,
  getUserRoute: propGetUserRoute,
  showGoToDashboard: propShowGoToDashboard,
}: DashboardHeaderProps) {
  const router = useRouter();
  const pathname = usePathname() || "";
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Mantine Color Scheme Hook for autonomous setup
  const { colorScheme: mantineColorScheme, setColorScheme } = useMantineColorScheme();
  
  // State for autonomous user loading if not provided by prop
  const [internalUser, setInternalUser] = useState<any>(null);
  const [internalUnread, setInternalUnread] = useState(0);
  const [searchVal, setSearchVal] = useState("");

  useEffect(() => {
    if (!propUser) {
      try {
        const stored = localStorage.getItem("currentUser");
        if (stored) {
          setInternalUser(JSON.parse(stored));
        }
      } catch (err) {
        console.error("Failed to parse user in navbar", err);
      }
    }
  }, [propUser]);

  // Fetch unread count autonomously if not provided
  useEffect(() => {
    if (propUnreadCount === undefined) {
      const fetchUnread = async () => {
        try {
          const res = await apiClient(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1"}/notifications`);
          if (res.ok) {
            const payload = await res.json();
            const list = Array.isArray(payload?.data)
              ? payload.data
              : Array.isArray(payload)
              ? payload
              : [];
            setInternalUnread(list.filter((n: any) => !n.isRead).length);
          }
        } catch (_) {}
      };
      fetchUnread();
      // Periodically refresh notifications
      const interval = setInterval(fetchUnread, 30000);
      return () => clearInterval(interval);
    }
  }, [propUnreadCount]);

  // Resolve final variables using props or autonomous state fallbacks
  const user = propUser !== undefined ? propUser : internalUser;
  const unreadCount = propUnreadCount !== undefined ? propUnreadCount : internalUnread;
  const colorScheme = propColorScheme || (mantineColorScheme as any) || "light";
  
  const toggleColorScheme = propToggleColorScheme || (() => {
    setColorScheme(colorScheme === "dark" ? "light" : "dark");
  });

  const getUserInitials = propGetUserInitials || ((first: string, last: string) => {
    return `${first?.[0] || ""}${last?.[0] || ""}`.toUpperCase() || "U";
  });

  const getUserRoute = propGetUserRoute || ((path: string) => path);

  const getBg = (light: string, dark: string) =>
    colorScheme === "dark" ? dark : light;

  // Determine current page state for conditional links
  const isHome = pathname === "/" || pathname === "/user/homepage" || pathname === "/user/homepage/";
  const isDashboard = pathname === "/user/dashboard" || pathname === "/user/dashboard/";
  const isAbout = pathname.startsWith("/user/about");
  const isAlerts = pathname.startsWith("/user/alert");
  const isNotifications = pathname.startsWith("/user/notifications");
  const isFeedback = pathname.startsWith("/user/feedback");

  const showGoToDashboard = propShowGoToDashboard !== undefined 
    ? propShowGoToDashboard 
    : (user && !isDashboard);

  // Internal logout handler
  const handleLogout = async () => {
    if (user?.id) {
      try {
        await fetch("http://localhost:3001/logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            userEmail: user.email,
            action: "logout",
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
          }),
        });
      } catch (_) {}
    }

    localStorage.removeItem("currentUser");
    localStorage.removeItem("isAuthenticated");
    router.push("/");
  };

  // ── Smart Page Content Search and Highlight Engine ──
  const triggerPageSearch = (query: string) => {
    // Clear previous highlights
    const highlights = document.querySelectorAll(".lpc-search-highlight");
    highlights.forEach((hl) => {
      const parent = hl.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(hl.textContent || ""), hl);
        parent.normalize();
      }
    });

    if (!query.trim()) return;

    const escaped = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");

    const textNodes: Text[] = [];
    const walk = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          const tag = parent.tagName.toLowerCase();

          // Reject elements belonging to the navbar, scripts, styles, or interactive elements
          if (
            tag === "script" ||
            tag === "style" ||
            tag === "textarea" ||
            tag === "input" ||
            tag === "select" ||
            tag === "button" ||
            parent.closest(".lpc-navbar-ignore") ||
            parent.closest("header") ||
            parent.closest("nav")
          ) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        },
      }
    );

    let node;
    while ((node = walk.nextNode())) {
      if (node.nodeValue && regex.test(node.nodeValue)) {
        textNodes.push(node as Text);
      }
    }

    if (textNodes.length === 0) return;

    textNodes.forEach((textNode) => {
      const parent = textNode.parentElement;
      if (!parent) return;
      const textVal = textNode.nodeValue || "";
      const frag = document.createDocumentFragment();
      let lastIndex = 0;

      regex.lastIndex = 0;
      let match;
      while ((match = regex.exec(textVal)) !== null) {
        const matchText = match[0];
        const matchIndex = match.index;

        if (matchIndex > lastIndex) {
          frag.appendChild(document.createTextNode(textVal.substring(lastIndex, matchIndex)));
        }

        const mark = document.createElement("mark");
        mark.className = "lpc-search-highlight";
        mark.textContent = matchText;
        frag.appendChild(mark);

        lastIndex = regex.lastIndex;
      }

      if (lastIndex < textVal.length) {
        frag.appendChild(document.createTextNode(textVal.substring(lastIndex)));
      }

      parent.replaceChild(frag, textNode);
    });

    // Scroll to the first match smoothly
    setTimeout(() => {
      const first = document.querySelector(".lpc-search-highlight");
      if (first) {
        first.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      triggerPageSearch(searchVal);
    }
  };

  const vars = colorScheme === "dark" 
    ? {
        "--btn-bg": "rgba(255, 255, 255, 0.04)",
        "--btn-border": "rgba(255, 255, 255, 0.08)",
        "--btn-color": "#cbd5e1",
        "--btn-bg-hover": "rgba(47, 128, 237, 0.15)",
      }
    : {
        "--btn-bg": "rgba(0, 0, 0, 0.03)",
        "--btn-border": "rgba(0, 0, 0, 0.05)",
        "--btn-color": "#475569",
        "--btn-bg-hover": "rgba(47, 128, 237, 0.08)",
      };

  return (
    <Box
      className="lpc-navbar-ignore"
      py={{ base: "xs", md: "sm" }}
      style={{
        borderBottom: `1px solid ${getBg("rgba(0,0,0,0.05)", "rgba(255,255,255,0.05)")}`,
        position: "sticky",
        top: 0,
        zIndex: 1000,
        backdropFilter: "blur(20px)",
        background: getBg("rgba(255,255,255,0.8)", "rgba(15, 23, 42, 0.8)"),
        transition: "all 0.3s ease",
        ...vars,
      } as any}
    >
      {/* Dynamic search highlight and circular hover styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        .lpc-search-highlight {
          background-color: #ffeb3b !important;
          color: #000000 !important;
          padding: 1px 4px !important;
          border-radius: 4px !important;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2) !important;
          font-weight: 800 !important;
        }
        .lpc-nav-btn {
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
          width: 42px !important;
          height: 42px !important;
          border-radius: 50% !important;
          background-color: var(--btn-bg) !important;
          border: 1.5px solid var(--btn-border) !important;
          color: var(--btn-color) !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02) !important;
          cursor: pointer !important;
        }
        .lpc-nav-btn:hover {
          transform: scale(1.15) translateY(-3px) !important;
          background-color: var(--btn-bg-hover) !important;
          border-color: #2f80ed !important;
          color: #2f80ed !important;
          box-shadow: 0 6px 20px rgba(47, 128, 237, 0.25) !important;
        }
        .lpc-nav-btn-active {
          background-color: rgba(47, 128, 237, 0.12) !important;
          border-color: #2f80ed !important;
          color: #2f80ed !important;
        }
      ` }} />

      <Container size="xl">
        <Group justify="space-between" wrap="nowrap">
          
          {/* Logo link */}
          <Link href={user ? "/user/homepage" : "/"} style={{ flexShrink: 0 }}>
            <Image
              src="/logo.jpg"
              alt="Logo"
              width={120}
              height={40}
              style={{ height: "40px", width: "auto", borderRadius: "6px" }}
            />
          </Link>

          {/* Search bar with Enter search matching */}
          <TextInput
            placeholder="Search matching words on page (Press Enter)..."
            leftSection={<IconSearch size={18} stroke={1.5} />}
            style={{ flex: 1, maxWidth: isMobile ? "180px" : "320px" }}
            radius="xl"
            size="md"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            onKeyDown={handleKeyDown}
            styles={{
              input: {
                backgroundColor: getBg("rgba(0,0,0,0.03)", "rgba(255,255,255,0.03)"),
                border: `1px solid ${getBg("rgba(0,0,0,0.05)", "rgba(255,255,255,0.1)")}`,
                transition: "all 0.2s ease",
                "&:focus": {
                  backgroundColor: getBg("white", "rgba(255,255,255,0.08)"),
                  borderColor: "#2f80ed",
                  boxShadow: "0 0 0 4px rgba(47, 128, 237, 0.1)",
                },
              },
            }}
          />

          {/* Consolidated Navigation Actions & Icons */}
          <Group gap={isMobile ? "xs" : "sm"} wrap="nowrap">
            
            {/* 1. Go to Dashboard (Premium Styled Gradient Button) - ONLY on Home page for logged-in users */}
            {isHome && user && (
              <Button
                component={Link}
                href={user?.role === "admin" ? "/admin" : "/user/dashboard"}
                variant="gradient"
                gradient={{ from: "#2f80ed", to: "#00d2ff", deg: 45 }}
                size="sm"
                radius="xl"
                fw={800}
                style={{
                  boxShadow: "0 4px 15px rgba(47, 128, 237, 0.25)",
                  border: "none",
                  height: "36px",
                  transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                styles={{
                  root: {
                    "&:hover": {
                      transform: "translateY(-1.5px)",
                      boxShadow: "0 6px 20px rgba(47, 128, 237, 0.35)",
                    }
                  }
                }}
              >
                Go to Dashboard
              </Button>
            )}

            {/* 2. Home Icon - ONLY shown when NOT on home page */}
            {!isHome && (
              <Tooltip label="Home" withArrow position="bottom" zIndex={5000} offset={12}>
                <ActionIcon
                  className="lpc-nav-btn"
                  component={Link}
                  href={user ? "/user/homepage" : "/"}
                >
                  <IconHome size={22} />
                </ActionIcon>
              </Tooltip>
            )}

            {/* 3. Dashboard Icon - ONLY shown when logged in AND NOT on dashboard AND NOT on home page */}
            {user && !isDashboard && !isHome && (
              <Tooltip label="Dashboard" withArrow position="bottom" zIndex={5000} offset={12}>
                <ActionIcon
                  className="lpc-nav-btn"
                  component={Link}
                  href={user?.role === "admin" ? "/admin" : "/user/dashboard"}
                >
                  <IconFileReport size={22} />
                </ActionIcon>
              </Tooltip>
            )}

            {/* About Page */}
{!isAbout && (
  <Tooltip
    label="About Platform"
    withArrow
    position="bottom"
    zIndex={5000}
    offset={12}
  >
    <ActionIcon
      className={`lpc-nav-btn ${isAbout ? "lpc-nav-btn-active" : ""}`}
      component={Link}
      href="/user/about"
    >
      <IconInfoCircle size={22} />
    </ActionIcon>
  </Tooltip>
)}
           

            {/* 5. CCTV & Sightings Alerts (Bell Icon) - Always accessible for logged-in users */}
            {user && !isAlerts &&  (
              <Tooltip label="CCTV & Sightings Alerts" withArrow position="bottom" zIndex={5000} offset={12}>
                <Indicator
                  inline
                  label={unreadCount}
                  size={16}
                  color="red"
                  disabled={unreadCount === 0}
                  styles={{ indicator: { fontWeight: 700, zIndex: 10 } }}
                >
                  <ActionIcon
                    className={`lpc-nav-btn ${isAlerts ? "lpc-nav-btn-active" : ""}`}
                    component={Link}
                    href="/user/alert"
                  >
                    <IconBell size={22} />
                  </ActionIcon>
                </Indicator>
              </Tooltip>
            )}

            {/* 6. Notifications Hub / Inbox (Mail Icon) - Always accessible for logged-in users */}
            {user && !isNotifications && (
              <Tooltip label="Inbox / Notifications" withArrow position="bottom" zIndex={5000} offset={12}>
                <Indicator
                  inline
                  label={unreadCount}
                  size={16}
                  color="red"
                  disabled={unreadCount === 0}
                  styles={{ indicator: { fontWeight: 700, zIndex: 10 } }}
                >
                  <ActionIcon
                    className={`lpc-nav-btn ${isNotifications ? "lpc-nav-btn-active" : ""}`}
                    component={Link}
                    href="/user/notifications"
                  >
                    <IconMail size={22} />
                  </ActionIcon>
                </Indicator>
              </Tooltip>
            )}

            {/* 7. Theme Toggle Icon */}
            <Tooltip label={colorScheme === "dark" ? "Light Mode" : "Dark Mode"} withArrow position="bottom" zIndex={5000} offset={12}>
              <ActionIcon
                className="lpc-nav-btn"
                onClick={toggleColorScheme}
              >
                {colorScheme === "dark" ? (
                  <IconSun size={22} />
                ) : (
                  <IconMoon size={22} />
                )}
              </ActionIcon>
            </Tooltip>

            {/* User Profile Dropdown Menu / Guest Sign In/Up */}
            {user ? (
              <Menu
                shadow="md"
                width={320}
                radius="md"
                transitionProps={{ transition: "pop-top-right" }}
              >
                <Menu.Target>
                  <UnstyledButton>
                    <Group gap="sm" wrap="nowrap">
                      {!isMobile && (
                        <Box ta="right">
                          <Text fw={800} size="sm" truncate>
                            {user.firstName} {user.lastName}
                          </Text>
                          <Text
                            size="xs"
                            c="dimmed"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <IconMail size={10} /> {user.email}
                          </Text>
                        </Box>
                      )}
                      <Avatar
                        src={null}
                        color="blue"
                        size={isMobile ? "sm" : "md"}
                        radius="xl"
                        style={{ border: "2px solid #2f80ed", fontWeight: 800 }}
                      >
                        {getUserInitials(user.firstName, user.lastName)}
                      </Avatar>
                    </Group>
                  </UnstyledButton>
                </Menu.Target>
                <Menu.Dropdown bg={getBg("white", "#1A1B1E")}>
                  <Box
                    mb="md"
                    pb="md"
                    style={{
                      borderBottom: `1px solid ${getBg("#e9ecef", "#2C2E33")}`,
                    }}
                  >
                    <Group mb="xs" wrap="nowrap">
                      <Avatar
                        src={null}
                        color="blue"
                        size="lg"
                        radius="xl"
                        style={{ border: "3px solid #2f80ed", fontWeight: 800 }}
                      >
                        {getUserInitials(user.firstName, user.lastName)}
                      </Avatar>
                      <Box style={{ flex: 1, minWidth: 0 }}>
                        <Text size="md" fw={700} truncate>
                          {user.firstName} {user.lastName}
                        </Text>
                        <Text size="sm" c="dimmed" truncate>
                          {user.email}
                        </Text>
                        <Badge
                          size="xs"
                          color={user.role === "admin" ? "red" : "blue"}
                          variant="light"
                          mt={4}
                        >
                          {user.role}
                        </Badge>
                      </Box>
                    </Group>
                    <Button
                      fullWidth
                      variant="light"
                      component={Link}
                      href="/user/profile"
                      leftSection={<IconUser size={16} />}
                      size="sm"
                    >
                      View Profile
                    </Button>
                  </Box>
                  <Stack gap={4}>
                    <Menu.Item
                      leftSection={<IconUser size={18} />}
                      component={Link}
                      href="/user/profile"
                    >
                      My Profile
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<IconFileReport size={18} />}
                      component={Link}
                      href="/user/reported-cases"
                    >
                      Reported Cases
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<IconBell size={18} />}
                      component={Link}
                      href="/user/notifications"
                    >
                      Notifications
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<IconAlertCircle size={18} />}
                      component={Link}
                      href="/user/alert"
                    >
                      My Alerts
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<IconHistory size={18} />}
                      component={Link}
                      href="/user/history"
                    >
                      Search History
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<IconSettings size={18} />}
                      component={Link}
                      href="/user/settings"
                    >
                      Account Settings
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<IconMessage size={18} />}
                      component={Link}
                      href="/user/feedback"
                    >
                      Give Feedback
                    </Menu.Item>
                  </Stack>
                  <Menu.Divider />
                  <Menu.Item
                    color="red"
                    leftSection={<IconLogout size={18} />}
                    onClick={handleLogout}
                  >
                    Logout
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            ) : (
              <Group gap={isMobile ? "xs" : "sm"} wrap="nowrap">
                <Button
                  variant="outline"
                  color="blue"
                  leftSection={<IconLogin size={16} />}
                  component={Link}
                  href="/authentication/login"
                  radius="xl"
                  size={isMobile ? "xs" : "sm"}
                >
                  {isMobile ? "Login" : "Sign In"}
                </Button>
                <Button
                  color="blue"
                  leftSection={<IconUserPlus size={16} />}
                  component={Link}
                  href="/authentication/signup"
                  radius="xl"
                  size={isMobile ? "xs" : "sm"}
                >
                  {isMobile ? "Join" : "Sign Up"}
                </Button>
              </Group>
            )}
          </Group>
        </Group>
      </Container>
    </Box>
  );
}