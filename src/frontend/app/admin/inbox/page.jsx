"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Title, Text, Paper, Group, Badge, ActionIcon, Button,
  Stack, Divider, Loader, Alert, Tabs, ThemeIcon, Tooltip,
  useMantineTheme, useMantineColorScheme,
} from '@mantine/core';
import { notifications as notify } from '@mantine/notifications';
import {
  IconBell, IconBellCheck, IconCheck, IconTrash, IconRefresh,
  IconAlertCircle, IconInfoCircle, IconShieldCheck, IconX,
} from '@tabler/icons-react';
import { adminFetch } from '@/app/lib/adminApi';

const getBg = (cs, light, dark) => (cs === 'dark' ? dark : light);

const TYPE_META = {
  success:  { color: 'green',  icon: <IconShieldCheck size={18} /> },
  warning:  { color: 'orange', icon: <IconAlertCircle size={18} /> },
  info:     { color: 'blue',   icon: <IconInfoCircle  size={18} /> },
  general:  { color: 'gray',   icon: <IconBell        size={18} /> },
  feedback: { color: 'violet', icon: <IconBell        size={18} /> },
  alert:    { color: 'red',    icon: <IconBell        size={18} /> },
};

function getTypeMeta(type) {
  return TYPE_META[type] || TYPE_META.general;
}

