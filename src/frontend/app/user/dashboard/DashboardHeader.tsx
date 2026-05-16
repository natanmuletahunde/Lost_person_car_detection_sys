// components/DashboardHeader.tsx
"use client";
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
  ScrollArea,
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
} from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMediaQuery } from "@mantine/hooks";

interface DashboardHeaderProps {
  user: any;
  notifications: any[];
  unreadCount: number;
  colorScheme: "light" | "dark";
  toggleColorScheme: () => void;
  getUserInitials: (firstName: string, lastName: string) => string;
  getUserRoute: (path: string) => string;
  // onLogout is now optional – we handle logout internally
  onLogout?: () => void;
}

export default function DashboardHeader({
  user,
  notifications,
  unreadCount,
  colorScheme,
  toggleColorScheme,
  getUserInitials,
  getUserRoute,
}: DashboardHeaderProps) {
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const getBg = (light: string, dark: string) =>
    colorScheme === "dark" ? dark : light;

  // Internal logout handler
  const handleLogout = async () => {
    if (user?.id) {
      try {
        // Optional: Log the logout event
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
      } catch (error) {
        console.error("Failed to log logout", error);
      }
    }

    // Clear authentication data
    localStorage.removeItem("currentUser");
    localStorage.removeItem("isAuthenticated");

    // Redirect to the login page
    router.push("/authentication/login");
  };

  return (
    <Box
      bg={getBg("white", "#1A1B1E")}
      py={{ base: "xs", md: "sm" }}
      style={{
        borderBottom: `1px solid ${getBg("#e9ecef", "#2C2E33")}`,
        position: "sticky",
        top: 0,
        zIndex: 100,
        backdropFilter: "blur(10px)",
        background: getBg("rgba(255,255,255,0.95)", "rgba(26,27,30,0.95)"),
      }}
    >
      <Container size="xl">
        <Group justify="space-between" wrap="nowrap">
          <Link href="/user/dashboard" style={{ flexShrink: 0 }}>
            <Image
              src="/logo.jpg"
              alt="Logo"
              width={120}
              height={40}
              style={{ height: "40px", width: "auto" }}
            />
          </Link>

          <TextInput
            placeholder="Search lost items, cars, or people..."
            leftSection={<IconSearch size={16} />}
            style={{ flex: 1, maxWidth: isMobile ? "200px" : "400px" }}
            radius="xl"
            variant="filled"
          />

          <Group gap={isMobile ? "xs" : "md"} wrap="nowrap">
            {/* Notification Bell */}
            <Menu shadow="md" width={320} position="bottom-end">
              <Menu.Target>
                <Indicator
                  inline
                  label={unreadCount}
                  size={16}
                  color="red"
                  disabled={unreadCount === 0}
                >
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    size={isMobile ? "md" : "lg"}
                  >
                    <IconBell size={isMobile ? 20 : 24} />
                  </ActionIcon>
                </Indicator>
              </Menu.Target>
              <Menu.Dropdown>
                <Box
                  p="xs"
                  fw={700}
                  style={{
                    borderBottom: `1px solid ${getBg("#e9ecef", "#2C2E33")}`,
                  }}
                >
                  Notifications
                </Box>
                <ScrollArea h={250}>
                  {notifications.length === 0 ? (
                    <Text ta="center" c="dimmed" py="md">
                      No notifications
                    </Text>
                  ) : (
                    notifications.map((n) => (
                      <Menu.Item key={n._id || n.id}>
                        <Group gap="sm" wrap="nowrap">
                          <Box>
                            <Text size="sm" fw={n.isRead ? 400 : 700}>
                              {n.message}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {new Date(n.createdAt).toLocaleString()}
                            </Text>
                          </Box>
                          {!n.isRead && (
                            <Badge size="xs" color="red" variant="filled">
                              new
                            </Badge>
                          )}
                        </Group>
                      </Menu.Item>
                    ))
                  )}
                </ScrollArea>
                <Menu.Divider />
                <Menu.Item component={Link} href={getUserRoute("/user/alert")}>
                  View all
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>

            {/* Theme Toggle */}
            <ActionIcon
              variant="subtle"
              color="gray"
              size={isMobile ? "md" : "lg"}
              onClick={toggleColorScheme}
            >
              {colorScheme === "dark" ? (
                <IconSun size={isMobile ? 20 : 24} />
              ) : (
                <IconMoon size={isMobile ? 20 : 24} />
              )}
            </ActionIcon>

            {/* User Menu / Auth Buttons */}
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
                        style={{ border: "2px solid #2f80ed" }}
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
                    <Group mb="xs">
                      <Avatar
                        src={null}
                        color="blue"
                        size="lg"
                        radius="xl"
                        style={{ border: "3px solid #2f80ed" }}
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
                      href={getUserRoute("/user/profile")}
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
                      href={getUserRoute("/user/profile")}
                    >
                      My Profile
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<IconFileReport size={18} />}
                      component={Link}
                      href={getUserRoute("/user/reported-cases")}
                    >
                      Reported Cases
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<IconBell size={18} />}
                      onClick={() => router.push(getUserRoute("/user/alert"))}
                    >
                      My Notifications
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<IconHistory size={18} />}
                      component={Link}
                      href={getUserRoute("/user/history")}
                    >
                      Search History
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<IconSettings size={18} />}
                      component={Link}
                      href={getUserRoute("/user/settings")}
                    >
                      Account Settings
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