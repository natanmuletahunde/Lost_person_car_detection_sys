"use client";

import React, { useState, useMemo, useEffect } from 'react';
import {
  Box, Title, Text, Table, Badge, Group, TextInput,
  Button, Select, ActionIcon, Paper, SimpleGrid,
  Pagination, Avatar, Menu, UnstyledButton,
  Modal, Stack, Grid, Divider, Tooltip,
  useMantineTheme, useMantineColorScheme, Loader
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import Link from 'next/link';
import {
  IconSearch, IconCalendar, IconDownload,
  IconEdit, IconSettings, IconBell,
  IconCar, IconDotsVertical, IconTrash, IconCheck, IconX, IconUsers,
  IconEye, IconPlus, IconFileSpreadsheet, IconAlertCircle,
  IconChevronRight
} from '@tabler/icons-react';
import { adminFetch } from '@/app/lib/adminApi';

// Helpers
const getBg = (colorScheme, light, dark) => (colorScheme === 'dark' ? dark : light);
const getTextColor = (colorScheme, light, dark) => (colorScheme === 'dark' ? dark : light);
const formatDateForInput = (date) => date.toISOString().split('T')[0];

// Helper to safely extract reporter name (handles both string and object)
const getReporterName = (reportedBy) => {
  if (!reportedBy) return 'N/A';
  if (typeof reportedBy === 'string') return reportedBy;
  // If it's an object, try to combine first and last name
  const name = `${reportedBy.firstName || ''} ${reportedBy.lastName || ''}`.trim();
  return name || reportedBy.email || 'N/A';
};

const personReportDate = (person) => person.reportDate || person.createdAt || new Date().toISOString();

// Map a person from the API to our unified record shape
const mapPersonToRecord = (person) => ({
  id: `person-${person._id}`,
  caseType: 'person',
  brand: `${person.firstName || ''} ${person.lastName || ''}`.trim(),
  model: 'Person',
  user: getReporterName(person.reportedBy),
  plate: 'N/A',
  date: new Date(personReportDate(person)).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  }),
  dateObj: new Date(personReportDate(person)),
  status: person.status || 'Active',
  alerts: Array.isArray(person.matches) ? person.matches.length : 0,
});

// Map a vehicle from the API to our unified record shape
const mapVehicleToRecord = (vehicle) => ({
  id: `vehicle-${vehicle._id}`,
  caseType: 'vehicle',
  brand: vehicle.make || vehicle.brand,
  model: vehicle.model,
  user: getReporterName(vehicle.reportedBy),
  plate: vehicle.plateNumber || vehicle.plate,
  date: new Date(vehicle.createdAt || vehicle.lastSeenDate || new Date()).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  }),
  dateObj: new Date(vehicle.createdAt || vehicle.lastSeenDate || new Date()),
  status: vehicle.status || 'Active',
  alerts: Array.isArray(vehicle.matches) ? vehicle.matches.length : 0,
});