export default function AdminInboxPage() {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();

  const mainBg = getBg(colorScheme, '#F4F7FE', theme.colors.dark[7]);
  const cardBg = getBg(colorScheme, 'white', theme.colors.dark[6]);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('unread');
  const [markingAll, setMarkingAll] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);

  const fetchInbox = async () => {
    setLoading(true);
    try {
      // adminFetch already returns json.data, so the result is the notifications array directly
      const data = await adminFetch('/notifications/my-notifications');
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      notify.show({ title: 'Error', message: 'Could not load inbox.', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInbox(); }, []);

  const unread = useMemo(() => items.filter(n => !n.isRead), [items]);
  const read   = useMemo(() => items.filter(n => n.isRead), [items]);
  const shown  = activeTab === 'unread' ? unread : read;

  const markRead = async (id) => {
    try {
      await adminFetch(`/notifications/${id}/read`, { method: 'PATCH', body: JSON.stringify({}) });
      setItems(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch {
      notify.show({ title: 'Error', message: 'Could not mark as read.', color: 'red' });
    }
  };

  const deleteNotif = async (id) => {
    try {
      await adminFetch(`/notifications/${id}`, { method: 'DELETE', body: JSON.stringify({}) });
      setItems(prev => prev.filter(n => n._id !== id));
      notify.show({ title: 'Deleted', message: 'Notification removed.', color: 'gray' });
    } catch {
      notify.show({ title: 'Error', message: 'Could not delete.', color: 'red' });
    }
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await Promise.all(unread.map(n => adminFetch(`/notifications/${n._id}/read`, { method: 'PATCH', body: JSON.stringify({}) })));
      setItems(prev => prev.map(n => ({ ...n, isRead: true })));
      notify.show({ title: 'Done', message: 'All notifications marked as read.', color: 'green' });
    } catch {
      notify.show({ title: 'Error', message: 'Could not mark all read.', color: 'red' });
    } finally {
      setMarkingAll(false);
    }
  };

  const clearAll = async () => {
    if (!confirm('Clear all notifications? This cannot be undone.')) return;
    setClearingAll(true);
    try {
      await adminFetch('/notifications/', { method: 'DELETE', body: JSON.stringify({}) });
      setItems([]);
      notify.show({ title: 'Cleared', message: 'All notifications cleared.', color: 'gray' });
    } catch {
      notify.show({ title: 'Error', message: 'Could not clear.', color: 'red' });
    } finally {
      setClearingAll(false);
    }
  };

  return (
    <Box bg={mainBg} style={{ minHeight: '100vh' }} p="xl">
      {/* Header */}
      <Group justify="space-between" mb="xl">
        <Group>
          <ThemeIcon size="xl" radius="md" color="blue" variant="light">
            <IconBell size={24} />
          </ThemeIcon>
          <Box>
            <Title order={2} fw={700} c="#2B3674">Admin Inbox</Title>
            <Text size="sm" c="dimmed">Notifications sent to you</Text>
          </Box>
          {unread.length > 0 && (
            <Badge size="xl" color="red" variant="filled" circle>{unread.length}</Badge>
          )}
        </Group>
        <Group>
          <Tooltip label="Refresh">
            <ActionIcon variant="light" color="blue" size="lg" onClick={fetchInbox} loading={loading}>
              <IconRefresh size={18} />
            </ActionIcon>
          </Tooltip>
          {unread.length > 0 && (
            <Button
              variant="light"
              color="blue"
              leftSection={<IconBellCheck size={16} />}
              onClick={markAllRead}
              loading={markingAll}
            >
              Mark all as read
            </Button>
          )}
          {items.length > 0 && (
            <Button
              variant="light"
              color="red"
              leftSection={<IconTrash size={16} />}
              onClick={clearAll}
              loading={clearingAll}
            >
              Clear all
            </Button>
          )}
        </Group>
      </Group>

      <Paper p="xl" radius="lg" shadow="xs" withBorder bg={cardBg}>
        <Tabs value={activeTab} onChange={setActiveTab} mb="lg">
          <Tabs.List>
            <Tabs.Tab
              value="unread"
              leftSection={<IconBell size={16} />}
              rightSection={
                unread.length > 0
                  ? <Badge size="sm" color="red" variant="filled">{unread.length}</Badge>
                  : null
              }
            >
              Unread
            </Tabs.Tab>
            <Tabs.Tab value="read" leftSection={<IconBellCheck size={16} />}>
              Read ({read.length})
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>

        {loading ? (
          <Box ta="center" py="xl">
            <Loader size="lg" />
          </Box>
        ) : shown.length === 0 ? (
          <Box ta="center" py="xl">
            <IconBellCheck size={48} color="#94a3b8" />
            <Text mt="md" c="dimmed" size="lg">
              {activeTab === 'unread' ? 'All caught up! No unread notifications.' : 'No read notifications.'}
            </Text>
          </Box>
        ) : (
          <Stack gap="sm">
            {shown.map((notif, i) => {
              const meta = getTypeMeta(notif.type);
              const timeStr = notif.createdAt
                ? new Date(notif.createdAt).toLocaleString()
                : '';
              return (
                <React.Fragment key={notif._id}>
                  {i > 0 && <Divider />}
                  <Paper
                    p="md"
                    radius="md"
                    bg={notif.isRead ? 'transparent' : getBg(colorScheme, '#EFF6FF', theme.colors.blue[9] + '20')}
                    style={{
                      border: notif.isRead ? `1px solid transparent` : `1px solid #BFDBFE`,
                      transition: 'background 0.2s',
                    }}
                  >
                    <Group justify="space-between" align="flex-start" wrap="nowrap">
                      <Group align="flex-start" gap="sm" wrap="nowrap" style={{ flex: 1 }}>
                        <ThemeIcon
                          size="lg"
                          radius="xl"
                          color={meta.color}
                          variant={notif.isRead ? 'light' : 'filled'}
                          style={{ flexShrink: 0, marginTop: 2 }}
                        >
                          {meta.icon}
                        </ThemeIcon>
                        <Box style={{ flex: 1 }}>
                          <Group gap="xs" mb={4}>
                            <Text fw={notif.isRead ? 500 : 700} size="sm">
                              {notif.title}
                            </Text>
                            <Badge size="xs" color={meta.color} variant="light">
                              {notif.type}
                            </Badge>
                            {notif.priority === 'high' && (
                              <Badge size="xs" color="red" variant="filled">HIGH</Badge>
                            )}
                            {!notif.isRead && (
                              <Badge size="xs" color="blue" variant="dot">New</Badge>
                            )}
                          </Group>
                          <Text size="sm" c="dimmed" mb={6} style={{ lineHeight: 1.5 }}>
                            {notif.message}
                          </Text>
                          <Text size="xs" c="dimmed">{timeStr}</Text>
                        </Box>
                      </Group>

                      {/* Action buttons */}
                      <Group gap="xs" style={{ flexShrink: 0 }}>
                        {!notif.isRead && (
                          <Tooltip label="Mark as read">
                            <ActionIcon
                              variant="light"
                              color="green"
                              size="md"
                              onClick={() => markRead(notif._id)}
                            >
                              <IconCheck size={16} />
                            </ActionIcon>
                          </Tooltip>
                        )}
                        <Tooltip label="Delete">
                          <ActionIcon
                            variant="light"
                            color="red"
                            size="md"
                            onClick={() => deleteNotif(notif._id)}
                          >
                            <IconX size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Group>
                  </Paper>
                </React.Fragment>
              );
            })}
          </Stack>
        )}
      </Paper>
    </Box>
  );
}
