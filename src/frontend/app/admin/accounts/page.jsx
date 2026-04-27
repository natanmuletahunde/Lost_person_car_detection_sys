"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Title,
  Text,
  Group,
  Box,
  Paper,
  SimpleGrid,
  TextInput,
  Table,
  Badge,
  Avatar,
  ActionIcon,
  Button,
  Select,
  Pagination,
  Tooltip,
  UnstyledButton,
  useMantineTheme,
  useMantineColorScheme,
  Loader,
  Menu,
  Progress,
  Collapse,
  Card,
  Stack,
  Grid,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconUsers,
  IconSearch,
  IconDownload,
  IconSettings,
  IconBell,
  IconEye,
  IconFileSpreadsheet,
  IconChevronRight,
  IconFilter,
  IconRefresh,
  IconUserCheck,
  IconCalendar,
  IconCircleCheck,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";

// ✅ Changed base URL to port 3000
const API_BASE_URL = "http://localhost:3000";

// Helper functions
const getBg = (colorScheme, light, dark) => (colorScheme === "dark" ? dark : light);
const getTextColor = (colorScheme, light, dark) => (colorScheme === "dark" ? dark : light);
const formatDateTime = (dateString) => new Date(dateString).toLocaleString();

const getActiveThreshold = (lastLogin) => {
  const lastLoginDate = new Date(lastLogin);
  const now = new Date();
  return Math.floor((now.getTime() - lastLoginDate.getTime()) / (1000 * 3600 * 24));
};

const formatLastActive = (lastLogin) => {
  const diffDays = getActiveThreshold(lastLogin);
  if (diffDays < 1) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};

const getActiveColor = (lastLogin) => {
  const days = getActiveThreshold(lastLogin);
  if (days < 1) return "green";
  if (days < 7) return "yellow";
  return "gray";
};

// Map API user to component shape
const mapApiToComponent = (apiUser) => {
  const name = `${apiUser.firstName} ${apiUser.lastName}`.trim();
  const username = apiUser.email.split("@")[0] || name.replace(/\s/g, "").toLowerCase();
  const joinedDate = new Date(apiUser.createdAt);
  const joined = joinedDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return {
    id: apiUser.id,
    name,
    email: apiUser.email,
    username,
    status: apiUser.hasPaidSubscription ? "Paid" : "Free",
    role: apiUser.role,
    joined,
    joinedDate,
    active: formatLastActive(apiUser.lastLogin),
    lastLogin: apiUser.lastLogin,
    phone: apiUser.phone,
    address: apiUser.address,
    isActive: apiUser.isActive,
    registrations: apiUser.registrations || 0,
  };
};

