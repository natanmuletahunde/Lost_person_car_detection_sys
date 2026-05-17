"use client";

import React, { useState, useMemo, useEffect } from 'react';
import {
  Box, Title, Text, Paper, SimpleGrid, Group, Button,
  Table, Badge, ActionIcon, Tooltip, Select, TextInput,
  Modal, Stack, Grid, Divider, Avatar, Pagination,
  Menu, UnstyledButton, Textarea, Rating, Alert, Loader,
  useMantineTheme, useMantineColorScheme
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconStar, IconStarFilled, IconMessage,
  IconDownload, IconEdit, IconTrash,
  IconEye, IconDotsVertical, IconCheck, IconX,
  IconSearch, IconSettings, IconBell,
  IconUsers, IconClock, IconCheckbox,
  IconArrowUpRight, IconArrowDownRight,
  IconMailForward
} from '@tabler/icons-react';
import Link from 'next/link';
import { adminFetch, adminDelete } from '@/app/lib/adminApi';

// Helper to get dynamic background/color values
const getBg = (colorScheme, light, dark) => (colorScheme === 'dark' ? dark : light);
const getTextColor = (colorScheme, light, dark) => (colorScheme === 'dark' ? dark : light);

const PRIORITY_RATING = { low: 2, medium: 3, high: 4, urgent: 5 };

const mapApiFeedback = (item) => {
  const u = item.user;
  const name = u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : '';
  const email = u?.email || '';
  const st = item.status || 'pending';
  const statusLabel =
    st === 'pending'
      ? 'Pending'
      : st === 'resolved'
        ? 'Resolved'
        : st === 'reviewed'
          ? 'Reviewed'
          : st === 'closed'
            ? 'Closed'
            : st;
  return {
    id: item._id,
    user: { name: name || email || 'User', email, avatar: null },
    rating: item.rating ?? (PRIORITY_RATING[item.priority] ?? 5),
    comment: item.message || item.subject || '',
    date: item.createdAt,
    status: statusLabel,
    category: item.type || 'general',
    response: item.response?.text ?? null,
  };
};

// ---------- HELPER FUNCTIONS ----------
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getRatingIcon = (rating) => {
  switch(rating) {
    case 5: return { label: 'Excellent', color: 'green' };
    case 4: return { label: 'Good', color: 'lime' };
    case 3: return { label: 'Average', color: 'yellow' };
    case 2: return { label: 'Poor', color: 'orange' };
    case 1: return { label: 'Very Poor', color: 'red' };
    default: return { label: 'Unrated', color: 'gray' };
  }
};

