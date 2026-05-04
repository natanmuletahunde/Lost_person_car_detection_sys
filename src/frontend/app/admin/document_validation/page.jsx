"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  useMantineColorScheme,
  Loader,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconSearch,
  IconDownload,
  IconEye,
  IconRefresh,
} from "@tabler/icons-react";
import { adminFetchPaginatedList, uploadUrl } from "@/app/lib/adminApi";

const getBg = (colorScheme, light, dark) => (colorScheme === "dark" ? dark : light);
const getTextColor = (colorScheme, light, dark) => (colorScheme === "dark" ? dark : light);

const mapSightingToDoc = (s) => {
  const u = s.user;
  const name = u ? `${u.firstName || ""} ${u.lastName || ""}`.trim() : "Unknown";
  const img = Array.isArray(s.images) && s.images[0] ? uploadUrl(s.images[0]) : "";
  return {
    id: s._id,
    uploader: name || u?.email || "Unknown",
    type: s.type === "vehicle" ? "Vehicle sighting" : "Person sighting",
    preview: img,
    submittedAt: s.reportedAt || s.createdAt,
    status: s.status || "pending",
    raw: s,
  };
};

export default function DocumentValidationPage() {
  const { colorScheme } = useMantineColorScheme();

  const mainBg = getBg(colorScheme, "#F4F7FE", theme.colors.dark[7]);
  const primaryText = getTextColor(colorScheme, "#2B3674", theme.colors.gray[3]);
  const headerBg = getBg(colorScheme, "white", theme.colors.dark[6]);
  const cardBg = getBg(colorScheme, "white", theme.colors.dark[6]);

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [activePage, setActivePage] = useState(1);
  const [pageSize, setPageSize] = useState("10");
  const [totalPages, setTotalPages] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 320);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setActivePage(1);
  }, [debouncedSearch]);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", String(activePage));
      params.set("limit", String(parseInt(pageSize, 10) || 10));
      params.set("status", "pending");
      if (debouncedSearch) params.set("search", debouncedSearch);
      const { data, meta } = await adminFetchPaginatedList(`/sightings?${params.toString()}`);
      setDocs((data || []).map(mapSightingToDoc));
      setTotalPages(meta?.pages || 1);
    } catch (err) {
      console.error(err);
      notifications.show({ title: "Error", message: "Could not load pending sightings", color: "red" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [activePage, pageSize, debouncedSearch]);

  const filtered = useMemo(() => {
    let res = [...docs];
    if (statusFilter && statusFilter !== "All") {
      res = res.filter((d) => d.status === statusFilter);
    }
    return res;
  }, [docs, statusFilter]);

  const openPreview = (url) => {
    if (!url) {
      notifications.show({
        title: "No preview",
        message: "No image for this sighting",
        color: "yellow",
      });
      return;
    }
    window.open(url, "_blank");
  };

  const approve = async (id) => {
    if (!confirm("Approve this sighting?")) return;
    try {
      await adminFetch(`/admin/sightings/${id}/approve`, { method: "PATCH", body: JSON.stringify({}) });
      notifications.show({ title: "Approved", message: "Sighting confirmed", color: "green" });
      fetchDocs();
    } catch (err) {
      console.error(err);
      notifications.show({ title: "Error", message: "Could not approve", color: "red" });
    }
  };

  const reject = async (id) => {
    const reason = window.prompt("Rejection reason (optional)") || "";
    if (!confirm("Reject this sighting?")) return;
    try {
      await adminFetch(`/admin/sightings/${id}/reject`, {
        method: "PATCH",
        body: JSON.stringify({ reason }),
      });
      notifications.show({ title: "Rejected", message: "Sighting marked reviewed", color: "orange" });
      fetchDocs();
    } catch (err) {
      console.error(err);
      notifications.show({ title: "Error", message: "Could not reject", color: "red" });
    }
  };

  const exportToCSV = () => {
    const headers = ["ID", "Uploader", "Type", "Submitted At", "Status"];
    const rows = filtered.map((d) => [d.id, d.uploader, d.type, d.submittedAt, d.status]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sightings_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notifications.show({ title: "Exported", message: `${filtered.length} rows`, color: "green" });
  };

  if (loading && docs.length === 0) {
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
      <Group justify="space-between" mb="xl">
        <Group>
          <Title order={2} fw={700} c={primaryText}>
            Document Validation
          </Title>
          <Badge size="lg" variant="light" color="blue">
            Pending sightings
          </Badge>
        </Group>
        <Group bg={headerBg} p={8} style={{ borderRadius: "30px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
          <TextInput
            placeholder="Search by description"
            leftSection={<IconSearch size={16} />}
            radius="md"
            w={320}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
          />
          <Tooltip label="Refresh">
            <ActionIcon variant="subtle" color="gray" size="lg" onClick={fetchDocs}>
              <IconRefresh size={22} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 3 }} mb="lg">
        <Paper p="md" radius="md" withBorder bg={cardBg}>
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
            Queue
          </Text>
          <Text size="xl" fw={800}>
            {docs.length}
          </Text>
          <Text size="xs" c="dimmed">
            Current page (pending)
          </Text>
        </Paper>
      </SimpleGrid>

      <Paper p="md" radius="lg" withBorder bg={cardBg}>
        <Group justify="space-between" mb="md">
          <Select
            placeholder="Status"
            data={["All", "pending", "reviewed", "confirmed", "resolved"]}
            value={statusFilter}
            onChange={setStatusFilter}
            w={200}
            clearable
          />
          <Button leftSection={<IconDownload size={16} />} variant="light" onClick={exportToCSV}>
            Export CSV
          </Button>
        </Group>

        <Table.ScrollContainer minWidth={800}>
          <Table verticalSpacing="sm" highlightOnHover>
            <Table.Thead style={{ background: "#4318FF" }}>
              <Table.Tr>
                <Table.Th c="white">Preview</Table.Th>
                <Table.Th c="white">Reporter</Table.Th>
                <Table.Th c="white">Type</Table.Th>
                <Table.Th c="white">Submitted</Table.Th>
                <Table.Th c="white">Status</Table.Th>
                <Table.Th c="white" style={{ textAlign: "right" }}>
                  Actions
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filtered.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Text ta="center" c="dimmed" py="xl">
                      No pending sightings
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                filtered.map((d) => (
                  <Table.Tr key={d.id}>
                    <Table.Td>
                      <Avatar src={d.preview} radius="sm" size={48} />
                    </Table.Td>
                    <Table.Td>{d.uploader}</Table.Td>
                    <Table.Td>{d.type}</Table.Td>
                    <Table.Td>{new Date(d.submittedAt).toLocaleString()}</Table.Td>
                    <Table.Td>
                      <Badge color="yellow">{d.status}</Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4} justify="flex-end">
                        <ActionIcon variant="subtle" color="blue" onClick={() => openPreview(d.preview)}>
                          <IconEye size={18} />
                        </ActionIcon>
                        <Button size="xs" color="green" onClick={() => approve(d.id)}>
                          Approve
                        </Button>
                        <Button size="xs" color="red" variant="light" onClick={() => reject(d.id)}>
                          Reject
                        </Button>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>

        <Group justify="space-between" mt="md">
          <Select
            size="xs"
            w={80}
            data={["10", "20", "50"]}
            value={pageSize}
            onChange={(v) => setPageSize(v || "10")}
          />
          <Pagination total={totalPages} value={activePage} onChange={setActivePage} size="sm" />
        </Group>
      </Paper>
    </Box>
  );
}
