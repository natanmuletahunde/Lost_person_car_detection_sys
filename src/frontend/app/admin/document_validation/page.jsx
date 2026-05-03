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
  UnstyledButton,
  useMantineTheme,
  useMantineColorScheme,
  Loader,
  Menu,
  Stack,
  Grid,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconSearch,
  IconDownload,
  IconEye,
  IconChevronRight,
  IconFileCheck,
  IconX,
  IconRefresh,
} from "@tabler/icons-react";

// keep same base as other admin pages
const API_BASE_URL = "http://localhost:3001";

const getBg = (colorScheme, light, dark) => (colorScheme === "dark" ? dark : light);
const getTextColor = (colorScheme, light, dark) => (colorScheme === "dark" ? dark : light);

const mapApiToDoc = (d) => ({
  id: d.id,
  uploader: d.uploaderName || d.uploader || "Unknown",
  type: d.type || d.documentType || "Document",
  preview: d.previewUrl || d.url || "",
  submittedAt: d.submittedAt || d.createdAt || new Date().toISOString(),
  status: d.status || "pending",
});

export default function DocumentValidationPage() {
  const theme = useMantineTheme();
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

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/documents`);
      if (!res.ok) throw new Error("Failed to fetch documents");
      const data = await res.json();
      const mapped = data.map(mapApiToDoc);
      setDocs(mapped);
    } catch (err) {
      console.error(err);
      notifications.show({ title: "Error", message: "Could not load documents", color: "red" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const filtered = useMemo(() => {
    let res = [...docs];
    if (search) {
      const s = search.toLowerCase();
      res = res.filter(
        (d) =>
          d.uploader.toLowerCase().includes(s) ||
          d.type.toLowerCase().includes(s) ||
          (d.id && String(d.id).toLowerCase().includes(s))
      );
    }
    if (statusFilter && statusFilter !== "All") {
      res = res.filter((d) => d.status === statusFilter);
    }
    return res;
  }, [docs, search, statusFilter]);

  const paginated = useMemo(() => {
    const size = parseInt(pageSize, 10);
    const start = (activePage - 1) * size;
    return filtered.slice(start, start + size);
  }, [filtered, activePage, pageSize]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filtered.length / parseInt(pageSize, 10))), [filtered, pageSize]);

  const openPreview = (url) => {
    if (!url) {
      notifications.show({ title: "No preview", message: "No preview available for this document", color: "yellow" });
      return;
    }
    window.open(url, "_blank");
  };

  const updateStatus = async (id, newStatus) => {
    try {
      // optimistic UI
      setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, status: newStatus } : d)));
      const res = await fetch(`${API_BASE_URL}/documents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      notifications.show({ title: "Updated", message: `Document ${newStatus}`, color: "green" });
    } catch (err) {
      console.error(err);
      notifications.show({ title: "Error", message: "Could not update document status", color: "red" });
      // revert UI
      fetchDocs();
    }
  };

  const approve = (id) => {
    if (!confirm("Approve this document?")) return;
    updateStatus(id, "approved");
  };

  const reject = (id) => {
    if (!confirm("Reject this document?")) return;
    updateStatus(id, "rejected");
  };

  const exportToCSV = () => {
    const headers = ["ID", "Uploader", "Type", "Submitted At", "Status"];
    const rows = filtered.map((d) => [d.id, d.uploader, d.type, d.submittedAt, d.status]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `documents_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notifications.show({ title: "Exported", message: `${filtered.length} rows exported`, color: "green" });
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
      <Group justify="space-between" mb="xl">
        <Group>
          <Title order={2} fw={700} c={primaryText}>
            Document Validation
          </Title>
          <Badge size="lg" variant="light" color="blue">
            {docs.length} total
          </Badge>
        </Group>
        <Group bg={headerBg} p={8} style={{ borderRadius: "30px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
          <TextInput
            placeholder="Search by uploader, type or id"
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
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <Button variant="outline" leftSection={<IconDownload size={16} />}>
                Export
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconFileCheck size={14} />} onClick={exportToCSV}>
                CSV
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>

      <Paper p="md" radius="lg" shadow="sm" withBorder bg={cardBg}>
        <Stack gap="md">
          <Group justify="space-between">
            <Group gap="xs">
              <Select
                placeholder="All statuses"
                data={["All", "pending", "approved", "rejected"]}
                value={statusFilter}
                onChange={setStatusFilter}
                clearable
              />
            </Group>
          </Group>

          <Table.ScrollContainer minWidth={900}>
            <Table verticalSpacing="sm" highlightOnHover>
              <Table.Thead bg="#4318FF">
                <Table.Tr>
                  <Table.Th c="white">Document</Table.Th>
                  <Table.Th c="white">Uploader</Table.Th>
                  <Table.Th c="white">Type</Table.Th>
                  <Table.Th c="white">Submitted</Table.Th>
                  <Table.Th c="white">Status</Table.Th>
                  <Table.Th c="white">Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {paginated.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={6}>
                      <Text ta="center" py="xl" c="dimmed">
                        No documents found
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  paginated.map((d) => (
                    <Table.Tr key={d.id}>
                      <Table.Td>
                        <Group>
                          <Avatar size="sm" radius="md" color="blue">
                            {d.type.charAt(0)}
                          </Avatar>
                          <Text size="sm" fw={500} style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis" }}>
                            {d.preview ? (
                              <a href="#" onClick={(e) => { e.preventDefault(); openPreview(d.preview); }}>
                                Preview
                              </a>
                            ) : (
                              "—"
                            )}
                          </Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>{d.uploader}</Table.Td>
                      <Table.Td>{d.type}</Table.Td>
                      <Table.Td>{new Date(d.submittedAt).toLocaleString()}</Table.Td>
                      <Table.Td>
                        <Badge color={d.status === "approved" ? "green" : d.status === "rejected" ? "red" : "yellow"} variant="filled">
                          {d.status}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4} justify="flex-end">
                          <Tooltip label="View">
                            <ActionIcon variant="subtle" color="blue" onClick={() => openPreview(d.preview)}>
                              <IconEye size={16} />
                            </ActionIcon>
                          </Tooltip>
                          {d.status === "pending" && (
                            <>
                              <Tooltip label="Approve">
                                <ActionIcon variant="subtle" color="green" onClick={() => approve(d.id)}>
                                  <IconFileCheck size={16} />
                                </ActionIcon>
                              </Tooltip>
                              <Tooltip label="Reject">
                                <ActionIcon variant="subtle" color="red" onClick={() => reject(d.id)}>
                                  <IconX size={16} />
                                </ActionIcon>
                              </Tooltip>
                            </>
                          )}
                          <Tooltip label="Go to details">
                            <ActionIcon variant="subtle" color="teal" onClick={() => window.location.assign(`/admin/document_validation/${d.id}`)}>
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

          <Group justify="space-between" mt="md">
            <Group gap="xs">
              <Text size="sm" c="dimmed">
                Rows per page
              </Text>
              <Select size="xs" w={70} data={["10", "20", "50"]} value={pageSize} onChange={(val) => setPageSize(val || "10")} />
              <Text size="sm" c="dimmed">
                {filtered.length} {filtered.length === 1 ? "document" : "documents"}
              </Text>
            </Group>

            <Pagination total={totalPages} value={activePage} onChange={setActivePage} radius="xl" color="blue" size="sm" />
          </Group>
        </Stack>
      </Paper>
    </Box>
  );
}