export default function FeedbackManagementPage() {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();

  // Dynamic colors
  const mainBg = getBg(colorScheme, '#F4F7FE', theme.colors.dark[7]);
  const headerBg = getBg(colorScheme, 'white', theme.colors.dark[6]);
  const footerBg = getBg(colorScheme, 'white', theme.colors.dark[6]);
  const primaryText = getTextColor(colorScheme, '#2B3674', theme.colors.gray[3]);

  // ---------- STATE ----------
  const [feedback, setFeedback] = useState([]);
  const [loadingFeedback, setLoadingFeedback] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [ratingFilter, setRatingFilter] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [activePage, setActivePage] = useState(1);
  const [pageSize, setPageSize] = useState('10');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [viewingFeedback, setViewingFeedback] = useState(null);
  const [replyingFeedback, setReplyingFeedback] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingFeedback(true);
        const payload = await adminFetch('/admin/feedback');
        if (cancelled) return;
        
        const rows = Array.isArray(payload)
          ? payload
          : (payload && Array.isArray(payload.feedback) ? payload.feedback : []);
          
        setFeedback(rows.map(mapApiFeedback));
      } catch (e) {
        console.error(e);
        notifications.show({
          title: 'Error',
          message: 'Could not load feedback',
          color: 'red',
        });
      } finally {
        if (!cancelled) setLoadingFeedback(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---------- MODALS ----------
  const [viewModalOpened, viewModalHandlers] = useDisclosure(false);
  const [replyModalOpened, replyModalHandlers] = useDisclosure(false);
  const [deleteModalOpened, deleteModalHandlers] = useDisclosure(false);

  // ---------- DERIVED DATA (unique categories) ----------
  const categories = useMemo(() => {
    const cats = feedback.map(f => f.category);
    return ['All', ...new Set(cats)];
  }, [feedback]);

  // ---------- STATS ----------
  const stats = useMemo(() => {
    const total = feedback.length;
    const resolved = feedback.filter(f => f.status === 'Resolved').length;
    const pending = feedback.filter(f => f.status === 'Pending').length;
    const avgRating = total ? feedback.reduce((acc, f) => acc + f.rating, 0) / total : 0;
    return { total, resolved, pending, avgRating: avgRating.toFixed(1) };
  }, [feedback]);

  // ---------- FILTERED FEEDBACK ----------
  const filteredFeedback = useMemo(() => {
    let result = [...feedback];

    // Search (user name, email, comment)
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      result = result.filter(f =>
        f.user.name.toLowerCase().includes(lower) ||
        f.user.email.toLowerCase().includes(lower) ||
        f.comment.toLowerCase().includes(lower)
      );
    }

    // Status filter
    if (statusFilter && statusFilter !== 'All') {
      result = result.filter(f => f.status === statusFilter);
    }

    // Rating filter
    if (ratingFilter && ratingFilter !== 'All') {
      result = result.filter(f => f.rating === parseInt(ratingFilter));
    }

    // Category filter
    if (categoryFilter && categoryFilter !== 'All') {
      result = result.filter(f => f.category === categoryFilter);
    }

    // Sort by date (newest first)
    result.sort((a, b) => new Date(b.date) - new Date(a.date));

    return result;
  }, [feedback, searchQuery, statusFilter, ratingFilter, categoryFilter]);

  // ---------- PAGINATION ----------
  const paginatedFeedback = useMemo(() => {
    const size = parseInt(pageSize);
    const start = (activePage - 1) * size;
    return filteredFeedback.slice(start, start + size);
  }, [filteredFeedback, activePage, pageSize]);

  const totalPages = useMemo(() => Math.ceil(filteredFeedback.length / parseInt(pageSize)), [filteredFeedback, pageSize]);

  // Reset page when filters change
  useEffect(() => {
    setActivePage(1);
  }, [searchQuery, statusFilter, ratingFilter, categoryFilter, pageSize]);

  // ---------- CRUD OPERATIONS ----------
  const replyToFeedback = async (values) => {
    if (!replyingFeedback) return;
    try {
      await adminFetch(`/admin/feedback/${replyingFeedback.id}/respond`, {
        method: 'PATCH',
        body: JSON.stringify({ text: values.response, status: 'resolved' }),
      });
      setFeedback((prev) =>
        prev.map((item) =>
          item.id === replyingFeedback.id
            ? { ...item, response: values.response, status: 'Resolved' }
            : item
        )
      );
      notifications.show({
        title: 'Response sent',
        message: `Your reply to ${replyingFeedback.user.name} has been saved.`,
        color: 'green',
        icon: <IconCheck size={18} />,
      });
      replyModalHandlers.close();
    } catch (e) {
      console.error(e);
      notifications.show({ title: 'Error', message: 'Could not send response', color: 'red' });
    }
  };

  const deleteFeedback = async () => {
    if (!selectedFeedback) return;
    try {
      await adminDelete(`/admin/feedback/${selectedFeedback.id}`);
      setFeedback((prev) => prev.filter((item) => item.id !== selectedFeedback.id));
      notifications.show({
        title: 'Feedback deleted',
        message: 'The feedback has been removed.',
        color: 'red',
        icon: <IconTrash size={18} />,
      });
      deleteModalHandlers.close();
      setSelectedFeedback(null);
    } catch (e) {
      console.error(e);
      notifications.show({ title: 'Error', message: 'Could not delete', color: 'red' });
    }
  };

  const resolveFeedback = (id) => {
    setFeedback(prev => prev.map(item =>
      item.id === id ? { ...item, status: 'Resolved' } : item
    ));
    notifications.show({
      title: 'Status updated',
      message: 'Feedback marked as resolved.',
      color: 'blue',
      icon: <IconCheck size={18} />
    });
  };

  // ---------- EXPORT CSV ----------
  const exportToCSV = () => {
    const headers = ['User', 'Email', 'Rating', 'Comment', 'Category', 'Date', 'Status', 'Response'];
    const rows = filteredFeedback.map(f => [
      f.user.name,
      f.user.email,
      f.rating,
      f.comment.replace(/,/g, ';'),
      f.category,
      new Date(f.date).toLocaleDateString(),
      f.status,
      f.response?.replace(/,/g, ';') || ''
    ]);
    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedback_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    notifications.show({
      title: 'Exported',
      message: `${filteredFeedback.length} feedback entries exported`,
      color: 'green',
      icon: <IconDownload size={18} />
    });
  };

  // ---------- REPLY FORM ----------
  const replyForm = useForm({
    initialValues: { response: '' },
    validate: {
      response: (v) => (!v ? 'Response cannot be empty' : null)
    }
  });

  useEffect(() => {
    if (replyingFeedback) {
      replyForm.setValues({ response: replyingFeedback.response || '' });
      replyForm.resetDirty();
    }
  }, [replyingFeedback]);

  if (loadingFeedback && feedback.length === 0) {
    return (
      <Box bg={mainBg} style={{ minHeight: '100vh' }} p="xl">
        <Group justify="center" mt={120}>
          <Loader size="xl" />
        </Group>
      </Box>
    );
  }

  return (
    <Box bg={mainBg} style={{ minHeight: '100vh' }} p="xl">
      {/* HEADER */}
      <Group justify="space-between" mb="xl">
        <Box>
          <Title order={2} fw={700} c={primaryText}>Feedback Management</Title>
          <Text size="sm" c="dimmed">Monitor user feedback, ratings, and respond to customers</Text>
        </Box>
        <Group bg={headerBg} p={8} style={{ borderRadius: '30px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <Tooltip label="Settings">
            <ActionIcon variant="subtle" color="gray"><IconSettings size={20} /></ActionIcon>
          </Tooltip>
          <Tooltip label="Notifications">
            <ActionIcon variant="subtle" color="red"><IconBell size={20} /></ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      {/* STATS CARDS */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg" mb="xl">
        <Paper p="md" radius="lg" bg="linear-gradient(145deg, #4318FF, #7B61FF)" c="white" shadow="md">
          <Group justify="space-between" align="flex-start">
            <Box>
              <Text size="xl" fw={800} style={{ fontSize: '32px' }}>{stats.total}</Text>
              <Text size="sm" fw={500}>Total Feedback</Text>
            </Box>
            <IconMessage size={48} opacity={0.3} />
          </Group>
          <UnstyledButton
            w="100%"
            py={8}
            mt="md"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
            onClick={() => notifications.show({ message: 'All feedback', color: 'blue' })}
          >
            <Text size="xs" fw={600}>View all →</Text>
          </UnstyledButton>
        </Paper>

        <Paper p="md" radius="lg" bg="linear-gradient(145deg, #00B8D9, #00C7E6)" c="white" shadow="md">
          <Group justify="space-between" align="flex-start">
            <Box>
              <Text size="xl" fw={800} style={{ fontSize: '32px' }}>{stats.avgRating}</Text>
              <Text size="sm" fw={500}>Average Rating</Text>
            </Box>
            <IconStarFilled size={48} opacity={0.3} />
          </Group>
          <UnstyledButton
            w="100%"
            py={8}
            mt="md"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
            onClick={() => notifications.show({ message: 'Rating distribution', color: 'blue' })}
          >
            <Text size="xs" fw={600}>View details →</Text>
          </UnstyledButton>
        </Paper>

        <Paper p="md" radius="lg" bg="linear-gradient(145deg, #20C997, #3BD6A4)" c="white" shadow="md">
          <Group justify="space-between" align="flex-start">
            <Box>
              <Text size="xl" fw={800} style={{ fontSize: '32px' }}>{stats.resolved}</Text>
              <Text size="sm" fw={500}>Resolved</Text>
            </Box>
            <IconCheckbox size={48} opacity={0.3} />
          </Group>
          <UnstyledButton
            w="100%"
            py={8}
            mt="md"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
            onClick={() => notifications.show({ message: 'Resolved feedback', color: 'blue' })}
          >
            <Text size="xs" fw={600}>View →</Text>
          </UnstyledButton>
        </Paper>

        <Paper p="md" radius="lg" bg="linear-gradient(145deg, #F59E0B, #FBBF24)" c="white" shadow="md">
          <Group justify="space-between" align="flex-start">
            <Box>
              <Text size="xl" fw={800} style={{ fontSize: '32px' }}>{stats.pending}</Text>
              <Text size="sm" fw={500}>Pending</Text>
            </Box>
            <IconClock size={48} opacity={0.3} />
          </Group>
          <UnstyledButton
            w="100%"
            py={8}
            mt="md"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
            onClick={() => notifications.show({ message: 'Pending feedback', color: 'blue' })}
          >
            <Text size="xs" fw={600}>Respond now →</Text>
          </UnstyledButton>
        </Paper>
      </SimpleGrid>

      {/* FILTERS & ACTIONS */}
      <Paper p="md" radius="lg" mb="xl" shadow="xs" withBorder>
        <Group justify="space-between">
          <Group>
            <TextInput
              placeholder="Search users or comments"
              leftSection={<IconSearch size={16} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              radius="md"
              size="sm"
              w={250}
            />
            <Select
              placeholder="Status"
              data={['All', 'Pending', 'Resolved', 'Reviewed', 'Closed']}
              value={statusFilter}
              onChange={setStatusFilter}
              clearable
              radius="md"
              size="sm"
              w={130}
            />
            <Select
              placeholder="Rating"
              data={['All', '5', '4', '3', '2', '1']}
              value={ratingFilter}
              onChange={setRatingFilter}
              clearable
              radius="md"
              size="sm"
              w={110}
            />
            <Select
              placeholder="Category"
              data={categories}
              value={categoryFilter}
              onChange={setCategoryFilter}
              clearable
              radius="md"
              size="sm"
              w={140}
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
          </Group>
        </Group>
      </Paper>

      {/* FEEDBACK TABLE */}
      <Paper radius="lg" shadow="sm" withBorder style={{ overflow: 'hidden' }}>
        <Table.ScrollContainer minWidth={1200}>
          <Table verticalSpacing="md" highlightOnHover striped>
            <Table.Thead bg="#4318FF">
              <Table.Tr>
                <Table.Th c="white">User</Table.Th>
                <Table.Th c="white">Rating</Table.Th>
                <Table.Th c="white">Comment</Table.Th>
                <Table.Th c="white">Category</Table.Th>
                <Table.Th c="white">Date</Table.Th>
                <Table.Th c="white">Status</Table.Th>
                <Table.Th c="white">Response</Table.Th>
                <Table.Th c="white" style={{ width: 120 }}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {paginatedFeedback.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={8}>
                    <Text ta="center" py="xl" c="dimmed">No feedback found</Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                paginatedFeedback.map((item) => {
                  const ratingInfo = getRatingIcon(item.rating);
                  return (
                    <Table.Tr key={item.id}>
                      <Table.Td>
                        <Group gap="sm">
                          <Avatar size="sm" color="blue" radius="xl">
                            {item.user.name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Text size="sm" fw={500}>{item.user.name}</Text>
                            <Text size="xs" c="dimmed">{item.user.email}</Text>
                          </Box>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <Rating value={item.rating} fractions={1} readOnly size="sm" />
                          <Badge color={ratingInfo.color} variant="light" size="sm">
                            {ratingInfo.label}
                          </Badge>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" lineClamp={2} maw={300}>
                          {item.comment}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="outline" color="gray">{item.category}</Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{formatDate(item.date)}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={item.status === 'Resolved' ? 'green' : 'yellow'}
                          variant="light"
                          radius="xl"
                        >
                          {item.status}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        {item.response ? (
                          <Text size="sm" lineClamp={1} c="dimmed" fs="italic">
                            "{item.response.slice(0, 30)}..."
                          </Text>
                        ) : (
                          <Badge color="gray" variant="outline">No reply</Badge>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4} justify="flex-end">
                          <Tooltip label="View details">
                            <ActionIcon
                              variant="subtle"
                              color="blue"
                              onClick={() => {
                                setViewingFeedback(item);
                                viewModalHandlers.open();
                              }}
                            >
                              <IconEye size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Reply">
                            <ActionIcon
                              variant="subtle"
                              color="green"
                              onClick={() => {
                                setReplyingFeedback(item);
                                replyModalHandlers.open();
                              }}
                              disabled={item.status === 'Resolved' && item.response}
                            >
                              <IconMailForward size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label={item.status === 'Resolved' ? 'Resolved' : 'Mark resolved'}>
                            <ActionIcon
                              variant="subtle"
                              color={item.status === 'Resolved' ? 'green' : 'gray'}
                              onClick={() => resolveFeedback(item.id)}
                              disabled={item.status === 'Resolved'}
                            >
                              <IconCheck size={16} />
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
                                color="red"
                                leftSection={<IconTrash size={14} />}
                                onClick={() => {
                                  setSelectedFeedback(item);
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
                  );
                })
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
              data={['5', '10', '20', '50']}
              value={pageSize}
              onChange={(val) => setPageSize(val || '10')}
            />
            <Text size="sm" c="dimmed">
              {filteredFeedback.length} {filteredFeedback.length === 1 ? 'entry' : 'entries'}
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

      {/* ---------- MODALS ---------- */}

      {/* View Details Modal */}
      <Modal
        opened={viewModalOpened}
        onClose={viewModalHandlers.close}
        title={<Text fw={700} size="lg">Feedback Details</Text>}
        centered
        size="lg"
        radius="md"
      >
        {viewingFeedback && (
          <Stack gap="md">
            <Group gap="xl">
              <Avatar size={80} radius="xl" color="blue">
                {viewingFeedback.user.name.charAt(0)}
              </Avatar>
              <Box>
                <Text fw={700} size="xl">{viewingFeedback.user.name}</Text>
                <Text size="sm" c="dimmed">{viewingFeedback.user.email}</Text>
                <Group gap="xs" mt="xs">
                  <Rating value={viewingFeedback.rating} fractions={1} readOnly />
                  <Badge color={getRatingIcon(viewingFeedback.rating).color}>
                    {getRatingIcon(viewingFeedback.rating).label}
                  </Badge>
                </Group>
              </Box>
            </Group>
            <Divider />
            <Grid>
              <Grid.Col span={6}>
                <Text size="sm" c="dimmed">Category</Text>
                <Badge variant="outline" size="lg">{viewingFeedback.category}</Badge>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="sm" c="dimmed">Date</Text>
                <Text>{formatDate(viewingFeedback.date)}</Text>
              </Grid.Col>
              <Grid.Col span={12}>
                <Text size="sm" c="dimmed">Comment</Text>
                <Paper
                  p="md"
                  bg={getBg(colorScheme, 'gray.0', theme.colors.dark[6])}
                  radius="md"
                >
                  <Text>{viewingFeedback.comment}</Text>
                </Paper>
              </Grid.Col>
              {viewingFeedback.response && (
                <Grid.Col span={12}>
                  <Text size="sm" c="dimmed">Your Response</Text>
                  <Paper
                    p="md"
                    bg={getBg(colorScheme, 'blue.0', theme.colors.blue[9])}
                    radius="md"
                  >
                    <Text>{viewingFeedback.response}</Text>
                  </Paper>
                </Grid.Col>
              )}
            </Grid>
            <Group justify="flex-end">
              <Button
                variant="light"
                leftSection={<IconMailForward size={16} />}
                onClick={() => {
                  viewModalHandlers.close();
                  setReplyingFeedback(viewingFeedback);
                  replyModalHandlers.open();
                }}
                disabled={viewingFeedback.status === 'Resolved' && viewingFeedback.response}
              >
                Reply
              </Button>
              <Button variant="subtle" onClick={viewModalHandlers.close}>Close</Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Reply Modal */}
      <Modal
        opened={replyModalOpened}
        onClose={replyModalHandlers.close}
        title={<Text fw={700} size="lg">Reply to Feedback</Text>}
        centered
        size="lg"
        radius="md"
      >
        {replyingFeedback && (
          <form onSubmit={replyForm.onSubmit(replyToFeedback)}>
            <Stack gap="md">
              <Box>
                <Group gap="sm" mb="xs">
                  <Avatar size="sm" color="blue">{replyingFeedback.user.name.charAt(0)}</Avatar>
                  <Box>
                    <Text fw={500}>{replyingFeedback.user.name}</Text>
                    <Rating value={replyingFeedback.rating} fractions={1} readOnly size="xs" />
                  </Box>
                </Group>
                <Paper
                  p="sm"
                  bg={getBg(colorScheme, 'gray.0', theme.colors.dark[6])}
                  radius="md"
                  mb="md"
                >
                  <Text size="sm" fs="italic">"{replyingFeedback.comment}"</Text>
                </Paper>
              </Box>
              <Textarea
                label="Your Response"
                placeholder="Write your reply..."
                minRows={4}
                {...replyForm.getInputProps('response')}
                required
              />
              <Group justify="flex-end" mt="md">
                <Button variant="subtle" onClick={replyModalHandlers.close}>Cancel</Button>
                <Button type="submit" bg="#2B3674">Send Reply</Button>
              </Group>
            </Stack>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={deleteModalHandlers.close}
        title={<Text fw={700} size="lg">Delete Feedback</Text>}
        centered
        size="md"
        radius="md"
      >
        {selectedFeedback && (
          <Stack gap="md">
            <Alert color="red" title="Warning" icon={<IconTrash size={16} />}>
              Are you sure you want to delete this feedback from{' '}
              <Text component="span" fw={700}>{selectedFeedback.user.name}</Text>?
              This action cannot be undone.
            </Alert>
            <Group justify="flex-end">
              <Button variant="subtle" onClick={deleteModalHandlers.close}>Cancel</Button>
              <Button color="red" onClick={deleteFeedback}>Delete</Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Box>
  );
}