export default function UserListPage() {
  const router = useRouter();
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();

  // Dynamic colors
  const mainBg = getBg(colorScheme, "#F4F7FE", theme.colors.dark[7]);
  const primaryText = getTextColor(colorScheme, "#2B3674", theme.colors.gray[3]);
  const headerBg = getBg(colorScheme, "white", theme.colors.dark[6]);
  const cardBg = getBg(colorScheme, "white", theme.colors.dark[6]);

  // State
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [activeFilter, setActiveFilter] = useState(null);
  const [activePage, setActivePage] = useState(1);
  const [pageSize, setPageSize] = useState("10");
  const [showFilters, setShowFilters] = useState(false);

  // Fetch users from json-server
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/users`);
      if (!response.ok) throw new Error("Failed to fetch users");
      const apiUsers = await response.json();
      const componentUsers = apiUsers.map(mapApiToComponent);
      setUsers(componentUsers);
    } catch (error) {
      console.error(error);
      notifications.show({ title: "Error", message: "Could not load users", color: "red" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filtering
  const filteredUsers = useMemo(() => {
    let result = [...users];

    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(lower) ||
          u.email.toLowerCase().includes(lower) ||
          u.username.toLowerCase().includes(lower) ||
          u.phone?.toLowerCase().includes(lower)
      );
    }

    if (roleFilter && roleFilter !== "All") {
      result = result.filter((u) => u.role === roleFilter);
    }

    if (statusFilter && statusFilter !== "All") {
      result = result.filter((u) => u.status === statusFilter);
    }

    if (activeFilter === "active") {
      result = result.filter((u) => u.isActive);
    } else if (activeFilter === "inactive") {
      result = result.filter((u) => !u.isActive);
    }

    return result;
  }, [users, search, roleFilter, statusFilter, activeFilter]);

  // Pagination
  const paginatedUsers = useMemo(() => {
    const size = parseInt(pageSize, 10);
    const start = (activePage - 1) * size;
    return filteredUsers.slice(start, start + size);
  }, [filteredUsers, activePage, pageSize]);

  const totalPages = useMemo(
    () => Math.ceil(filteredUsers.length / parseInt(pageSize, 10)),
    [filteredUsers, pageSize]
  );

  useEffect(() => {
    setActivePage(1);
  }, [search, roleFilter, statusFilter, activeFilter, pageSize]);

  // Stats
  const stats = useMemo(() => {
    const total = users.length;
    const activeUsers = users.filter((u) => u.isActive).length;
    const paidUsers = users.filter((u) => u.status === "Paid").length;
    const inactiveUsers = total - activeUsers;
    const now = new Date();
    const newThisMonth = users.filter(
      (u) => u.joinedDate.getMonth() === now.getMonth() && u.joinedDate.getFullYear() === now.getFullYear()
    ).length;
    const activeLast7Days = users.filter((u) => getActiveThreshold(u.lastLogin) < 7).length;
    return { total, activeUsers, inactiveUsers, paidUsers, newThisMonth, activeLast7Days };
  }, [users]);

  // Export CSV
  const exportToCSV = () => {
    const headers = [
      "Name",
      "Email",
      "Username",
      "Phone",
      "Status",
      "Role",
      "Joined Date",
      "Last Login",
      "Registrations",
      "Account Active",
    ];
    const data = filteredUsers.map((u) => [
      u.name,
      u.email,
      u.username,
      u.phone,
      u.status,
      u.role,
      u.joined,
      formatDateTime(u.lastLogin),
      u.registrations,
      u.isActive ? "Active" : "Inactive",
    ]);
    const csv = [headers.join(","), ...data.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notifications.show({ title: "Exported", message: `${filteredUsers.length} users exported`, color: "green" });
  };

  if (loading) {
    return (
      <Box bg={mainBg} style={{ minHeight: "100vh" }} p="xl">
        <Group justify="center" mt={100}>
          <Loader size="xl" />
        </Group>
      </Box>
    );
  }

  return (
    <Box bg={mainBg} style={{ minHeight: "100vh" }} p="xl">
      {/* Header */}
      <Group justify="space-between" mb="xl">
        <Group>
          <Title order={2} fw={700} c={primaryText}>
            User Management
          </Title>
          <Badge size="lg" variant="light" color="blue">
            {stats.total} total
          </Badge>
        </Group>
        <Group bg={headerBg} p={8} style={{ borderRadius: "30px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
          <Tooltip label="Settings">
            <ActionIcon variant="subtle" color="gray" size="lg">
              <IconSettings size={22} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Notifications">
            <ActionIcon variant="subtle" color="gray" size="lg">
              <IconBell size={22} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Refresh">
            <ActionIcon variant="subtle" color="gray" size="lg" onClick={fetchUsers}>
              <IconRefresh size={22} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      {/* Stats Cards */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg" mb="xl">
        <Card withBorder radius="lg" p="md" bg={cardBg}>
          <Group justify="space-between">
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
              Total Users
            </Text>
            <IconUsers size={20} color={theme.colors.blue[6]} />
          </Group>
          <Text size="xl" fw={700} mt="xs">
            {stats.total}
          </Text>
          <Group justify="space-between" mt="xs">
            <Text size="xs" c="dimmed">
              Active: {stats.activeUsers}
            </Text>
            <Text size="xs" c="dimmed">
              Inactive: {stats.inactiveUsers}
            </Text>
          </Group>
          <Progress value={(stats.activeUsers / stats.total) * 100} size="sm" mt="xs" color="green" />
        </Card>

        <Card withBorder radius="lg" p="md" bg={cardBg}>
          <Group justify="space-between">
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
              Paid Users
            </Text>
            <IconCircleCheck size={20} color={theme.colors.green[6]} />
          </Group>
          <Text size="xl" fw={700} mt="xs">
            {stats.paidUsers}
          </Text>
          <Text size="xs" c="dimmed" mt="xs">
            {((stats.paidUsers / stats.total) * 100).toFixed(1)}% of total
          </Text>
        </Card>

        <Card withBorder radius="lg" p="md" bg={cardBg}>
          <Group justify="space-between">
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
              Active (7d)
            </Text>
            <IconUserCheck size={20} color={theme.colors.orange[6]} />
          </Group>
          <Text size="xl" fw={700} mt="xs">
            {stats.activeLast7Days}
          </Text>
          <Text size="xs" c="dimmed" mt="xs">
            Last 7 days activity
          </Text>
        </Card>

        <Card withBorder radius="lg" p="md" bg={cardBg}>
          <Group justify="space-between">
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
              New This Month
            </Text>
            <IconCalendar size={20} color={theme.colors.grape[6]} />
          </Group>
          <Text size="xl" fw={700} mt="xs">
            {stats.newThisMonth}
          </Text>
        </Card>
      </SimpleGrid>

      {/* Main Card */}
      <Paper p="md" radius="lg" shadow="sm" withBorder bg={cardBg}>
        <Stack gap="md">
          {/* Filter bar */}
          <Group justify="space-between">
            <Group gap="xs">
              <TextInput
                placeholder="Search by name, email, phone"
                leftSection={<IconSearch size={16} />}
                radius="md"
                w={260}
                value={search}
                onChange={(e) => setSearch(e.currentTarget.value)}
              />
              <Button
                variant="light"
                leftSection={<IconFilter size={16} />}
                onClick={() => setShowFilters(!showFilters)}
                color={showFilters ? "blue" : "gray"}
              >
                Filters
              </Button>
              {(roleFilter || statusFilter || activeFilter) && (
                <Button
                  variant="subtle"
                  size="xs"
                  onClick={() => {
                    setRoleFilter(null);
                    setStatusFilter(null);
                    setActiveFilter(null);
                  }}
                >
                  Clear all
                </Button>
              )}
            </Group>
            <Group gap="sm">
              <Menu shadow="md" width={200}>
                <Menu.Target>
                  <Button variant="outline" leftSection={<IconDownload size={16} />}>
                    Export
                  </Button>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item leftSection={<IconFileSpreadsheet size={14} />} onClick={exportToCSV}>
                    CSV
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
          </Group>

          {/* Advanced Filters Collapse */}
          <Collapse in={showFilters}>
            <Paper withBorder p="md" radius="md">
              <Grid>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Select
                    label="Role"
                    placeholder="All roles"
                    data={["All", "Admin", "User", "Guest"]}
                    value={roleFilter}
                    onChange={setRoleFilter}
                    clearable
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Select
                    label="Subscription"
                    placeholder="All"
                    data={["All", "Paid", "Free"]}
                    value={statusFilter}
                    onChange={setStatusFilter}
                    clearable
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Select
                    label="Account Status"
                    placeholder="All"
                    data={[
                      { value: "active", label: "Active" },
                      { value: "inactive", label: "Inactive" },
                    ]}
                    value={activeFilter}
                    onChange={setActiveFilter}
                    clearable
                  />
                </Grid.Col>
              </Grid>
            </Paper>
          </Collapse>

          {/* Table */}
          <Table.ScrollContainer minWidth={900}>
            <Table verticalSpacing="sm" highlightOnHover>
              <Table.Thead bg="#4318FF">
                <Table.Tr>
                  <Table.Th c="white">Full Name</Table.Th>
                  <Table.Th c="white">Email</Table.Th>
                  <Table.Th c="white">Phone</Table.Th>
                  <Table.Th c="white">Status</Table.Th>
                  <Table.Th c="white">Role</Table.Th>
                  <Table.Th c="white">Joined Date</Table.Th>
                  <Table.Th c="white">Last Active</Table.Th>
                  <Table.Th c="white">Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {paginatedUsers.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={8}>
                      <Text ta="center" py="xl" c="dimmed">
                        No users found
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  paginatedUsers.map((user) => (
                    <Table.Tr key={user.id}>
                      <Table.Td>
                        <Group gap="sm">
                          <Avatar size="sm" radius="xl" color="blue">
                            {user.name.charAt(0)}
                          </Avatar>
                          <Text size="sm" fw={500}>
                            {user.name}
                          </Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>{user.email}</Table.Td>
                      <Table.Td>{user.phone || "—"}</Table.Td>
                      <Table.Td>
                        <Badge color={user.status === "Paid" ? "green" : "gray"} variant="filled" radius="xl">
                          {user.status}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={
                            user.role === "Admin" ? "red" : user.role === "User" ? "blue" : "cyan"
                          }
                          variant="light"
                        >
                          {user.role}
                        </Badge>
                      </Table.Td>
                      <Table.Td>{user.joined}</Table.Td>
                      <Table.Td>
                        <Tooltip label={formatDateTime(user.lastLogin)}>
                          <Badge color={getActiveColor(user.lastLogin)} variant="dot">
                            {user.active}
                          </Badge>
                        </Tooltip>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4} justify="flex-end">
                          <Tooltip label="View details">
                            <ActionIcon
                              variant="subtle"
                              color="blue"
                              onClick={() => router.push(`/admin/accounts/${user.id}`)}
                            >
                              <IconEye size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Go to details">
                            <ActionIcon
                              variant="subtle"
                              color="teal"
                              onClick={() => router.push(`/admin/accounts/${user.id}`)}
                            >
                              <IconChevronRight size={16} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>

          {/* Pagination */}
          <Group justify="space-between" mt="md">
            <Group gap="xs">
              <Text size="sm" c="dimmed">
                Rows per page
              </Text>
              <Select
                size="xs"
                w={70}
                data={["10", "20", "50"]}
                value={pageSize}
                onChange={(val) => setPageSize(val || "10")}
              />
              <Text size="sm" c="dimmed">
                {filteredUsers.length} {filteredUsers.length === 1 ? "user" : "users"}
              </Text>
            </Group>
            <Pagination
              total={totalPages}
              value={activePage}
              onChange={setActivePage}
              radius="xl"
              color="blue"
              size="sm"
            />
          </Group>
        </Stack>
      </Paper>
    </Box>
  );
}