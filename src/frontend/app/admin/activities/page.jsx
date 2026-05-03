"use client";

import { useState, useMemo } from "react";
import {
  Box, Title, Text, Paper, SimpleGrid, Group, Button,
  Timeline, ThemeIcon, ActionIcon, Tooltip, TextInput,
  Pagination, useMantineTheme, useMantineColorScheme, Badge, Menu,
} from "@mantine/core";
import { IconHistory, IconSearch, IconDownload, IconEye, IconTrash, IconDotsVertical, IconSettings, IconBell, IconRefresh } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";

const getBg = (colorScheme, light, dark) => (colorScheme === "dark" ? dark : light);

const ACTIVITIES = [
  { id: 1, action: "login", user: "admin@example.com", target: "System", time: "2026-05-03T10:30:00", details: "Admin logged in" },
  { id: 2, action: "created", user: "admin@example.com", target: "Notification #12", time: "2026-05-03T09:15:00", details: "Created notification" },
  { id: 3, action: "approved", user: "admin@example.com", target: "Document #45", time: "2026-05-03T08:45:00", details: "Approved ID document" },
  { id: 4, action: "deleted", user: "admin@example.com", target: "User #89", time: "2026-05-02T16:20:00", details: "Deleted user account" },
  { id: 5, action: "updated", user: "admin@example.com", target: "Plan: Pro", time: "2026-05-02T14:10:00", details: "Updated plan price" },
];

const getColor = (action) => {
  const colors = { login: "blue", created: "green", updated: "cyan", deleted: "red", approved: "teal" };
  return colors[action] || "gray";
};

const getIcon = (action) => {
  const icons = { login: IconEye, created: IconDownload, updated: IconDownload, deleted: IconTrash, approved: IconEye };
  return icons[action] || IconHistory;
};

