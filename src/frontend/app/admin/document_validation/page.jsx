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
  useMantineTheme,
  Loader,
  Tabs,
  Drawer,
  Textarea,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconSearch,
  IconDownload,
  IconEye,
  IconRefresh,
  IconCar,
  IconEyeOff,
  IconFileCheck,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import { adminFetchPaginatedList, adminFetch, uploadUrl } from "@/app/lib/adminApi";

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

const mapVehicleToDoc = (v) => {
  const u = v.reportedBy;
  const name = u ? `${u.firstName || ""} ${u.lastName || ""}`.trim() : "Unknown";
  let imgArray = [];
  if (Array.isArray(v.ownershipDocumentUrl)) {
    imgArray = v.ownershipDocumentUrl.map(uploadUrl);
  } else if (typeof v.ownershipDocumentUrl === 'string') {
    imgArray = [uploadUrl(v.ownershipDocumentUrl)];
  }

  return {
    id: v._id,
    uploader: name || u?.email || "Unknown",
    type: "Vehicle Ownership",
    preview: imgArray[0] || "",
    previews: imgArray,
    submittedAt: v.createdAt,
    status: v.verificationStatus || "Pending",
    raw: v,
  };
};

export default function DocumentValidationPage() {
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();

  const mainBg = getBg(colorScheme, "#F4F7FE", theme.colors.dark[7]);
  const primaryText = getTextColor(colorScheme, "#2B3674", theme.colors.gray[3]);
  const headerBg = getBg(colorScheme, "white", theme.colors.dark[6]);
  const cardBg = getBg(colorScheme, "white", theme.colors.dark[6]);

  const [activeTab, setActiveTab] = useState("sightings");

  const [previewDrawerOpen, setPreviewDrawerOpen] = useState(false);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewDocId, setPreviewDocId] = useState(null);
  const [previewReason, setPreviewReason] = useState("");

  const previewUrl = previewUrls[previewIndex] || "";

  const [docs, setDocs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  
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
  }, [debouncedSearch, activeTab]);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", String(activePage));
      params.set("limit", String(parseInt(pageSize, 10) || 10));
      if (debouncedSearch) params.set("search", debouncedSearch);

      if (activeTab === "sightings") {
        params.set("status", "pending");
        const { data, meta } = await adminFetchPaginatedList(`/sightings?${params.toString()}`);
        setDocs((data || []).map(mapSightingToDoc));
        setTotalPages(meta?.pages || 1);
      } else {
        const { data } = await adminFetchPaginatedList(`/admin/vehicles/pending-validation?${params.toString()}`);
        setVehicles((data?.vehicles || []).map(mapVehicleToDoc));
        setTotalPages(data?.pagination?.pages || 1);
      }
    } catch (err) {
      console.error(err);
      notifications.show({ title: "Error", message: "Could not load data", color: "red" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [activePage, pageSize, debouncedSearch, activeTab]);

  const currentList = activeTab === "sightings" ? docs : vehicles;

  const filtered = useMemo(() => {
    let res = [...currentList];
    if (statusFilter && statusFilter !== "All") {
      res = res.filter((d) => {
        if (activeTab === "sightings") return d.status === statusFilter;
        return d.status.toLowerCase() === statusFilter.toLowerCase();
      });
    }
    return res;
  }, [currentList, statusFilter, activeTab]);

  const openPreview = (urls, id) => {
    const arr = Array.isArray(urls) ? urls.filter(Boolean) : (urls ? [urls] : []);
    if (arr.length === 0) {
      notifications.show({
        title: "No preview",
        message: "No document/image available",
        color: "yellow",
      });
      return;
    }
    setPreviewUrls(arr);
    setPreviewIndex(0);
    setPreviewDocId(id);
    setPreviewReason("");
    setPreviewDrawerOpen(true);
  };

  const approveSighting = async (id, skipConfirm = false) => {
    if (!skipConfirm && !confirm("Approve this sighting?")) return;
    try {
      await adminFetch(`/admin/sightings/${id}/approve`, { method: "PATCH", body: JSON.stringify({}) });
      notifications.show({ title: "Approved", message: "Sighting confirmed", color: "green" });
      fetchDocs();
      if (skipConfirm) setPreviewDrawerOpen(false);
    } catch (err) {
      console.error(err);
      notifications.show({ title: "Error", message: "Could not approve", color: "red" });
    }
  };

  const rejectSighting = async (id, reasonInput, skipConfirm = false) => {
    const reason = skipConfirm ? reasonInput : (window.prompt("Rejection reason (optional)") || "");
    if (!skipConfirm && !confirm("Reject this sighting?")) return;
    try {
      await adminFetch(`/admin/sightings/${id}/reject`, {
        method: "PATCH",
        body: JSON.stringify({ reason }),
      });
      notifications.show({ title: "Rejected", message: "Sighting marked reviewed", color: "orange" });
      fetchDocs();
      if (skipConfirm) setPreviewDrawerOpen(false);
    } catch (err) {
      console.error(err);
      notifications.show({ title: "Error", message: "Could not reject", color: "red" });
    }
  };

  const verifyVehicle = async (id, action, reasonInput, skipConfirm = false) => {
    let reason = "";
    if (action === "reject") {
      reason = skipConfirm ? reasonInput : (window.prompt("Rejection reason (optional)") || "");
      if (!skipConfirm && !confirm("Reject this vehicle document?")) return;
    } else {
      if (!skipConfirm && !confirm("Approve this vehicle ownership document?")) return;
    }

    try {
      await adminFetch(`/admin/vehicles/${id}/verify`, {
        method: "PATCH",
        body: JSON.stringify({ action, reason }),
      });
      notifications.show({ 
        title: action === 'approve' ? "Approved" : "Rejected", 
        message: `Vehicle document ${action}d successfully`, 
        color: action === 'approve' ? "green" : "orange" 
      });
      fetchDocs();
      if (skipConfirm) setPreviewDrawerOpen(false);
    } catch (err) {
      console.error(err);
      notifications.show({ title: "Error", message: "Could not verify vehicle", color: "red" });
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
    a.download = `${activeTab}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notifications.show({ title: "Exported", message: `${filtered.length} rows`, color: "green" });
  };

  return (
    <Box bg={mainBg} style={{ minHeight: "100vh" }} p="xl">
      <Group justify="space-between" mb="xl">
        <Group>
          <Title order={2} fw={700} c={primaryText}>
            Document Validation
          </Title>
          <Badge size="lg" variant="light" color="blue">
            {activeTab === 'sightings' ? 'Pending sightings' : 'Pending vehicles'}
          </Badge>
        </Group>
        <Group bg={headerBg} p={8} style={{ borderRadius: "30px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
          <TextInput
            placeholder="Search..."
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

      <Tabs value={activeTab} onChange={setActiveTab} mb="xl">
        <Tabs.List>
          <Tabs.Tab value="sightings" leftSection={<IconEyeOff size={16} />}>
            Sightings Validation
          </Tabs.Tab>
          <Tabs.Tab value="vehicles" leftSection={<IconCar size={16} />}>
            Vehicle Ownership Documents
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>

      <SimpleGrid cols={{ base: 1, sm: 3 }} mb="lg">
        <Paper p="md" radius="md" withBorder bg={cardBg}>
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
            Queue
          </Text>
          <Text size="xl" fw={800}>
            {currentList.length}
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
            data={
              activeTab === "sightings" 
                ? ["All", "pending", "reviewed", "confirmed", "resolved"]
                : ["All", "Pending", "Verified", "Rejected"]
            }
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
                <Table.Th c="white">Document Preview</Table.Th>
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
              {loading ? (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Group justify="center" py="xl">
                      <Loader />
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ) : filtered.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Text ta="center" c="dimmed" py="xl">
                      No pending {activeTab}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                filtered.map((d) => (
                  <Table.Tr key={d.id}>
                    <Table.Td>
                      {d.previews && d.previews.length > 0 ? (
                        <Group gap="xs">
                          {d.previews.slice(0, 3).map((pUrl, idx) => (
                            <Avatar key={idx} src={pUrl} radius="sm" size={48} style={{ cursor: 'pointer', outline: idx === 0 ? '2px solid #4318FF' : 'none' }} onClick={() => openPreview(d.previews, d.id)} />
                          ))}
                          {d.previews.length > 3 && (
                            <Badge color="blue" variant="filled" style={{ cursor: 'pointer' }} onClick={() => openPreview(d.previews, d.id)}>+{d.previews.length - 3}</Badge>
                          )}
                        </Group>
                      ) : d.preview ? (
                        <Avatar src={d.preview} radius="sm" size={48} style={{ cursor: 'pointer' }} onClick={() => openPreview([d.preview], d.id)} />
                      ) : (
                        <Badge color="gray">No Document</Badge>
                      )}
                    </Table.Td>
                    <Table.Td>{d.uploader}</Table.Td>
                    <Table.Td>{d.type}</Table.Td>
                    <Table.Td>{new Date(d.submittedAt).toLocaleString()}</Table.Td>
                    <Table.Td>
                      <Badge color={d.status.toLowerCase() === 'pending' ? 'yellow' : d.status.toLowerCase() === 'verified' ? 'green' : 'red'}>
                        {d.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4} justify="flex-end">
                        <ActionIcon variant="subtle" color="blue" onClick={() => openPreview(d.previews?.length ? d.previews : [d.preview], d.id)} disabled={!d.preview && !(d.previews?.length)}>
                          <IconEye size={18} />
                        </ActionIcon>
                        {activeTab === "sightings" ? (
                          <>
                            <Button size="xs" color="green" onClick={() => approveSighting(d.id)}>
                              Approve
                            </Button>
                            <Button size="xs" color="red" variant="light" onClick={() => rejectSighting(d.id)}>
                              Reject
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="xs" color="green" onClick={() => verifyVehicle(d.id, "approve")}>
                              Verify
                            </Button>
                            <Button size="xs" color="red" variant="light" onClick={() => verifyVehicle(d.id, "reject")}>
                              Reject
                            </Button>
                          </>
                        )}
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

      <Drawer
        opened={previewDrawerOpen}
        onClose={() => setPreviewDrawerOpen(false)}
        position="right"
        title={<Text fw={700} size="lg">Document Action Panel</Text>}
        size="lg"
      >
        <Box style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
          {previewUrl && (
            <Paper withBorder style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden', borderRadius: '8px' }} mb="md">
               {previewUrl.toLowerCase().endsWith('.pdf') ? (
                  <iframe src={previewUrl} width="100%" height="100%" style={{ border: 'none' }} title="PDF Preview" />
               ) : (
                  <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
               )}
               {previewUrls.length > 1 && (
                 <>
                   <ActionIcon
                     variant="filled"
                     color="dark"
                     radius="xl"
                     size="lg"
                     style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', opacity: 0.8, zIndex: 10 }}
                     onClick={() => setPreviewIndex(i => (i - 1 + previewUrls.length) % previewUrls.length)}
                     disabled={previewUrls.length <= 1}
                   >
                     <IconChevronLeft size={20} />
                   </ActionIcon>
                   <ActionIcon
                     variant="filled"
                     color="dark"
                     radius="xl"
                     size="lg"
                     style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', opacity: 0.8, zIndex: 10 }}
                     onClick={() => setPreviewIndex(i => (i + 1) % previewUrls.length)}
                     disabled={previewUrls.length <= 1}
                   >
                     <IconChevronRight size={20} />
                   </ActionIcon>
                   <Text size="xs" style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white', padding: '2px 10px', borderRadius: 12 }}>
                     {previewIndex + 1} / {previewUrls.length}
                   </Text>
                 </>
               )}
            </Paper>
          )}
          
          <Box>
            <Textarea
              label="Review Notes (Optional)"
              placeholder="Add reason for rejection or approval notes..."
              value={previewReason}
              onChange={(e) => setPreviewReason(e.currentTarget.value)}
              minRows={3}
              mb="md"
            />
            <Group grow>
              <Button 
                color="red" 
                variant="light" 
                onClick={() => {
                  if (activeTab === "sightings") rejectSighting(previewDocId, previewReason, true);
                  else verifyVehicle(previewDocId, "reject", previewReason, true);
                }}
              >
                Reject
              </Button>
              <Button 
                color="green" 
                onClick={() => {
                  if (activeTab === "sightings") approveSighting(previewDocId, true);
                  else verifyVehicle(previewDocId, "approve", previewReason, true);
                }}
              >
                Approve
              </Button>
            </Group>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
}
