"use client";

import { useState, useMemo, useEffect } from "react";
import { adminFetch, adminFetchPaginatedList } from "@/app/lib/adminApi";
import {
  Box, Title, Text, Paper, SimpleGrid, Group, Button,
  Timeline, ThemeIcon, ActionIcon, Tooltip, TextInput,
  Pagination, useMantineTheme, useMantineColorScheme, Badge, Menu,
} from "@mantine/core";
import { IconHistory, IconSearch, IconDownload, IconEye, IconTrash, IconDotsVertical, IconSettings, IconBell, IconRefresh } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";

const getBg = (colorScheme, light, dark) => (colorScheme === "dark" ? dark : light);

const reporterLabel = (reportedBy) => {
  if (!reportedBy) return "—";
  if (typeof reportedBy === "string") return reportedBy;
  const name = `${reportedBy.firstName || ""} ${reportedBy.lastName || ""}`.trim();
  return name || reportedBy.email || "—";
};

const buildActivities = (cases, sightings, users) => {
  const out = [];
  let nid = 1;
  for (const c of cases.slice(0, 20)) {
    const title =
      c.caseType === "person"
        ? `${c.firstName || ""} ${c.lastName || ""}`.trim()
        : `${c.make || ""} ${c.model || ""}`.trim();
    out.push({
      id: nid++,
      action: "created",
      user: reporterLabel(c.reportedBy),
      target: title || c.caseId || String(c._id),
      time: c.reportDate || c.createdAt || new Date().toISOString(),
      details: `New ${c.caseType} case`,
    });
  }
  for (const s of sightings.slice(0, 15)) {
    const u = s.user;
    const uname = u ? `${u.firstName || ""} ${u.lastName || ""}`.trim() : "Reporter";
    out.push({
      id: nid++,
      action: s.status === "confirmed" ? "approved" : "updated",
      user: uname,
      target: `Sighting ${String(s._id).slice(0, 8)}…`,
      time: s.reportedAt || s.createdAt,
      details: `${s.type || "sighting"} · ${s.status}`,
    });
  }
  for (const u of users.slice(0, 8)) {
    out.push({
      id: nid++,
      action: "login",
      user: u.email || "user",
      target: "Profile",
      time: u.lastLogin || u.createdAt,
      details: u.lastLogin ? "Last activity" : "Registered",
    });
  }
  return out.sort((a, b) => new Date(b.time) - new Date(a.time));
};

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
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [casesPayload, sightRes, usersPayload] = await Promise.all([
          adminFetch("/admin/cases?limit=40&page=1"),
          adminFetchPaginatedList("/sightings?limit=25&page=1"),
          adminFetch("/admin/users?limit=15&page=1"),
        ]);
        if (cancelled) return;
        const list = buildActivities(
          casesPayload?.cases || [],
          sightRes?.data || [],
          usersPayload?.users || []
        );
        setActivities(list);
      } catch (e) {
        console.error(e);
        notifications.show({ title: "Error", message: "Could not load activity feed", color: "red" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    let result = [...activities];
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
    return activities.filter((a) => String(a.time).startsWith(today)).length;
  }, [activities]);

  const loginCount = activities.filter((a) => a.action === "login").length;
  const modCount = activities.filter((a) =>
    ["created", "updated", "deleted", "approved"].includes(a.action)
  ).length;

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
          <Text size="xl" fw={700} mt="xs">{activities.length}</Text>
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