export default function DataManagementPage() {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const mainBg = getBg(colorScheme, '#F4F7FE', theme.colors.dark[7]);
  const headerBg = getBg(colorScheme, 'white', theme.colors.dark[6]);
  const footerBg = getBg(colorScheme, 'white', theme.colors.dark[6]);

  // ---------- STATE ----------
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState(null);
  const [dateFilter, setDateFilter] = useState(null);
  const [activePage, setActivePage] = useState(1);
  const [pageSize, setPageSize] = useState('10');
  const [editingRecord, setEditingRecord] = useState(null);
  const [viewingRecord, setViewingRecord] = useState(null);

  // Modals
  const [addModalOpened, addModalHandlers] = useDisclosure(false);
  const [editModalOpened, editModalHandlers] = useDisclosure(false);
  const [viewModalOpened, viewModalHandlers] = useDisclosure(false);

  // ---------- FETCH DATA ----------
  const fetchData = async () => {
    try {
      setLoading(true);
      const payload = await adminFetch('/admin/cases?limit=500&page=1');
      const cases = payload?.cases || [];
      const personRecords = cases.filter((c) => c.caseType === 'person').map(mapPersonToRecord);
      const vehicleRecords = cases.filter((c) => c.caseType === 'vehicle').map(mapVehicleToRecord);
      const allRecords = [...personRecords, ...vehicleRecords].sort(
        (a, b) => b.dateObj.getTime() - a.dateObj.getTime()
      );
      setData(allRecords);
    } catch (error) {
      console.error('Fetch error:', error);
      notifications.show({
        title: 'Error',
        message: 'Could not load records from the server',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ---------- FILTERED & SORTED DATA ----------
  const filteredData = useMemo(() => {
    let result = [...data];

    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      result = result.filter(item =>
        item.brand.toLowerCase().includes(lower) ||
        item.user.toLowerCase().includes(lower) ||
        item.plate.toLowerCase().includes(lower)
      );
    }

    if (typeFilter && typeFilter !== 'All') {
      result = result.filter(item => item.model === typeFilter);
    }

    if (dateFilter && dateFilter !== 'All') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const oneDay = 24 * 60 * 60 * 1000;

      result = result.filter(item => {
        const itemDate = item.dateObj;
        if (dateFilter === 'Today') {
          return itemDate >= today && itemDate < new Date(today.getTime() + oneDay);
        }
        if (dateFilter === 'This Week') {
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay());
          return itemDate >= startOfWeek;
        }
        if (dateFilter === 'This Month') {
          return itemDate.getMonth() === today.getMonth() && itemDate.getFullYear() === today.getFullYear();
        }
        return true;
      });
    }

    // Already sorted descending by date in original merge, keep it
    return result;
  }, [data, searchQuery, typeFilter, dateFilter]);

  // ---------- STATS ----------
  const stats = useMemo(() => {
    const total = data.length;
    const verified = data.filter(d => d.status === 'Resolved' || d.status === 'Verified').length;
    const unverified = data.filter(d => d.status !== 'Resolved' && d.status !== 'Verified').length;
    const totalAlerts = data.reduce((sum, d) => sum + d.alerts, 0);
    return { total, verified, unverified, totalAlerts };
  }, [data]);

  // ---------- PAGINATION ----------
  const paginatedData = useMemo(() => {
    const size = parseInt(pageSize);
    const start = (activePage - 1) * size;
    return filteredData.slice(start, start + size);
  }, [filteredData, activePage, pageSize]);

  const totalPages = useMemo(() => Math.ceil(filteredData.length / parseInt(pageSize)), [filteredData, pageSize]);

  useEffect(() => {
    setActivePage(1);
  }, [searchQuery, typeFilter, dateFilter, pageSize]);

  // ---------- CRUD OPERATIONS ----------
  const addRecord = (values) => {
    const newId = Math.max(...data.map(d => d.id), 0) + 1;
    const dateObj = new Date(values.date);
    const newRecord = {
      ...values,
      id: newId,
      dateObj,
      status: 'Unverified',
      alerts: 0,
    };
    setData(prev => [newRecord, ...prev]);
    notifications.show({
      title: 'Added',
      message: `${values.brand} added successfully`,
      color: 'green',
      icon: <IconCheck size={18} />
    });
    addModalHandlers.close();
  };

  const updateRecord = (values) => {
    setData(prev => prev.map(item =>
      item.id === values.id ? { ...values, dateObj: new Date(values.date) } : item
    ));
    notifications.show({
      title: 'Updated',
      message: `${values.brand} updated`,
      color: 'blue',
      icon: <IconCheck size={18} />
    });
    editModalHandlers.close();
  };

  const deleteRecord = (id) => {
    setData(prev => prev.filter(item => item.id !== id));
    notifications.show({
      title: 'Deleted',
      message: 'Record removed',
      color: 'red',
      icon: <IconTrash size={18} />
    });
  };

  const toggleStatus = async (compositeId) => {
    const m = String(compositeId).match(/^(person|vehicle)-(.+)$/);
    if (!m) return;
    const [, caseType, mongoId] = m;
    const item = data.find((d) => d.id === compositeId);
    if (!item) return;
    const nextStatus = item.status === 'Resolved' ? 'Active' : 'Resolved';
    try {
      await adminFetch(`/admin/cases/${mongoId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ type: caseType, status: nextStatus }),
      });
      setData((prev) =>
        prev.map((row) => (row.id === compositeId ? { ...row, status: nextStatus } : row))
      );
      notifications.show({ title: 'Updated', message: `Status: ${nextStatus}`, color: 'green' });
    } catch (e) {
      console.error(e);
      notifications.show({ title: 'Error', message: 'Could not update case status', color: 'red' });
    }
  };

  // Export CSV
  const exportToCSV = () => {
    const headers = ['Brand/Name', 'Model', 'Registered By', 'Status', 'Plate', 'Date', 'Alerts'];
    const rows = filteredData.map(item => [
      item.brand,
      item.model,
      item.user,
      item.status,
      item.plate,
      item.date,
      item.alerts
    ]);
    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    notifications.show({
      title: 'Exported',
      message: `${filteredData.length} records exported`,
      color: 'green',
      icon: <IconFileSpreadsheet size={18} />
    });
  };

  // ---------- FORMS ----------
  const addForm = useForm({
    initialValues: {
      brand: '',
      model: 'Person',
      user: '',
      plate: '',
      date: formatDateForInput(new Date()),
    },
    validate: {
      brand: (v) => (!v ? 'Required' : null),
      model: (v) => (!v ? 'Required' : null),
      user: (v) => (!v ? 'Required' : null),
      date: (v) => (!v ? 'Required' : null),
    }
  });

  const editForm = useForm({
    initialValues: editingRecord || {},
    validate: {
      brand: (v) => (!v ? 'Required' : null),
      model: (v) => (!v ? 'Required' : null),
      user: (v) => (!v ? 'Required' : null),
      date: (v) => (!v ? 'Required' : null),
    }
  });

  useEffect(() => {
    if (editingRecord) {
      editForm.setValues({
        ...editingRecord,
        date: formatDateForInput(editingRecord.dateObj)
      });
      editForm.resetDirty();
    }
  }, [editingRecord]);

  if (loading) {
    return (
      <Box bg={mainBg} style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Loader size="xl" />
      </Box>
    );
  }

  return (
    <Box bg={mainBg} style={{ minHeight: '100vh' }} p="xl">
      {/* HEADER */}
      <Group justify="space-between" mb="xl">
        <Box>
          <Title order={2} fw={700} c={getTextColor(colorScheme, '#2B3674', theme.colors.gray[3])}>
            Data Management
          </Title>
          <Text size="sm" c="dimmed">Live data from API</Text>
        </Box>
        <Group bg={headerBg} p={8} style={{ borderRadius: '30px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <TextInput
            variant="unstyled"
            placeholder="Search records..."
            leftSection={<IconSearch size={18} color="gray" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            styles={{ input: { backgroundColor: 'transparent', height: '30px', width: '200px' } }}
          />
          <Tooltip label="Settings">
            <ActionIcon variant="subtle" color="gray"><IconSettings size={20} /></ActionIcon>
          </Tooltip>
          <Tooltip label="Notifications">
            <ActionIcon variant="subtle" color="red"><IconBell size={20} /></ActionIcon>
          </Tooltip>
          <Tooltip label="Refresh data">
            <ActionIcon variant="subtle" color="blue" onClick={fetchData}>
              <IconDownload size={20} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      {/* STATS CARDS */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg" mb="xl">
        {[
          { label: 'Total Records', value: stats.total, color: '#4318FF', icon: IconCar },
          { label: 'Verified', value: stats.verified, color: '#20C997', icon: IconCheck },
          { label: 'Unverified', value: stats.unverified, color: '#F59E0B', icon: IconX },
          { label: 'Active Alerts', value: stats.totalAlerts, color: '#FF6B6B', icon: IconAlertCircle }
        ].map((stat, i) => (
          <Paper key={i} p="md" radius="lg" bg={`linear-gradient(145deg, ${stat.color}, ${stat.color}DD)`} c="white" shadow="md">
            <Group justify="space-between" align="flex-start">
              <Box>
                <Text size="xl" fw={800} style={{ fontSize: '32px' }}>{stat.value}</Text>
                <Text size="sm" fw={500}>{stat.label}</Text>
              </Box>
              <stat.icon size={48} opacity={0.3} />
            </Group>
            <UnstyledButton
              w="100%"
              py={8}
              mt="md"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
              onClick={() => notifications.show({ message: `Showing ${stat.label.toLowerCase()}`, color: 'blue' })}
            >
              <Text size="xs" fw={600}>More info →</Text>
            </UnstyledButton>
          </Paper>
        ))}
      </SimpleGrid>

      {/* FILTER BAR + ACTIONS */}
      <Paper p="md" radius="lg" mb="md" shadow="xs" withBorder>
        <Group justify="space-between">
          <Group>
            <Select
              placeholder="Type"
              data={['All', 'Person', 'Car']}
              radius="md"
              w={120}
              value={typeFilter}
              onChange={setTypeFilter}
              clearable
            />
            <Select
              placeholder="Date"
              data={['All', 'Today', 'This Week', 'This Month']}
              radius="md"
              leftSection={<IconCalendar size={16} />}
              w={160}
              value={dateFilter}
              onChange={setDateFilter}
              clearable
            />
          </Group>
          <Group>
            <Button variant="outline" color="gray" leftSection={<IconDownload size={16} />} radius="md" onClick={exportToCSV}>
              Export
            </Button>
            <Button leftSection={<IconPlus size={16} />} bg="#2B3674" radius="md" onClick={addModalHandlers.open}>
              Add Record
            </Button>
          </Group>
        </Group>
      </Paper>

      {/* MAIN TABLE */}
      <Paper radius="lg" shadow="sm" withBorder style={{ overflow: 'hidden' }}>
        <Table.ScrollContainer minWidth={1000}>
          <Table verticalSpacing="md" highlightOnHover striped>
            <Table.Thead bg="#4318FF">
              <Table.Tr>
                <Table.Th c="white">Brand / Name</Table.Th>
                <Table.Th c="white">Model</Table.Th>
                <Table.Th c="white">Registered By</Table.Th>
                <Table.Th c="white">Status</Table.Th>
                <Table.Th c="white">Plate No</Table.Th>
                <Table.Th c="white">Date</Table.Th>
                <Table.Th c="white">Alerts</Table.Th>
                <Table.Th c="white" style={{ width: 120 }}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {paginatedData.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={8}>
                    <Text ta="center" py="xl" c="dimmed">No records found</Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                paginatedData.map((item) => (
                  <Table.Tr key={item.id}>
                    <Table.Td>
                      <Group gap="sm">
                        <Avatar size="sm" color="blue" radius="xl">{item.brand[0]}</Avatar>
                        <Text size="sm" fw={600}>{item.brand}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">{item.model}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{item.user}</Text>  {/* Now safely a string */}
                    </Table.Td>
                    <Table.Td>
                      <Badge color={item.status === 'Verified' ? 'green' : 'gray'} variant="light" radius="xl">
                        {item.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" fw="monospace">{item.plate}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{item.date}</Text>
                    </Table.Td>
                    <Table.Td>
                      {item.alerts > 0 ? (
                        <Badge color="red" variant="filled" radius="xl">{item.alerts}</Badge>
                      ) : (
                        <Badge color="gray" variant="light">0</Badge>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4} justify="flex-end">
                        <Tooltip label="Quick view">
                          <ActionIcon variant="subtle" color="blue" onClick={() => {
                            setViewingRecord(item);
                            viewModalHandlers.open();
                          }}>
                            <IconEye size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Edit">
                          <ActionIcon variant="subtle" color="gray" onClick={() => {
                            setEditingRecord(item);
                            editModalHandlers.open();
                          }}>
                            <IconEdit size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Menu shadow="md" width={160} position="bottom-end">
                          <Menu.Target>
                            <ActionIcon variant="subtle" color="gray">
                              <IconDotsVertical size={16} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item
                              leftSection={item.status === 'Verified' ? <IconX size={14} /> : <IconCheck size={14} />}
                              onClick={() => toggleStatus(item.id)}
                            >
                              {item.status === 'Verified' ? 'Unverify' : 'Verify'}
                            </Menu.Item>
                            <Menu.Item
                              color="red"
                              leftSection={<IconTrash size={14} />}
                              onClick={() => deleteRecord(item.id)}
                            >
                              Delete
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                        <Tooltip label="Full details">
                          <Link href={`/admin/registered_data/${item.id}`} passHref>
                            <ActionIcon component="a" variant="filled" color="blue" size="md" style={{ marginLeft: 4 }}>
                              <IconChevronRight size={16} />
                            </ActionIcon>
                          </Link>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>

        {/* PAGINATION */}
        <Group justify="space-between" p="md" bg={footerBg}>
          <Group gap="xs">
            <Text size="sm" c="dimmed">Rows per page</Text>
            <Select
              size="xs"
              w={70}
              data={['5', '10', '20']}
              value={pageSize}
              onChange={(val) => setPageSize(val || '10')}
            />
            <Text size="sm" c="dimmed">
              {filteredData.length} {filteredData.length === 1 ? 'record' : 'records'}
            </Text>
          </Group>
          <Pagination
            total={totalPages}
            value={activePage}
            onChange={setActivePage}
            size="sm"
            radius="xl"
            color="blue"
          />
        </Group>
      </Paper>

      {/* MODALS */}
      <Modal opened={addModalOpened} onClose={addModalHandlers.close} title={<Text fw={700} size="lg">Add New Record</Text>} centered size="lg" radius="md">
        <form onSubmit={addForm.onSubmit(addRecord)}>
          <Stack gap="sm">
            <Grid>
              <Grid.Col span={6}>
                <TextInput label="Brand / Name" placeholder="e.g. Toyota" {...addForm.getInputProps('brand')} required />
              </Grid.Col>
              <Grid.Col span={6}>
                <Select label="Model" placeholder="Select model" data={['Person', 'Car']} {...addForm.getInputProps('model')} required />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput label="Registered By" placeholder="Username" {...addForm.getInputProps('user')} required />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput label="Plate Number" placeholder="ABC-123" {...addForm.getInputProps('plate')} />
              </Grid.Col>
              <Grid.Col span={12}>
                <TextInput label="Date" type="date" {...addForm.getInputProps('date')} required />
              </Grid.Col>
            </Grid>
            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={addModalHandlers.close}>Cancel</Button>
              <Button type="submit" bg="#2B3674">Add Record</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Modal opened={editModalOpened} onClose={editModalHandlers.close} title={<Text fw={700} size="lg">Edit Record</Text>} centered size="lg" radius="md">
        {editingRecord && (
          <form onSubmit={editForm.onSubmit(updateRecord)}>
            <Stack gap="sm">
              <Grid>
                <Grid.Col span={6}>
                  <TextInput label="Brand / Name" {...editForm.getInputProps('brand')} required />
                </Grid.Col>
                <Grid.Col span={6}>
                  <Select label="Model" data={['Person', 'Car']} {...editForm.getInputProps('model')} required />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput label="Registered By" {...editForm.getInputProps('user')} required />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput label="Plate Number" {...editForm.getInputProps('plate')} />
                </Grid.Col>
                <Grid.Col span={12}>
                  <TextInput label="Date" type="date" {...editForm.getInputProps('date')} required />
                </Grid.Col>
              </Grid>
              <Group justify="space-between" mt="md">
                <Button color="red" variant="light" leftSection={<IconTrash size={16} />} onClick={() => { deleteRecord(editingRecord.id); editModalHandlers.close(); }}>
                  Delete
                </Button>
                <Group>
                  <Button variant="subtle" onClick={editModalHandlers.close}>Cancel</Button>
                  <Button type="submit" bg="#2B3674">Update</Button>
                </Group>
              </Group>
            </Stack>
          </form>
        )}
      </Modal>

      <Modal opened={viewModalOpened} onClose={viewModalHandlers.close} title={<Text fw={700} size="lg">Record Details</Text>} centered size="lg" radius="md">
        {viewingRecord && (
          <Stack gap="md">
            <Group gap="xl">
              <Avatar size={80} radius="xl" color="blue">{viewingRecord.brand[0]}</Avatar>
              <Box>
                <Text fw={700} size="xl">{viewingRecord.brand}</Text>
                <Text size="sm" c="dimmed">{viewingRecord.model}</Text>
              </Box>
            </Group>
            <Divider />
            <Grid>
              <Grid.Col span={6}>
                <Text size="sm" c="dimmed">Registered By</Text>
                <Text>{viewingRecord.user}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="sm" c="dimmed">Status</Text>
                <Badge color={viewingRecord.status === 'Verified' ? 'green' : 'gray'}>{viewingRecord.status}</Badge>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="sm" c="dimmed">Plate Number</Text>
                <Text>{viewingRecord.plate}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="sm" c="dimmed">Date</Text>
                <Text>{viewingRecord.date}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="sm" c="dimmed">Alerts</Text>
                <Badge color={viewingRecord.alerts > 0 ? 'red' : 'gray'}>{viewingRecord.alerts}</Badge>
              </Grid.Col>
            </Grid>
            <Group justify="flex-end">
              <Button variant="light" leftSection={<IconEdit size={16} />} onClick={() => {
                viewModalHandlers.close();
                setEditingRecord(viewingRecord);
                editModalHandlers.open();
              }}>
                Edit Record
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Box>
  );
}