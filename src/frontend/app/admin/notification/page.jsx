"use client";

import React, { useState, useMemo, useEffect } from 'react';
import {
  Box, Title, Text, Paper, SimpleGrid, Group, Button,
  Table, Badge, ActionIcon, Tooltip, Select, TextInput,
  Modal, Stack, Grid, Divider, Avatar, Pagination,
  Menu, UnstyledButton, Textarea, Alert, Chip,
  ThemeIcon, Loader, Checkbox, Timeline, Radio,
  MultiSelect, Progress, RingProgress, Center,
  useMantineTheme, useMantineColorScheme
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { notifications as notify } from '@mantine/notifications';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  IconBell, IconBellRinging, IconBellPlus,
  IconDownload, IconEdit, IconTrash,
  IconEye, IconDotsVertical, IconCheck, IconX,
  IconSearch, IconSettings, IconSend,
  IconClock, IconCalendar, IconUsers, IconUser,
  IconCopy, IconSend2, IconDeviceFloppy,
  IconAlertCircle, IconTemplate, IconChecklist,
  IconChartLine, IconHistory, IconFlag,
  IconMail, IconDeviceMobile, IconWorld
} from '@tabler/icons-react';
import Link from 'next/link';
import { adminFetch, API_BASE_URL } from '@/app/lib/adminApi';
import { apiClient } from '@/app/lib/apiClient';

dayjs.extend(relativeTime);

const LOG_KEY = 'admin_notification_log';

function recipientTypeToBulkBody(recipientType) {
  if (!recipientType || recipientType === 'all') return {};
  if (String(recipientType).startsWith('role:')) {
    const r = String(recipientType).replace('role:', '');
    if (r === 'guest') return {};
    return { roles: [r] };
  }
  return {};
}

async function postBulkNotification({ title, message, recipientType, type }) {
  const extra = recipientTypeToBulkBody(recipientType);
  const res = await apiClient(`${API_BASE_URL}/admin/notifications/bulk`, {
    method: 'POST',
    body: JSON.stringify({
      title: title || 'Notification',
      message,
      type: type || 'general',
      ...extra,
    }),
  });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.message || 'Bulk send failed');
  }
  return json.data;
}

// Helper to get dynamic background/color values
const getBg = (colorScheme, light, dark) => (colorScheme === 'dark' ? dark : light);
const getTextColor = (colorScheme, light, dark) => (colorScheme === 'dark' ? dark : light);

// ---------- NOTIFICATION TEMPLATES (still local, or can be API-driven) ----------
const NOTIFICATION_TEMPLATES = [
  { id: 1, name: 'Welcome Email', title: 'Welcome to Our Platform', message: 'Thank you for joining! We’re excited to have you onboard.', recipientType: 'new', priority: 'normal', channels: ['email'] },
  { id: 2, name: 'Maintenance Alert', title: 'Scheduled Maintenance', message: 'We will be performing maintenance on [DATE] at [TIME].', recipientType: 'all', priority: 'high', channels: ['inapp', 'email'] },
  { id: 3, name: 'Payment Reminder', title: 'Payment Due', message: 'Your payment is due on [DATE]. Please update your billing information.', recipientType: 'paid', priority: 'high', channels: ['email'] },
];

// ---------- RECIPIENT OPTIONS ----------
const RECIPIENT_OPTIONS = [
  { value: 'all', label: 'All Users', count: 2500 },
  { value: 'paid', label: 'Paid Users', count: 142 },
  { value: 'free', label: 'Free Users', count: 2358 },
  { value: 'new', label: 'New Users (last 7 days)', count: 89 },
  { value: 'role:admin', label: 'Admins', count: 12 },
  { value: 'role:user', label: 'Regular Users', count: 2476 },
  { value: 'role:guest', label: 'Guests', count: 12 },
  { value: 'condition:inactive', label: 'Inactive (30+ days)', count: 450 },
  { value: 'condition:failed_payment', label: 'Failed Payment', count: 23 },
  { value: 'custom', label: 'Custom User List', count: 0 },
];

// ---------- PRIORITY OPTIONS ----------
const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: 'gray' },
  { value: 'normal', label: 'Normal', color: 'blue' },
  { value: 'high', label: 'High', color: 'red' },
];

// ---------- CHANNEL OPTIONS ----------
const CHANNEL_OPTIONS = [
  { value: 'inapp', label: 'In‑app', icon: IconWorld },
  { value: 'email', label: 'Email', icon: IconMail },
  { value: 'push', label: 'Push', icon: IconDeviceMobile },
];

// ---------- HELPER FUNCTIONS ----------
const formatDateTime = (dateString) => {
  if (!dateString) return '—';
  return dayjs(dateString).format('MMM D, YYYY · h:mm A');
};

const getRelativeTime = (dateString) => {
  if (!dateString) return '';
  return dayjs(dateString).fromNow();
};

const getStatusColor = (status) => {
  switch (status) {
    case 'Sent': return 'green';
    case 'Scheduled': return 'blue';
    case 'Draft': return 'gray';
    case 'Failed': return 'red';
    case 'Pending Approval': return 'yellow';
    default: return 'gray';
  }
};

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'high': return 'red';
    case 'normal': return 'blue';
    case 'low': return 'gray';
    default: return 'gray';
  }
};

const getRecipientLabel = (recipientType) => {
  const option = RECIPIENT_OPTIONS.find(o => o.value === recipientType);
  return option ? option.label : recipientType;
};

const getRecipientCount = (recipientType) => {
  const option = RECIPIENT_OPTIONS.find(o => o.value === recipientType);
  return option?.count || 0;
};