export default function ActivitiesPage() {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();

  const mainBg = getBg(colorScheme, "#F4F7FE", theme.colors.dark[7]);
  const headerBg = getBg(colorScheme, "white", theme.colors.dark[6]);
  const paperBg = getBg(colorScheme, "white", theme.colors.dark[6]);
  const cardBg = getBg(colorScheme, "white", theme.colors.dark[6]);
  const primaryText = getBg(colorScheme, "#2B3674", theme.colors.gray[3]);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    let result = [...ACTIVITIES];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(a => a.user.toLowerCase().includes(s) || a.target.toLowerCase().includes(s));
    }
    result.sort((a, b) => new Date(b.time) - new Date(a.time));
    return result;
  }, [search]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const totalPages = Math.ceil(filtered.length / pageSize);

  const todayCount = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return ACTIVITIES.filter(a => a.time.startsWith(today)).length;
  }, []);

  const loginCount = ACTIVITIES.filter(a => a.action === "login").length;
  const modCount = ACTIVITIES.filter(a => a.action === "created" || a.action === "updated" || a.action === "deleted" || a.action === "approved").length;

  const exportToCSV = () => {
    const headers = ["Action", "User", "Target", "Time", "Details"];
    const data = filtered.map(a => [a.action, a.user, a.target, new Date(a.time).toLocaleString(), a.details]);
    const csv = [headers.join(","), ...data.map(row => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activities_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notifications.show({ title: "Exported", message: `${filtered.length} activities exported`, color: "green" });
  };

  return (
    <Box bg={mainBg} style={{ minHeight: "100vh" }} p="xl">
      <Group justify="space-between" mb="xl">
        <Box>
          <Title order={2} fw={700} c={primaryText}>Activities Log</Title>
          <Text size="sm" c="dimmed">Track all admin actions</Text>
        </Box>
        <Group bg={headerBg} p={8} style={{ borderRadius: "30px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
          <Tooltip label="Settings"><ActionIcon variant="subtle" color="gray" size="lg"><IconSettings size={22} /></ActionIcon></Tooltip>
          <Tooltip label="Notifications"><ActionIcon variant="subtle" color="gray" size="lg"><IconBell size={22} /></ActionIcon></Tooltip>
          <Tooltip label="Refresh"><ActionIcon variant="subtle" color="gray" size="lg"><IconRefresh size={22} /></ActionIcon></Tooltip>
        </Group>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg" mb="xl">
        <Paper withBorder radius="lg" p="md" bg={cardBg}>
          <Group justify="space-between">
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Total Activities</Text>
            <IconHistory size={20} color={theme.colors.blue[6]} />
          </Group>
          <Text size="xl" fw={700} mt="xs">{ACTIVITIES.length}</Text>
        </Paper>
        <Paper withBorder radius="lg" p="md" bg={cardBg}>
          <Group justify="space-between">
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Today</Text>
            <IconEye size={20} color={theme.colors.cyan[6]} />
          </Group>
          <Text size="xl" fw={700} mt="xs">{todayCount}</Text>
        </Paper>
        <Paper withBorder radius="lg" p="md" bg={cardBg}>
          <Group justify="space-between">
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Logins</Text>
            <IconEye size={20} color={theme.colors.green[6]} />
          </Group>
          <Text size="xl" fw={700} mt="xs">{loginCount}</Text>
        </Paper>
        <Paper withBorder radius="lg" p="md" bg={cardBg}>
          <Group justify="space-between">
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Modifications</Text>
            <IconDownload size={20} color={theme.colors.orange[6]} />
          </Group>
          <Text size="xl" fw={700} mt="xs">{modCount}</Text>
        </Paper>
      </SimpleGrid>

      <Paper p="md" radius="lg" mb="xl" shadow="sm" withBorder bg={paperBg}>
        <Group justify="space-between">
          <TextInput placeholder="Search by user or target" leftSection={<IconSearch size={16} />} value={search} onChange={(e) => setSearch(e.currentTarget.value)} radius="md" size="sm" w={300} />
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <Button variant="outline" color="gray" leftSection={<IconDownload size={16} />} radius="md" size="sm">Export</Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconDownload size={14} />} onClick={exportToCSV}>CSV</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Paper>

      <Paper radius="lg" shadow="sm" withBorder bg={paperBg} p="md">
        <Timeline active={-1} bulletSize={24} lineWidth={2}>
          {paginated.map((a) => {
            const Icon = getIcon(a.action);
            const color = getColor(a.action);
            return (
              <Timeline.Item key={a.id} bullet={<ThemeIcon size={22} radius="xl" color={color} variant="light"><Icon size={12} /></ThemeIcon>}
                title={<Group justify="space-between"><Badge color={color} variant="light" size="sm">{a.action.toUpperCase()}</Badge><Text size="xs" c="dimmed">{new Date(a.time).toLocaleString()}</Text></Group>}>
                <Group justify="space-between">
                  <Box>
                    <Text size="sm" fw={500}>{a.target}</Text>
                    <Text size="xs" c="dimmed">{a.user}</Text>
                    <Text size="sm" mt={4}>{a.details}</Text>
                  </Box>
                  <Menu shadow="md" width={150}>
                    <Menu.Target>
                      <ActionIcon variant="subtle" color="gray"><IconDotsVertical size={16} /></ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item leftSection={<IconEye size={14} />}>View Details</Menu.Item>
                      <Menu.Item leftSection={<IconTrash size={14} />} color="red">Delete</Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Group>
              </Timeline.Item>
            );
          })}
        </Timeline>
        <Group justify="space-between" mt="md" pt="md" style={{ borderTop: "1px solid #e9ecef" }}>
          <Text size="sm" c="dimmed">{filtered.length} {filtered.length === 1 ? "activity" : "activities"}</Text>
          <Pagination total={totalPages} value={page} onChange={setPage} size="sm" radius="xl" color="blue" />
        </Group>
      </Paper>
    </Box>
  );
}