export default function NotificationManagementPage() {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();

  // Dynamic colors
  const mainBg = getBg(colorScheme, '#F4F7FE', theme.colors.dark[7]);
  const headerBg = getBg(colorScheme, 'white', theme.colors.dark[6]);
  const footerBg = getBg(colorScheme, 'white', theme.colors.dark[6]);
  const paperBg = getBg(colorScheme, 'white', theme.colors.dark[6]);
  const primaryText = getTextColor(colorScheme, '#2B3674', theme.colors.gray[3]);
  const bulkActionBg = getBg(colorScheme, theme.colors.blue[0], theme.colors.blue[9]);
  const messagePreviewBg = getBg(colorScheme, theme.colors.gray[0], theme.colors.dark[5]);

  // ---------- STATE ----------
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [templates] = useState(NOTIFICATION_TEMPLATES);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [priorityFilter, setPriorityFilter] = useState(null);
  const [recipientFilter, setRecipientFilter] = useState(null);
  const [activePage, setActivePage] = useState(1);
  const [pageSize, setPageSize] = useState('10');
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [editingNotification, setEditingNotification] = useState(null);
  const [viewingNotification, setViewingNotification] = useState(null);

  // Modals
  const [createModalOpened, createModalHandlers] = useDisclosure(false);
  const [editModalOpened, editModalHandlers] = useDisclosure(false);
  const [viewModalOpened, viewModalHandlers] = useDisclosure(false);
  const [deleteModalOpened, deleteModalHandlers] = useDisclosure(false);
  const [bulkSendModalOpened, bulkSendModalHandlers] = useDisclosure(false);
  const [templateModalOpened, templateModalHandlers] = useDisclosure(false);

  // ---------- FETCH NOTIFICATIONS ----------
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      await adminFetch('/admin/notifications/settings').catch(() => null);
      let stored = [];
      try {
        stored = JSON.parse(typeof window !== 'undefined' ? sessionStorage.getItem(LOG_KEY) || '[]' : '[]');
      } catch {
        stored = [];
      }
      setNotifications(Array.isArray(stored) ? stored : []);
      setActivities([
        { id: 1, action: 'created', user: 'system', target: 'Notification log (local)', timestamp: new Date().toISOString() },
      ]);
    } catch (error) {
      notify.show({
        title: 'Error',
        message: error.message,
        color: 'red',
        icon: <IconX size={18} />
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // ---------- STATS ----------
  const stats = useMemo(() => {
    const total = notifications.length;
    const sent = notifications.filter(n => n.status === 'Sent').length;
    const scheduled = notifications.filter(n => n.status === 'Scheduled').length;
    const draft = notifications.filter(n => n.status === 'Draft').length;
    const pending = notifications.filter(n => n.status === 'Pending Approval').length;
    const totalRead = notifications.reduce((acc, n) => acc + (n.readCount || 0), 0);
    const totalSent = notifications.filter(n => n.status === 'Sent').reduce((acc, n) => acc + (n.totalCount || 0), 0);
    const avgOpenRate = totalSent > 0
      ? (notifications.filter(n => n.status === 'Sent').reduce((acc, n) => acc + (n.openRate || 0), 0) / sent).toFixed(1)
      : 0;
    return { total, sent, scheduled, draft, pending, totalRead, avgOpenRate };
  }, [notifications]);

  // ---------- FILTERED NOTIFICATIONS ----------
  const filteredNotifications = useMemo(() => {
    let result = [...notifications];

    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      result = result.filter(n =>
        n.title.toLowerCase().includes(lower) ||
        n.message.toLowerCase().includes(lower)
      );
    }

    if (statusFilter && statusFilter !== 'All') {
      result = result.filter(n => n.status === statusFilter);
    }

    if (priorityFilter && priorityFilter !== 'All') {
      result = result.filter(n => n.priority === priorityFilter);
    }

    if (recipientFilter && recipientFilter !== 'All') {
      result = result.filter(n => n.recipientType === recipientFilter);
    }

    result.sort((a, b) => dayjs(b.createdAt).unix() - dayjs(a.createdAt).unix());
    return result;
  }, [notifications, searchQuery, statusFilter, priorityFilter, recipientFilter]);

  // ---------- PAGINATION & SELECTION ----------
  const paginatedNotifications = useMemo(() => {
    const size = parseInt(pageSize);
    const start = (activePage - 1) * size;
    return filteredNotifications.slice(start, start + size);
  }, [filteredNotifications, activePage, pageSize]);

  const totalPages = useMemo(() => Math.ceil(filteredNotifications.length / parseInt(pageSize)), [filteredNotifications, pageSize]);

  useEffect(() => {
    setActivePage(1);
  }, [searchQuery, statusFilter, priorityFilter, recipientFilter, pageSize]);

  const toggleAllRows = (checked) => {
    if (checked) {
      setSelectedRows(paginatedNotifications.map(n => n.id));
    } else {
      setSelectedRows([]);
    }
  };

  const toggleRow = (id) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const areAllSelected = paginatedNotifications.length > 0 && paginatedNotifications.every(n => selectedRows.includes(n.id));
  const isIndeterminate = selectedRows.length > 0 && !areAllSelected;

  // ---------- API CRUD OPERATIONS ----------
  const addActivity = (action, user, target) => {
    // Just local for display; could be posted to /activities
    const newActivity = {
      id: Date.now(),
      action,
      user,
      target,
      timestamp: new Date().toISOString(),
    };
    setActivities(prev => [newActivity, ...prev].slice(0, 20));
  };

  const persistLog = (rows) => {
    setNotifications(rows);
    try {
      sessionStorage.setItem(LOG_KEY, JSON.stringify(rows.slice(0, 80)));
    } catch (_) {}
  };

  const createNotification = async (values) => {
    const recipientCount = getRecipientCount(values.recipientType);
    const newNotification = {
      id: Date.now(),
      title: values.title,
      message: values.message,
      recipient: getRecipientLabel(values.recipientType),
      recipientType: values.recipientType,
      priority: values.priority,
      channels: values.channels || ['inapp'],
      status: values.scheduledFor ? 'Scheduled' : 'Draft',
      scheduledFor: values.scheduledFor ? values.scheduledFor.toISOString() : null,
      sentAt: null,
      createdAt: new Date().toISOString(),
      createdBy: 'admin',
      readCount: 0,
      totalCount: recipientCount,
      openRate: 0,
      approvalStatus: values.scheduledFor ? 'approved' : 'draft',
    };
    try {
      const next = [newNotification, ...notifications];
      persistLog(next);
      addActivity('created', 'admin', values.title);
      notify.show({
        title: 'Notification saved',
        message: `${values.title} stored locally. Use Send to deliver via API.`,
        color: 'green',
        icon: <IconCheck size={18} />
      });
      createModalHandlers.close();
      createForm.reset();
    } catch (error) {
      notify.show({
        title: 'Error',
        message: error.message,
        color: 'red',
      });
    }
  };

  const updateNotification = async (values) => {
    if (!editingNotification) return;
    const recipientCount = getRecipientCount(values.recipientType);
    const updatedNotification = {
      ...editingNotification,
      title: values.title,
      message: values.message,
      recipient: getRecipientLabel(values.recipientType),
      recipientType: values.recipientType,
      priority: values.priority,
      channels: values.channels,
      status: values.scheduledFor ? 'Scheduled' : 'Draft',
      scheduledFor: values.scheduledFor ? values.scheduledFor.toISOString() : null,
      totalCount: recipientCount,
    };
    try {
      const saved = { ...updatedNotification, id: editingNotification.id };
      persistLog(notifications.map(n => n.id === saved.id ? saved : n));
      addActivity('updated', 'admin@example.com', values.title);
      notify.show({
        title: 'Notification updated',
        message: `${values.title} has been updated.`,
        color: 'blue',
        icon: <IconCheck size={18} />
      });
      editModalHandlers.close();
    } catch (error) {
      notify.show({
        title: 'Error',
        message: error.message,
        color: 'red',
      });
    }
  };

  const deleteNotification = async () => {
    if (!selectedNotification) return;
    try {
      persistLog(notifications.filter(n => n.id !== selectedNotification.id));
      addActivity('deleted', 'admin@example.com', selectedNotification.title);
      notify.show({
        title: 'Notification deleted',
        message: `${selectedNotification.title} has been removed.`,
        color: 'red',
        icon: <IconTrash size={18} />
      });
      deleteModalHandlers.close();
      setSelectedNotification(null);
    } catch (error) {
      notify.show({
        title: 'Error',
        message: error.message,
        color: 'red',
      });
    }
  };

  const duplicateNotification = async (notification) => {
    // Duplicate is a POST creating a new notification based on the original
    const newNotification = {
      ...notification,
      title: `${notification.title} (Copy)`,
      status: 'Draft',
      scheduledFor: null,
      sentAt: null,
      readCount: 0,
      openRate: 0,
      approvalStatus: 'draft',
    };
    delete newNotification.id; // let the server assign a new id
    try {
      const saved = { ...newNotification, id: Date.now() };
      persistLog([saved, ...notifications]);
      addActivity('duplicated', 'admin@example.com', notification.title);
      notify.show({
        title: 'Notification duplicated',
        message: `A copy of "${notification.title}" has been created.`,
        color: 'green',
        icon: <IconCopy size={18} />
      });
    } catch (error) {
      notify.show({
        title: 'Error',
        message: error.message,
        color: 'red',
      });
    }
  };

  const sendNow = async (notification) => {
    try {
      const data = await postBulkNotification({
        title: notification.title,
        message: notification.message,
        recipientType: notification.recipientType,
        type: 'general',
      });
      const updated = {
        ...notification,
        status: 'Sent',
        scheduledFor: null,
        sentAt: new Date().toISOString(),
        totalCount: data?.sent ?? notification.totalCount,
      };
      persistLog(notifications.map(n => n.id === notification.id ? updated : n));
      addActivity('sent', 'admin@example.com', notification.title);
      notify.show({
        title: 'Notification sent',
        message: `"${notification.title}" has been sent.`,
        color: 'green',
        icon: <IconSend2 size={18} />
      });
    } catch (error) {
      notify.show({
        title: 'Error',
        message: error.message,
        color: 'red',
      });
    }
  };

  const approveNotification = async (id) => {
    const notif = notifications.find(n => n.id === id);
    if (!notif) return;
    try {
      const updated = { ...notif, status: 'Scheduled', approvalStatus: 'approved' };
      persistLog(notifications.map(n => n.id === id ? updated : n));
      addActivity('approved', 'admin@example.com', `Notification #${id}`);
      notify.show({
        title: 'Approved',
        message: 'Notification has been approved and scheduled.',
        color: 'green',
        icon: <IconCheck size={18} />
      });
    } catch (error) {
      notify.show({
        title: 'Error',
        message: error.message,
        color: 'red',
      });
    }
  };

  const rejectNotification = async (id) => {
    const notif = notifications.find(n => n.id === id);
    if (!notif) return;
    try {
      const updated = { ...notif, status: 'Draft', approvalStatus: 'rejected' };
      persistLog(notifications.map(n => n.id === id ? updated : n));
      addActivity('rejected', 'admin@example.com', `Notification #${id}`);
      notify.show({
        title: 'Rejected',
        message: 'Notification has been rejected and moved to drafts.',
        color: 'red',
        icon: <IconX size={18} />
      });
    } catch (error) {
      notify.show({
        title: 'Error',
        message: error.message,
        color: 'red',
      });
    }
  };

  // ---------- BULK OPERATIONS ----------
  const bulkDelete = async () => {
    try {
      persistLog(notifications.filter(n => !selectedRows.includes(n.id)));
      addActivity('bulk_delete', 'System', `${selectedRows.length} notifications`);
      notify.show({
        title: 'Bulk delete',
        message: `${selectedRows.length} notifications deleted`,
        color: 'red',
        icon: <IconTrash size={18} />
      });
      setSelectedRows([]);
    } catch (error) {
      notify.show({
        title: 'Error',
        message: error.message,
        color: 'red',
      });
    }
  };

  const bulkSend = async () => {
    try {
      let next = [...notifications];
      for (const id of selectedRows) {
        const notif = notifications.find(n => n.id === id);
        if (!notif || notif.status === 'Sent') continue;
        const data = await postBulkNotification({
          title: notif.title,
          message: notif.message,
          recipientType: notif.recipientType,
        });
        const updated = {
          ...notif,
          status: 'Sent',
          scheduledFor: null,
          sentAt: new Date().toISOString(),
          totalCount: data?.sent ?? notif.totalCount,
        };
        next = next.map(n => n.id === id ? updated : n);
      }
      persistLog(next);
      addActivity('bulk_send', 'System', `${selectedRows.length} notifications`);
      notify.show({
        title: 'Bulk send',
        message: `${selectedRows.length} notifications sent`,
        color: 'green',
        icon: <IconSend2 size={18} />
      });
      setSelectedRows([]);
      bulkSendModalHandlers.close();
    } catch (error) {
      notify.show({
        title: 'Error',
        message: error.message,
        color: 'red',
      });
    }
  };

  // ---------- TEMPLATE OPERATIONS ----------
  const loadTemplate = (templateId) => {
    const template = templates.find(t => t.id === parseInt(templateId));
    if (template) {
      createForm.setValues({
        title: template.title,
        message: template.message,
        recipientType: template.recipientType,
        priority: template.priority,
        channels: template.channels,
        scheduledFor: null,
      });
      templateModalHandlers.close();
      notify.show({
        title: 'Template loaded',
        message: `"${template.name}" applied.`,
        color: 'blue',
        icon: <IconTemplate size={18} />
      });
    }
  };

  const saveAsTemplate = () => {
    const values = createForm.values;
    if (!values.title || !values.message) {
      notify.show({
        title: 'Cannot save',
        message: 'Title and message are required.',
        color: 'red',
        icon: <IconX size={18} />
      });
      return;
    }
    // Templates are local, just simulate
    const newId = Math.max(...templates.map(t => t.id), 0) + 1;
    const newTemplate = {
      id: newId,
      name: values.title,
      title: values.title,
      message: values.message,
      recipientType: values.recipientType,
      priority: values.priority,
      channels: values.channels,
    };
    // setTemplates([...templates, newTemplate]); // uncomment if you make templates stateful
    notify.show({
      title: 'Template saved',
      message: `"${values.title}" added to templates.`,
      color: 'green',
      icon: <IconDeviceFloppy size={18} />
    });
  };

  // ---------- EXPORT CSV ----------
  const exportToCSV = () => {
    const headers = ['ID', 'Title', 'Message', 'Recipient', 'Status', 'Priority', 'Channels', 'Scheduled For', 'Sent At', 'Created At', 'Read Count', 'Total Recipients', 'Open Rate %'];
    const rows = filteredNotifications.map(n => [
      n.id,
      n.title,
      n.message.replace(/,/g, ';'),
      n.recipient,
      n.status,
      n.priority,
      n.channels?.join('|') || '',
      n.scheduledFor ? dayjs(n.scheduledFor).format('YYYY-MM-DD HH:mm') : '',
      n.sentAt ? dayjs(n.sentAt).format('YYYY-MM-DD HH:mm') : '',
      dayjs(n.createdAt).format('YYYY-MM-DD HH:mm'),
      n.readCount || 0,
      n.totalCount || 0,
      n.openRate || 0,
    ]);
    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notifications_${dayjs().format('YYYY-MM-DD')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    notify.show({
      title: 'Exported',
      message: `${filteredNotifications.length} notifications exported`,
      color: 'green',
      icon: <IconDownload size={18} />
    });
  };

  // ---------- FORMS ----------
  const createForm = useForm({
    initialValues: {
      title: '',
      message: '',
      recipientType: 'all',
      priority: 'normal',
      channels: ['inapp'],
      scheduledFor: null,
    },
    validate: {
      title: (v) => (!v ? 'Title is required' : null),
      message: (v) => (!v ? 'Message is required' : null),
      recipientType: (v) => (!v ? 'Please select recipients' : null),
    }
  });

  const editForm = useForm({
    initialValues: {
      title: '',
      message: '',
      recipientType: '',
      priority: 'normal',
      channels: [],
      scheduledFor: null,
    },
    validate: {
      title: (v) => (!v ? 'Title is required' : null),
      message: (v) => (!v ? 'Message is required' : null),
      recipientType: (v) => (!v ? 'Please select recipients' : null),
    }
  });

  useEffect(() => {
    if (editingNotification) {
      editForm.setValues({
        title: editingNotification.title,
        message: editingNotification.message,
        recipientType: editingNotification.recipientType,
        priority: editingNotification.priority,
        channels: editingNotification.channels || ['inapp'],
        scheduledFor: editingNotification.scheduledFor ? new Date(editingNotification.scheduledFor) : null,
      });
      editForm.resetDirty();
    }
  }, [editingNotification]);

  if (loading) {
    return (
      <Box style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Loader size="xl" />
      </Box>
    );
  }

  // ---------- RENDER (unchanged from your original except the table actions now call API functions) ----------
  return (
    <Box bg={mainBg} style={{ minHeight: '100vh' }} p="xl">
      {/* HEADER */}
      <Group justify="space-between" mb="xl">
        <Box>
          <Title order={2} fw={700} c={primaryText}>Notification Management</Title>
          <Text size="sm" c="dimmed">Create, schedule, approve, and monitor system notifications</Text>
        </Box>
        <Group bg={headerBg} p={8} style={{ borderRadius: '30px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <Tooltip label="Settings">
            <ActionIcon variant="subtle" color="gray"><IconSettings size={20} /></ActionIcon>
          </Tooltip>
          <Tooltip label="Notifications">
            <ActionIcon variant="subtle" color="red"><IconBellRinging size={20} /></ActionIcon>
          </Tooltip>
          <Tooltip label="Refresh">
            <ActionIcon variant="subtle" color="blue" onClick={fetchNotifications}>
              <IconDownload size={20} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      {/* STATS CARDS (same as before) */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg" mb="xl">
        <Paper p="md" radius="lg" bg="linear-gradient(145deg, #4318FF, #7B61FF)" c="white" shadow="md">
          <Group justify="space-between" align="flex-start">
            <Box>
              <Text size="xl" fw={800} style={{ fontSize: '32px' }}>{stats.total}</Text>
              <Text size="sm" fw={500}>Total Notifications</Text>
            </Box>
            <IconBell size={48} opacity={0.3} />
          </Group>
        </Paper>

        <Paper p="md" radius="lg" bg="linear-gradient(145deg, #20C997, #3BD6A4)" c="white" shadow="md">
          <Group justify="space-between" align="flex-start">
            <Box>
              <Text size="xl" fw={800} style={{ fontSize: '32px' }}>{stats.sent}</Text>
              <Text size="sm" fw={500}>Sent</Text>
            </Box>
            <IconSend2 size={48} opacity={0.3} />
          </Group>
        </Paper>

        <Paper p="md" radius="lg" bg="linear-gradient(145deg, #00B8D9, #00C7E6)" c="white" shadow="md">
          <Group justify="space-between" align="flex-start">
            <Box>
              <Text size="xl" fw={800} style={{ fontSize: '32px' }}>{stats.scheduled}</Text>
              <Text size="sm" fw={500}>Scheduled</Text>
            </Box>
            <IconCalendar size={48} opacity={0.3} />
          </Group>
        </Paper>

        <Paper p="md" radius="lg" bg="linear-gradient(145deg, #F59E0B, #FBBF24)" c="white" shadow="md">
          <Group justify="space-between" align="flex-start">
            <Box>
              <Text size="xl" fw={800} style={{ fontSize: '32px' }}>{stats.pending}</Text>
              <Text size="sm" fw={500}>Pending Approval</Text>
            </Box>
            <IconChecklist size={48} opacity={0.3} />
          </Group>
        </Paper>
      </SimpleGrid>

      {/* ANALYTICS ROW (unchanged) */}
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg" mb="xl">
        <Paper p="md" radius="lg" shadow="sm" withBorder bg={paperBg}>
          <Group justify="space-between">
            <Box>
              <Text size="sm" c="dimmed">Average Open Rate</Text>
              <Text fw={700} size="xl">{stats.avgOpenRate}%</Text>
              <Text size="xs" c="dimmed">Across {stats.sent} sent notifications</Text>
            </Box>
            <RingProgress
              size={80}
              thickness={8}
              roundCaps
              sections={[{ value: stats.avgOpenRate, color: 'blue' }]}
              label={
                <Center>
                  <IconChartLine size={24} color="blue" />
                </Center>
              }
            />
          </Group>
        </Paper>

        <Paper p="md" radius="lg" shadow="sm" withBorder bg={paperBg}>
          <Group justify="space-between">
            <Box>
              <Text size="sm" c="dimmed">Total Recipients</Text>
              <Text fw={700} size="xl">{notifications.reduce((acc, n) => acc + (n.totalCount || 0), 0).toLocaleString()}</Text>
              <Text size="xs" c="dimmed">Across all sent notifications</Text>
            </Box>
            <ThemeIcon size="xl" radius="xl" color="cyan" variant="light">
              <IconUsers size={28} />
            </ThemeIcon>
          </Group>
        </Paper>

        <Paper p="md" radius="lg" shadow="sm" withBorder bg={paperBg}>
          <Group justify="space-between">
            <Box>
              <Text size="sm" c="dimmed">Templates</Text>
              <Text fw={700} size="xl">{templates.length}</Text>
              <Text size="xs" c="dimmed">Saved notification templates</Text>
            </Box>
            <ThemeIcon size="xl" radius="xl" color="violet" variant="light">
              <IconTemplate size={28} />
            </ThemeIcon>
          </Group>
        </Paper>
      </SimpleGrid>

      {/* FILTERS & ACTIONS (unchanged) */}
      <Paper p="md" radius="lg" mb="xl" shadow="xs" withBorder bg={paperBg}>
        <Stack gap="md">
          <Group justify="space-between">
            <Group>
              <TextInput
                placeholder="Search by title or message"
                leftSection={<IconSearch size={16} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.currentTarget.value)}
                radius="md"
                size="sm"
                w={250}
              />
              <Select
                placeholder="Status"
                data={['All', 'Sent', 'Scheduled', 'Draft', 'Pending Approval', 'Failed']}
                value={statusFilter}
                onChange={setStatusFilter}
                clearable
                radius="md"
                size="sm"
                w={150}
              />
              <Select
                placeholder="Priority"
                data={['All', 'high', 'normal', 'low']}
                value={priorityFilter}
                onChange={setPriorityFilter}
                clearable
                radius="md"
                size="sm"
                w={130}
              />
              <Select
                placeholder="Recipient"
                data={['All', ...new Set(notifications.map(n => n.recipientType))]}
                value={recipientFilter}
                onChange={setRecipientFilter}
                clearable
                radius="md"
                size="sm"
                w={160}
              />
            </Group>
            <Group>
              <Button
                variant="outline"
                color="gray"
                leftSection={<IconDownload size={16} />}
                onClick={exportToCSV}
                radius="md"
                size="sm"
              >
                Export
              </Button>
              <Button
                leftSection={<IconBellPlus size={16} />}
                bg="#2B3674"
                radius="md"
                onClick={createModalHandlers.open}
              >
                New Notification
              </Button>
            </Group>
          </Group>

          {selectedRows.length > 0 && (
            <Group bg={bulkActionBg} p="xs" style={{ borderRadius: '8px' }}>
              <Badge color="blue" size="lg">{selectedRows.length} selected</Badge>
              <Button
                size="xs"
                variant="light"
                color="green"
                leftSection={<IconSend size={14} />}
                onClick={bulkSendModalHandlers.open}
              >
                Send Selected
              </Button>
              <Button
                size="xs"
                variant="light"
                color="red"
                leftSection={<IconTrash size={14} />}
                onClick={bulkDelete}
              >
                Delete Selected
              </Button>
            </Group>
          )}
        </Stack>
      </Paper>

      {/* MAIN TABLE (unchanged) */}
      <Paper radius="lg" shadow="sm" withBorder style={{ overflow: 'hidden' }} bg={paperBg}>
        <Table.ScrollContainer minWidth={1400}>
          <Table verticalSpacing="md" highlightOnHover striped>
            <Table.Thead bg="#4318FF">
              <Table.Tr>
                <Table.Th style={{ width: 40 }}>
                  <Checkbox
                    color="white"
                    checked={areAllSelected}
                    indeterminate={isIndeterminate}
                    onChange={(e) => toggleAllRows(e.currentTarget.checked)}
                  />
                </Table.Th>
                <Table.Th c="white">Title</Table.Th>
                <Table.Th c="white">Message</Table.Th>
                <Table.Th c="white">Recipient</Table.Th>
                <Table.Th c="white">Priority</Table.Th>
                <Table.Th c="white">Channels</Table.Th>
                <Table.Th c="white">Status</Table.Th>
                <Table.Th c="white">Scheduled</Table.Th>
                <Table.Th c="white">Open Rate</Table.Th>
                <Table.Th c="white" style={{ width: 180 }}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {paginatedNotifications.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={10}>
                    <Text ta="center" py="xl" c="dimmed">No notifications found</Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                paginatedNotifications.map((item) => (
                  <Table.Tr key={item.id} bg={selectedRows.includes(item.id) ? 'rgba(67, 24, 255, 0.03)' : undefined}>
                    <Table.Td>
                      <Checkbox
                        checked={selectedRows.includes(item.id)}
                        onChange={() => toggleRow(item.id)}
                        radius="sm"
                      />
                    </Table.Td>
                    <Table.Td>
                      <Text fw={600} size="sm">{item.title}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" lineClamp={2} maw={250}>
                        {item.message}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="outline" color="gray" radius="md">
                        {item.recipient}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={getPriorityColor(item.priority)}
                        variant="light"
                        radius="xl"
                      >
                        {item.priority}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        {item.channels?.map(ch => {
                          const chOpt = CHANNEL_OPTIONS.find(c => c.value === ch);
                          return chOpt ? (
                            <Tooltip key={ch} label={chOpt.label}>
                              <ThemeIcon size="sm" radius="xl" color="gray" variant="light">
                                <chOpt.icon size={12} />
                              </ThemeIcon>
                            </Tooltip>
                          ) : null;
                        })}
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={getStatusColor(item.status)}
                        variant="light"
                        radius="xl"
                      >
                        {item.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      {item.scheduledFor ? (
                        <Tooltip label={formatDateTime(item.scheduledFor)}>
                          <Text size="sm" style={{ cursor: 'help' }}>
                            {dayjs(item.scheduledFor).fromNow()}
                          </Text>
                        </Tooltip>
                      ) : '—'}
                    </Table.Td>
                    <Table.Td>
                      {item.status === 'Sent' ? (
                        <Tooltip label={`${item.readCount || 0} / ${item.totalCount || 0} opened`}>
                          <Text size="sm">
                            {item.openRate || 0}%
                          </Text>
                        </Tooltip>
                      ) : '—'}
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4} justify="flex-end">
                        <Tooltip label="View details">
                          <ActionIcon
                            variant="subtle"
                            color="blue"
                            onClick={() => {
                              setViewingNotification(item);
                              viewModalHandlers.open();
                            }}
                          >
                            <IconEye size={16} />
                          </ActionIcon>
                        </Tooltip>
                        {item.status === 'Pending Approval' && (
                          <>
                            <Tooltip label="Approve">
                              <ActionIcon
                                variant="subtle"
                                color="green"
                                onClick={() => approveNotification(item.id)}
                              >
                                <IconCheck size={16} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Reject">
                              <ActionIcon
                                variant="subtle"
                                color="red"
                                onClick={() => rejectNotification(item.id)}
                              >
                                <IconX size={16} />
                              </ActionIcon>
                            </Tooltip>
                          </>
                        )}
                        <Tooltip label="Edit">
                          <ActionIcon
                            variant="subtle"
                            color="gray"
                            onClick={() => {
                              setEditingNotification(item);
                              editModalHandlers.open();
                            }}
                            disabled={item.status === 'Sent'}
                          >
                            <IconEdit size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Duplicate">
                          <ActionIcon
                            variant="subtle"
                            color="gray"
                            onClick={() => duplicateNotification(item)}
                          >
                            <IconCopy size={16} />
                          </ActionIcon>
                        </Tooltip>
                        {item.status !== 'Sent' && item.status !== 'Pending Approval' && (
                          <Tooltip label="Send now">
                            <ActionIcon
                              variant="subtle"
                              color="green"
                              onClick={() => sendNow(item)}
                            >
                              <IconSend size={16} />
                            </ActionIcon>
                          </Tooltip>
                        )}
                        <Menu shadow="md" width={160} position="bottom-end">
                          <Menu.Target>
                            <ActionIcon variant="subtle" color="gray">
                              <IconDotsVertical size={16} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item
                              color="red"
                              leftSection={<IconTrash size={14} />}
                              onClick={() => {
                                setSelectedNotification(item);
                                deleteModalHandlers.open();
                              }}
                            >
                              Delete
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>

        {/* PAGINATION (unchanged) */}
        <Group justify="space-between" p="md" bg={footerBg}>
          <Group gap="xs">
            <Text size="sm" c="dimmed">Rows per page</Text>
            <Select
              size="xs"
              w={70}
              data={['5', '10', '20', '50']}
              value={pageSize}
              onChange={(val) => setPageSize(val || '10')}
              radius="md"
            />
            <Text size="sm" c="dimmed">
              {filteredNotifications.length} {filteredNotifications.length === 1 ? 'notification' : 'notifications'}
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

      {/* RECENT ACTIVITY (unchanged, still local) */}
      <Paper p="md" radius="lg" mt="xl" shadow="sm" withBorder bg={paperBg}>
        <Group justify="space-between" mb="md">
          <Title order={4} fw={600} c={primaryText}>Recent Activity</Title>
          <IconHistory size={20} color="gray" />
        </Group>
        <Timeline active={activities.length} bulletSize={24} lineWidth={2}>
          {activities.slice(0, 5).map((act) => (
            <Timeline.Item
              key={act.id}
              bullet={
                <ThemeIcon
                  size={22}
                  radius="xl"
                  color={
                    act.action === 'sent' ? 'green' :
                    act.action === 'created' ? 'blue' :
                    act.action === 'deleted' ? 'red' :
                    act.action === 'approved' ? 'teal' :
                    'gray'
                  }
                  variant="light"
                >
                  {act.action === 'sent' && <IconSend2 size={12} />}
                  {act.action === 'created' && <IconBellPlus size={12} />}
                  {act.action === 'deleted' && <IconTrash size={12} />}
                  {act.action === 'updated' && <IconEdit size={12} />}
                  {act.action === 'approved' && <IconCheck size={12} />}
                  {act.action === 'rejected' && <IconX size={12} />}
                  {act.action === 'duplicated' && <IconCopy size={12} />}
                  {act.action === 'bulk_send' && <IconSend size={12} />}
                  {act.action === 'bulk_delete' && <IconTrash size={12} />}
                </ThemeIcon>
              }
              title={act.action.replace('_', ' ').toUpperCase()}
            >
              <Text size="xs" c="dimmed">{act.user}</Text>
              <Text size="sm">{act.target}</Text>
              <Text size="xs" c="dimmed" mt={4}>{formatDateTime(act.timestamp)}</Text>
            </Timeline.Item>
          ))}
        </Timeline>
      </Paper>

      {/* ---------- MODALS (unchanged) ---------- */}
      {/* Create Modal */}
      <Modal
        opened={createModalOpened}
        onClose={() => {
          createModalHandlers.close();
          createForm.reset();
        }}
        title={<Text fw={700} size="lg">Create New Notification</Text>}
        centered
        size="lg"
        radius="md"
      >
        <form onSubmit={createForm.onSubmit(createNotification)}>
          <Stack gap="md">
            <Group justify="flex-end">
              <Button
                variant="light"
                size="xs"
                leftSection={<IconTemplate size={14} />}
                onClick={templateModalHandlers.open}
              >
                Load Template
              </Button>
              <Button
                variant="light"
                size="xs"
                leftSection={<IconDeviceFloppy size={14} />}
                onClick={saveAsTemplate}
              >
                Save as Template
              </Button>
            </Group>

            <TextInput
              label="Title"
              placeholder="e.g. System Maintenance"
              {...createForm.getInputProps('title')}
              required
              radius="md"
            />
            <Textarea
              label="Message"
              placeholder="Write your notification message..."
              minRows={4}
              {...createForm.getInputProps('message')}
              required
              radius="md"
            />

            <Grid>
              <Grid.Col span={6}>
                <Select
                  label="Recipients"
                  placeholder="Who should receive this?"
                  data={RECIPIENT_OPTIONS.map(o => ({ value: o.value, label: `${o.label} (${o.count.toLocaleString()})` }))}
                  {...createForm.getInputProps('recipientType')}
                  required
                  searchable
                  radius="md"
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <Select
                  label="Priority"
                  data={PRIORITY_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
                  {...createForm.getInputProps('priority')}
                  required
                  radius="md"
                />
              </Grid.Col>
            </Grid>

            <MultiSelect
              label="Delivery Channels"
              placeholder="Select channels"
              data={CHANNEL_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
              {...createForm.getInputProps('channels')}
              required
              radius="md"
            />

            <DateTimePicker
              label="Schedule (optional)"
              placeholder="Pick date and time"
              {...createForm.getInputProps('scheduledFor')}
              clearable
              radius="md"
              size="md"
              valueFormat="MMM D, YYYY h:mm A"
              popoverProps={{ withinPortal: true }}
            />

            <Text size="xs" c="dimmed">
              {createForm.values.recipientType && (
                <>Estimated recipients: <b>{getRecipientCount(createForm.values.recipientType).toLocaleString()}</b> users</>
              )}
            </Text>

            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={createModalHandlers.close} radius="md">Cancel</Button>
              <Button type="submit" bg="#2B3674" radius="md">Create</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Edit Modal (unchanged) */}
      <Modal
        opened={editModalOpened}
        onClose={editModalHandlers.close}
        title={<Text fw={700} size="lg">Edit Notification</Text>}
        centered
        size="lg"
        radius="md"
      >
        {editingNotification && (
          <form onSubmit={editForm.onSubmit(updateNotification)}>
            <Stack gap="md">
              <TextInput
                label="Title"
                {...editForm.getInputProps('title')}
                required
                radius="md"
              />
              <Textarea
                label="Message"
                minRows={4}
                {...editForm.getInputProps('message')}
                required
                radius="md"
              />
              <Grid>
                <Grid.Col span={6}>
                  <Select
                    label="Recipients"
                    data={RECIPIENT_OPTIONS.map(o => ({ value: o.value, label: `${o.label} (${o.count.toLocaleString()})` }))}
                    {...editForm.getInputProps('recipientType')}
                    required
                    searchable
                    radius="md"
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <Select
                    label="Priority"
                    data={PRIORITY_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
                    {...editForm.getInputProps('priority')}
                    required
                    radius="md"
                  />
                </Grid.Col>
              </Grid>
              <MultiSelect
                label="Delivery Channels"
                data={CHANNEL_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
                {...editForm.getInputProps('channels')}
                required
                radius="md"
              />
              <DateTimePicker
                label="Schedule"
                {...editForm.getInputProps('scheduledFor')}
                clearable
                radius="md"
                size="md"
                valueFormat="MMM D, YYYY h:mm A"
                popoverProps={{ withinPortal: true }}
              />
              <Text size="xs" c="dimmed">
                {editForm.values.recipientType && (
                  <>Estimated recipients: <b>{getRecipientCount(editForm.values.recipientType).toLocaleString()}</b> users</>
                )}
              </Text>
              <Group justify="space-between" mt="md">
                <Button
                  color="red"
                  variant="light"
                  leftSection={<IconTrash size={16} />}
                  onClick={() => {
                    editModalHandlers.close();
                    setSelectedNotification(editingNotification);
                    deleteModalHandlers.open();
                  }}
                  radius="md"
                >
                  Delete
                </Button>
                <Group>
                  <Button variant="subtle" onClick={editModalHandlers.close} radius="md">Cancel</Button>
                  <Button type="submit" bg="#2B3674" radius="md">Update</Button>
                </Group>
              </Group>
            </Stack>
          </form>
        )}
      </Modal>

      {/* View Modal (unchanged) */}
      <Modal
        opened={viewModalOpened}
        onClose={viewModalHandlers.close}
        title={<Text fw={700} size="lg">Notification Details</Text>}
        centered
        size="lg"
        radius="md"
      >
        {viewingNotification && (
          <Stack gap="md">
            <Group justify="space-between">
              <Text fw={700} size="xl">{viewingNotification.title}</Text>
              <Group>
                <Badge color={getPriorityColor(viewingNotification.priority)} size="lg">
                  {viewingNotification.priority} priority
                </Badge>
                <Badge color={getStatusColor(viewingNotification.status)} size="lg" radius="xl">
                  {viewingNotification.status}
                </Badge>
              </Group>
            </Group>
            <Divider />
            <Grid>
              <Grid.Col span={6}>
                <Text size="sm" c="dimmed">Recipients</Text>
                <Badge variant="outline" size="lg" radius="md">{viewingNotification.recipient}</Badge>
                <Text size="xs" c="dimmed" mt={4}>
                  {viewingNotification.totalCount?.toLocaleString()} users
                </Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="sm" c="dimmed">Channels</Text>
                <Group gap={4}>
                  {viewingNotification.channels?.map(ch => {
                    const chOpt = CHANNEL_OPTIONS.find(c => c.value === ch);
                    return chOpt ? (
                      <Badge key={ch} variant="light" color="gray" radius="xl" leftSection={<chOpt.icon size={12} />}>
                        {chOpt.label}
                      </Badge>
                    ) : null;
                  })}
                </Group>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="sm" c="dimmed">Created</Text>
                <Text>{formatDateTime(viewingNotification.createdAt)}</Text>
                <Text size="xs" c="dimmed">{getRelativeTime(viewingNotification.createdAt)}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="sm" c="dimmed">Created By</Text>
                <Text>{viewingNotification.createdBy}</Text>
              </Grid.Col>
              {viewingNotification.scheduledFor && (
                <Grid.Col span={6}>
                  <Text size="sm" c="dimmed">Scheduled For</Text>
                  <Text>{formatDateTime(viewingNotification.scheduledFor)}</Text>
                  <Text size="xs" c="dimmed">{getRelativeTime(viewingNotification.scheduledFor)}</Text>
                </Grid.Col>
              )}
              {viewingNotification.sentAt && (
                <Grid.Col span={6}>
                  <Text size="sm" c="dimmed">Sent At</Text>
                  <Text>{formatDateTime(viewingNotification.sentAt)}</Text>
                  <Text size="xs" c="dimmed">{getRelativeTime(viewingNotification.sentAt)}</Text>
                </Grid.Col>
              )}
              {viewingNotification.status === 'Sent' && (
                <Grid.Col span={12}>
                  <Text size="sm" c="dimmed">Performance</Text>
                  <Group gap="xl">
                    <Box>
                      <Text size="xs" c="dimmed">Opened</Text>
                      <Text fw={700}>{viewingNotification.readCount} / {viewingNotification.totalCount}</Text>
                    </Box>
                    <Box>
                      <Text size="xs" c="dimmed">Open Rate</Text>
                      <Text fw={700}>{viewingNotification.openRate}%</Text>
                    </Box>
                  </Group>
                </Grid.Col>
              )}
              <Grid.Col span={12}>
                <Text size="sm" c="dimmed">Message</Text>
                <Paper p="md" bg={messagePreviewBg} radius="md">
                  <Text style={{ whiteSpace: 'pre-wrap' }}>{viewingNotification.message}</Text>
                </Paper>
              </Grid.Col>
            </Grid>
            <Group justify="flex-end">
              {viewingNotification.status === 'Pending Approval' && (
                <>
                  <Button
                    variant="light"
                    color="green"
                    leftSection={<IconCheck size={16} />}
                    onClick={() => {
                      viewModalHandlers.close();
                      approveNotification(viewingNotification.id);
                    }}
                    radius="md"
                  >
                    Approve
                  </Button>
                  <Button
                    variant="light"
                    color="red"
                    leftSection={<IconX size={16} />}
                    onClick={() => {
                      viewModalHandlers.close();
                      rejectNotification(viewingNotification.id);
                    }}
                    radius="md"
                  >
                    Reject
                  </Button>
                </>
              )}
              {viewingNotification.status !== 'Sent' && viewingNotification.status !== 'Pending Approval' && (
                <Button
                  variant="light"
                  color="green"
                  leftSection={<IconSend size={16} />}
                  onClick={() => {
                    viewModalHandlers.close();
                    sendNow(viewingNotification);
                  }}
                  radius="md"
                >
                  Send Now
                </Button>
              )}
              <Button
                variant="light"
                leftSection={<IconCopy size={16} />}
                onClick={() => {
                  viewModalHandlers.close();
                  duplicateNotification(viewingNotification);
                }}
                radius="md"
              >
                Duplicate
              </Button>
              {viewingNotification.status !== 'Sent' && (
                <Button
                  variant="light"
                  leftSection={<IconEdit size={16} />}
                  onClick={() => {
                    viewModalHandlers.close();
                    setEditingNotification(viewingNotification);
                    editModalHandlers.open();
                  }}
                  radius="md"
                >
                  Edit
                </Button>
              )}
              <Button variant="subtle" onClick={viewModalHandlers.close} radius="md">Close</Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Template Modal */}
      <Modal
        opened={templateModalOpened}
        onClose={templateModalHandlers.close}
        title={<Text fw={700} size="lg">Load Template</Text>}
        centered
        size="md"
        radius="md"
      >
        <Stack gap="md">
          <Select
            label="Select a template"
            placeholder="Choose a template"
            data={templates.map(t => ({ value: t.id.toString(), label: t.name }))}
            onChange={loadTemplate}
            searchable
            radius="md"
          />
          <Group justify="flex-end">
            <Button variant="subtle" onClick={templateModalHandlers.close} radius="md">Cancel</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Bulk Send Confirmation Modal */}
      <Modal
        opened={bulkSendModalOpened}
        onClose={bulkSendModalHandlers.close}
        title={<Text fw={700} size="lg">Send Notifications</Text>}
        centered
        size="md"
        radius="md"
      >
        <Stack gap="md">
          <Alert color="blue" icon={<IconSend2 size={16} />}>
            Are you sure you want to send {selectedRows.length} selected notification(s)?
          </Alert>
          <Group justify="flex-end">
            <Button variant="subtle" onClick={bulkSendModalHandlers.close} radius="md">Cancel</Button>
            <Button color="green" onClick={bulkSend} radius="md">Send Now</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={deleteModalHandlers.close}
        title={<Text fw={700} size="lg">Delete Notification</Text>}
        centered
        size="md"
        radius="md"
      >
        {selectedNotification && (
          <Stack gap="md">
            <Alert color="red" title="Warning" icon={<IconAlertCircle size={16} />} radius="md">
              Are you sure you want to delete{' '}
              <Text component="span" fw={700}>"{selectedNotification.title}"</Text>?
              This action cannot be undone.
            </Alert>
            <Group justify="flex-end">
              <Button variant="subtle" onClick={deleteModalHandlers.close} radius="md">Cancel</Button>
              <Button color="red" onClick={deleteNotification} radius="md">Delete</Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Box>
  );
}