"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { adminFetch } from '@/app/lib/adminApi';
import {
  Box, Title, Text, Paper, SimpleGrid, Group, Button,
  Table, Badge, ActionIcon, Tooltip, Select, TextInput,
  Modal, Stack, Grid, Divider, Avatar, Pagination,
  Menu, UnstyledButton, Card,
  useMantineTheme, useMantineColorScheme
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconCurrencyDollar, IconUsers, IconCreditCard,
  IconDownload, IconPlus, IconEdit, IconTrash,
  IconEye, IconDotsVertical, IconCheck, IconX,
  IconCalendar, IconSearch, IconSettings, IconBell,
  IconChartLine, IconReceipt, IconFileInvoice,
  IconArrowUpRight, IconArrowDownRight
} from '@tabler/icons-react';
import Link from 'next/link';

// Helper to get dynamic background/color values
const getBg = (colorScheme, light, dark) => (colorScheme === 'dark' ? dark : light);
const getTextColor = (colorScheme, light, dark) => (colorScheme === 'dark' ? dark : light);

// --- MOCK DATA ---
const INITIAL_PLANS = [
  {
    id: "monthly",
    name: "Monthly",
    price: 400,
    interval: "month",
    status: "Active",
    subscribers: 124,
    currency: "birr",
    badge: "Basic Plan",
    badgeColor: "blue",
    features: [
      "2 Providers",
      "Client billing",
      "Free staging",
      "Code licence",
      "White labelling",
      "Data protection"
    ],
    color: `linear-gradient(135deg, #0029A6 0%, #0034D1 100%)`,
    hoverColor: `linear-gradient(135deg, #0029A6 0%, #3358FF 100%)`,
  },
  {
    id: "annual",
    name: "Annual",
    price: 360,
    originalPrice: 400,
    interval: "month",
    status: "Active",
    subscribers: 87,
    currency: "birr",
    badge: "SAVE 10%",
    badgeColor: "green",
    description: "0.00 birr when you have not yet to receive an invoice",
    features: [
      "Everything in Monthly plan",
      "Referral program",
      "Web customization",
      "Marketing tools",
      "Priority support 24/7",
      "Advanced analytics"
    ],
    popular: true,
    color: `linear-gradient(135deg, #001F6E 0%, #0034D1 100%)`,
    hoverColor: `linear-gradient(135deg, #001F6E 0%, #3358FF 100%)`,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 0,
    interval: "",
    status: "Active",
    subscribers: 12,
    currency: "",
    badge: "Premium",
    badgeColor: "violet",
    features: [
      "Everything in Annual plan",
      "Unlimited providers",
      "Dedicated account manager",
      "Custom SLA agreements",
      "Enterprise-grade support",
      "Custom development"
    ],
    color: `linear-gradient(135deg, #1C1C84 0%, #3358FF 100%)`,
    hoverColor: `linear-gradient(135deg, #1C1C84 0%, #4D72FF 100%)`,
  },
];

const INITIAL_TRANSACTIONS = [
  { id: 'INV-001', date: '2026-02-12', customer: 'John Smith', email: 'john.smith@gmail.com', plan: 'Monthly', amount: 400, status: 'Paid', invoiceUrl: '#' },
  { id: 'INV-002', date: '2026-02-11', customer: 'Olivia Bennett', email: 'ollyben@gmail.com', plan: 'Annual', amount: 360, status: 'Paid', invoiceUrl: '#' },
  { id: 'INV-003', date: '2026-02-10', customer: 'Daniel Warren', email: 'dwarren3@gmail.com', plan: 'Enterprise', amount: 0, status: 'Paid', invoiceUrl: '#' },
  { id: 'INV-004', date: '2026-02-09', customer: 'Chloe Hayes', email: 'chloehhye@gmail.com', plan: 'Monthly', amount: 400, status: 'Pending', invoiceUrl: '#' },
  { id: 'INV-005', date: '2026-02-08', customer: 'Marcus Reed', email: 'reeds777@gmail.com', plan: 'Enterprise', amount: 0, status: 'Paid', invoiceUrl: '#' },
  { id: 'INV-006', date: '2026-02-07', customer: 'Alice Cooper', email: 'alice.c@gmail.com', plan: 'Annual', amount: 360, status: 'Overdue', invoiceUrl: '#' },
  { id: 'INV-007', date: '2026-02-06', customer: 'Bob Marley', email: 'bob.m@gmail.com', plan: 'Monthly', amount: 400, status: 'Paid', invoiceUrl: '#' },
  { id: 'INV-008', date: '2026-02-05', customer: 'Emma Watson', email: 'emma.w@gmail.com', plan: 'Annual', amount: 360, status: 'Paid', invoiceUrl: '#' },
];

const MONTHLY_REVENUE = [
  { month: 'Sep', revenue: 12450 },
  { month: 'Oct', revenue: 13820 },
  { month: 'Nov', revenue: 15200 },
  { month: 'Dec', revenue: 16850 },
  { month: 'Jan', revenue: 17900 },
  { month: 'Feb', revenue: 19230 },
];

const formatCurrency = (value) => {
  if (isNaN(value)) return value;
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 2,
  }).format(value);
};

export default function FinanceManagementPage() {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();

  // Dynamic colors
  const mainBg = getBg(colorScheme, '#F4F7FE', theme.colors.dark[7]);
  const headerBg = getBg(colorScheme, 'white', theme.colors.dark[6]);
  const paperBg = getBg(colorScheme, 'white', theme.colors.dark[6]);
  const primaryText = getTextColor(colorScheme, '#2B3674', theme.colors.gray[3]);

  const [financeApi, setFinanceApi] = useState(null);

  useEffect(() => {
    adminFetch('/admin/finance?period=90d')
      .then(setFinanceApi)
      .catch(() => setFinanceApi(null));
  }, []);

  // ---------- STATE ----------
  const [plans, setPlans] = useState(INITIAL_PLANS);
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [activePage, setActivePage] = useState(1);
  const [pageSize, setPageSize] = useState('10');
  const [editingPlan, setEditingPlan] = useState(null);
  const [viewingPlan, setViewingPlan] = useState(null);

  useEffect(() => {
    const savedPlans = localStorage.getItem('subscription_plans');
    if (savedPlans) {
      try {
        setPlans(JSON.parse(savedPlans));
      } catch (e) {
        console.error('Failed to parse plans from local storage', e);
      }
    } else {
      localStorage.setItem('subscription_plans', JSON.stringify(INITIAL_PLANS));
    }
  }, []);

  // ---------- MODALS ----------
  const [addPlanOpened, addPlanHandlers] = useDisclosure(false);
  const [editPlanOpened, editPlanHandlers] = useDisclosure(false);
  const [viewPlanOpened, viewPlanHandlers] = useDisclosure(false);

  // ---------- STATS ----------
  const stats = useMemo(() => {
    const mockTotalRevenue = transactions
      .filter(t => t.status === 'Paid')
      .reduce((sum, t) => sum + t.amount, 0);
    const mrr = plans
      .filter(p => p.status === 'Active' && p.interval === 'month')
      .reduce((sum, p) => sum + (p.price * p.subscribers), 0);
    const mockActiveSubscriptions = plans.reduce((sum, p) => sum + p.subscribers, 0);
    const pendingInvoices = transactions.filter(t => t.status === 'Pending' || t.status === 'Overdue').length;

    const apiTotal = financeApi?.revenue?.total;
    const apiActive = financeApi?.subscriptions?.active;

    return {
      totalRevenue: apiTotal != null ? apiTotal : mockTotalRevenue,
      mrr: financeApi != null ? (financeApi.revenue?.total ?? 0) / 3 : mrr,
      activeSubscriptions: apiActive != null ? apiActive : mockActiveSubscriptions,
      pendingInvoices: financeApi != null ? 0 : pendingInvoices,
    };
  }, [transactions, plans, financeApi]);

  // ---------- FILTERED TRANSACTIONS ----------
  const filteredTransactions = useMemo(() => {
    let result = [...transactions];
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.customer.toLowerCase().includes(lower) ||
        t.email.toLowerCase().includes(lower) ||
        t.id.toLowerCase().includes(lower)
      );
    }
    if (statusFilter && statusFilter !== 'All') {
      result = result.filter(t => t.status === statusFilter);
    }
    result.sort((a, b) => new Date(b.date) - new Date(a.date));
    return result;
  }, [transactions, searchQuery, statusFilter]);

  // ---------- PAGINATION ----------
  const paginatedTransactions = useMemo(() => {
    const size = parseInt(pageSize);
    const start = (activePage - 1) * size;
    return filteredTransactions.slice(start, start + size);
  }, [filteredTransactions, activePage, pageSize]);

  const totalPages = useMemo(() => Math.ceil(filteredTransactions.length / parseInt(pageSize)), [filteredTransactions, pageSize]);

  // Reset page when filters change
  useEffect(() => {
    setActivePage(1);
  }, [searchQuery, statusFilter, pageSize]);

  // ---------- CRUD for Plans ----------
  const addPlan = (values) => {
    const newId = `plan_${Date.now()}`;
    const newPlan = {
      ...values,
      id: newId,
      subscribers: 0,
      currency: "birr",
      badgeColor: "blue", // default badge color
      color: `linear-gradient(135deg, #0029A6 0%, #0034D1 100%)`,
      hoverColor: `linear-gradient(135deg, #0029A6 0%, #3358FF 100%)`,
      features: values.features.split(',').map(f => f.trim()),
    };
    const updatedPlans = [...plans, newPlan];
    setPlans(updatedPlans);
    localStorage.setItem('subscription_plans', JSON.stringify(updatedPlans));
    
    notifications.show({
      title: 'Plan created',
      message: `${values.name} plan added`,
      color: 'green',
      icon: <IconCheck size={18} />
    });
    addPlanHandlers.close();
  };

  const updatePlan = (values) => {
    const updatedPlans = plans.map(p => p.id === values.id ? {
      ...p,
      ...values,
      price: Number(values.price),
      features: typeof values.features === 'string'
        ? values.features.split(',').map(f => f.trim())
        : values.features
    } : p);
    
    setPlans(updatedPlans);
    localStorage.setItem('subscription_plans', JSON.stringify(updatedPlans));
    
    notifications.show({
      title: 'Plan updated',
      message: `${values.name} updated`,
      color: 'blue',
      icon: <IconCheck size={18} />
    });
    editPlanHandlers.close();
  };

  const deletePlan = (id) => {
    const updatedPlans = plans.filter(p => p.id !== id);
    setPlans(updatedPlans);
    localStorage.setItem('subscription_plans', JSON.stringify(updatedPlans));
    
    notifications.show({
      title: 'Plan deleted',
      message: 'Plan removed',
      color: 'red',
      icon: <IconTrash size={18} />
    });
  };

  // ---------- EXPORT CSV ----------
  const exportToCSV = () => {
    const headers = ['Invoice ID', 'Date', 'Customer', 'Email', 'Plan', 'Amount', 'Status'];
    const rows = filteredTransactions.map(t => [
      t.id, t.date, t.customer, t.email, t.plan, t.amount, t.status
    ]);
    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    notifications.show({
      title: 'Exported',
      message: `${filteredTransactions.length} transactions exported`,
      color: 'green',
      icon: <IconDownload size={18} />
    });
  };

  // ---------- FORMS ----------
  const addPlanForm = useForm({
    initialValues: {
      name: '',
      price: '',
      interval: 'month',
      status: 'Draft',
      features: '',
    },
    validate: {
      name: (v) => (!v ? 'Name is required' : null),
      price: (v) => (!v ? 'Price is required' : isNaN(v) ? 'Must be a number' : null),
      features: (v) => (!v ? 'At least one feature required' : null),
    }
  });

  const editPlanForm = useForm({
    initialValues: editingPlan || {},
    validate: {
      name: (v) => (!v ? 'Name is required' : null),
      price: (v) => (!v ? 'Price is required' : isNaN(v) ? 'Must be a number' : null),
      features: (v) => (!v ? 'At least one feature required' : null),
    }
  });

  useEffect(() => {
    if (editingPlan) {
      editPlanForm.setValues({
        ...editingPlan,
        price: editingPlan.price.toString(),
        features: editingPlan.features.join(', '),
      });
      editPlanForm.resetDirty();
    }
  }, [editingPlan]);

  const revenueChart = useMemo(() => {
    const byMonth = financeApi?.revenue?.byMonth;
    if (!byMonth || typeof byMonth !== 'object') return MONTHLY_REVENUE;
    return Object.entries(byMonth).map(([month, revenue]) => ({
      month,
      revenue: Number(revenue) || 0,
    }));
  }, [financeApi]);

  const maxRevenue = Math.max(...revenueChart.map(d => d.revenue), 1);
  const chartHeight = 180;

  return (
    <Box bg={mainBg} style={{ minHeight: '100vh' }} p="xl">
      {/* HEADER */}
      <Group justify="space-between" mb="xl">
        <Box>
          <Title order={2} fw={700} c={primaryText}>Finance & Subscription Management</Title>
          <Text size="sm" c="dimmed">Track revenue, manage plans, and view transactions</Text>
        </Box>
        <Group bg={headerBg} p={8} style={{ borderRadius: '30px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <Tooltip label="Settings">
            <Link href="/admin/settings" passHref style={{ textDecoration: 'none' }}>
              <ActionIcon variant="subtle" color="blue"><IconSettings size={20} /></ActionIcon>
            </Link>
          </Tooltip>
          <Tooltip label="Notifications">
            <Link href="/admin/notification" passHref style={{ textDecoration: 'none' }}>
              <ActionIcon variant="subtle" color="red"><IconBell size={20} /></ActionIcon>
            </Link>
          </Tooltip>
          <Tooltip label="Refresh data">
            <ActionIcon variant="subtle" color="blue" onClick={() => window.location.reload()}><IconDownload size={20} /></ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      {/* STATS CARDS */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg" mb="xl">
        <Paper p="md" radius="lg" bg="linear-gradient(145deg, #4318FF, #7B61FF)" c="white" shadow="md">
          <Group justify="space-between" align="flex-start">
            <Box>
              <Text size="xl" fw={800} style={{ fontSize: '32px' }}>{formatCurrency(stats.totalRevenue)}</Text>
              <Text size="sm" fw={500}>Total Revenue (MTD)</Text>
            </Box>
            <IconCurrencyDollar size={48} opacity={0.3} />
          </Group>
          <UnstyledButton
            w="100%"
            py={8}
            mt="md"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
            onClick={() => notifications.show({ message: 'Revenue details', color: 'blue' })}
          >
            <Text size="xs" fw={600}>View report →</Text>
          </UnstyledButton>
        </Paper>

        <Paper p="md" radius="lg" bg="linear-gradient(145deg, #00B8D9, #00C7E6)" c="white" shadow="md">
          <Group justify="space-between" align="flex-start">
            <Box>
              <Text size="xl" fw={800} style={{ fontSize: '32px' }}>{formatCurrency(stats.mrr)}</Text>
              <Text size="sm" fw={500}>Monthly Recurring Revenue</Text>
            </Box>
            <IconChartLine size={48} opacity={0.3} />
          </Group>
          <UnstyledButton
            w="100%"
            py={8}
            mt="md"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
            onClick={() => notifications.show({ message: 'MRR breakdown', color: 'blue' })}
          >
            <Text size="xs" fw={600}>View details →</Text>
          </UnstyledButton>
        </Paper>

        <Paper p="md" radius="lg" bg="linear-gradient(145deg, #20C997, #3BD6A4)" c="white" shadow="md">
          <Group justify="space-between" align="flex-start">
            <Box>
              <Text size="xl" fw={800} style={{ fontSize: '32px' }}>{stats.activeSubscriptions}</Text>
              <Text size="sm" fw={500}>Active Subscriptions</Text>
            </Box>
            <IconUsers size={48} opacity={0.3} />
          </Group>
          <UnstyledButton
            w="100%"
            py={8}
            mt="md"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
            onClick={() => notifications.show({ message: 'Subscriber list', color: 'blue' })}
          >
            <Text size="xs" fw={600}>View all →</Text>
          </UnstyledButton>
        </Paper>

        <Paper p="md" radius="lg" bg="linear-gradient(145deg, #F59E0B, #FBBF24)" c="white" shadow="md">
          <Group justify="space-between" align="flex-start">
            <Box>
              <Text size="xl" fw={800} style={{ fontSize: '32px' }}>{stats.pendingInvoices}</Text>
              <Text size="sm" fw={500}>Pending Invoices</Text>
            </Box>
            <IconReceipt size={48} opacity={0.3} />
          </Group>
          <UnstyledButton
            w="100%"
            py={8}
            mt="md"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
            onClick={() => notifications.show({ message: 'Pending invoices', color: 'blue' })}
          >
            <Text size="xs" fw={600}>Collect now →</Text>
          </UnstyledButton>
        </Paper>
      </SimpleGrid>

      {/* REVENUE CHART */}
      <Paper p="md" radius="lg" mb="xl" shadow="sm" withBorder bg={paperBg}>
        <Group justify="space-between" mb="md">
          <Title order={4} fw={600} c={primaryText}>Revenue Overview (Last 6 months)</Title>
          <Select
            placeholder="Period"
            data={['Last 6 months', 'Last 12 months', 'Year to date']}
            defaultValue="Last 6 months"
            w={160}
            size="sm"
          />
        </Group>
        <Box style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: chartHeight, marginTop: '20px' }}>
          {revenueChart.map((item) => (
            <Box key={item.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Box
                style={{
                  width: '80%',
                  height: `${(item.revenue / maxRevenue) * (chartHeight - 30)}px`,
                  backgroundColor: '#4318FF',
                  borderRadius: '8px 8px 0 0',
                  transition: 'height 0.2s',
                  opacity: 0.8,
                }}
              />
              <Text size="xs" mt={8} fw={500}>{item.month}</Text>
              <Text size="xs" c="dimmed">{formatCurrency(item.revenue)}</Text>
            </Box>
          ))}
        </Box>
      </Paper>

      {/* SUBSCRIPTION PLANS */}
      <Paper p="md" radius="lg" mb="xl" shadow="sm" withBorder bg={paperBg}>
        <Group justify="space-between" mb="lg">
          <Title order={4} fw={600} c={primaryText}>Subscription Plans</Title>
          <Button
            leftSection={<IconPlus size={16} />}
            bg="#2B3674"
            radius="md"
            onClick={addPlanHandlers.open}
          >
            Add Plan
          </Button>
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="md">
          {plans.map((plan) => (
            <Card key={plan.id} shadow="sm" padding="lg" radius="md" withBorder>
              <Group justify="space-between" mb="xs">
                <Text fw={700} size="lg">{plan.name}</Text>
                <Badge color={plan.status === 'Active' ? 'green' : 'gray'}>{plan.status}</Badge>
              </Group>
              <Text fw={800} size="xl" c={primaryText}>
                {plan.price === 0 ? 'Free' : formatCurrency(plan.price)}
                {plan.price > 0 && <Text span size="sm" fw={400} c="dimmed">/{plan.interval}</Text>}
              </Text>
              <Text size="sm" c="dimmed" mt="xs">{plan.subscribers} subscribers</Text>
              <Box mt="md">
                {plan.features.slice(0, 3).map((feature, idx) => (
                  <Text key={idx} size="xs" c="dimmed" mb={4}>✓ {feature}</Text>
                ))}
                {plan.features.length > 3 && (
                  <Text size="xs" c="blue">+{plan.features.length - 3} more</Text>
                )}
              </Box>
              <Group justify="flex-end" mt="md">
                <Tooltip label="View details">
                  <ActionIcon
                    variant="subtle"
                    color="blue"
                    onClick={() => {
                      setViewingPlan(plan);
                      viewPlanHandlers.open();
                    }}
                  >
                    <IconEye size={16} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Edit">
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    onClick={() => {
                      setEditingPlan(plan);
                      editPlanHandlers.open();
                    }}
                  >
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
                      color="red"
                      leftSection={<IconTrash size={14} />}
                      onClick={() => deletePlan(plan.id)}
                      disabled={plan.subscribers > 0}
                    >
                      Delete
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Group>
            </Card>
          ))}
        </SimpleGrid>
      </Paper>

      {/* TRANSACTIONS TABLE */}
      <Paper p="md" radius="lg" shadow="sm" withBorder bg={paperBg}>
        <Stack gap="md">
          <Group justify="space-between">
            <Title order={4} fw={600} c={primaryText}>Recent Transactions</Title>
            <Group>
              <TextInput
                placeholder="Search by customer or invoice"
                leftSection={<IconSearch size={16} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.currentTarget.value)}
                radius="md"
                size="sm"
              />
              <Select
                placeholder="Status"
                data={['All', 'Paid', 'Pending', 'Overdue']}
                value={statusFilter}
                onChange={setStatusFilter}
                clearable
                radius="md"
                size="sm"
                w={120}
              />
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

          <Table.ScrollContainer minWidth={1000}>
            <Table verticalSpacing="sm" highlightOnHover striped>
              <Table.Thead bg="#4318FF">
                <Table.Tr>
                  <Table.Th c="white">Invoice</Table.Th>
                  <Table.Th c="white">Date</Table.Th>
                  <Table.Th c="white">Customer</Table.Th>
                  <Table.Th c="white">Plan</Table.Th>
                  <Table.Th c="white">Amount</Table.Th>
                  <Table.Th c="white">Status</Table.Th>
                  <Table.Th c="white" style={{ width: 80 }}>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {paginatedTransactions.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={7}>
                      <Text ta="center" py="xl" c="dimmed">No transactions found</Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  paginatedTransactions.map((tx) => (
                    <Table.Tr key={tx.id}>
                      <Table.Td>
                        <Text fw={500} size="sm">{tx.id}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{tx.date}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="sm">
                          <Avatar size="sm" color="blue" radius="xl">
                            {tx.customer.charAt(0)}
                          </Avatar>
                          <Box>
                            <Text size="sm" fw={500}>{tx.customer}</Text>
                            <Text size="xs" c="dimmed">{tx.email}</Text>
                          </Box>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="light" color="blue">{tx.plan}</Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text fw={600} size="sm">
                          {tx.amount === 0 ? 'Free' : formatCurrency(tx.amount)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={
                            tx.status === 'Paid' ? 'green' :
                            tx.status === 'Pending' ? 'yellow' :
                            'red'
                          }
                          variant="light"
                          radius="xl"
                        >
                          {tx.status}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4} justify="flex-end">
                          <Tooltip label="View invoice">
                            <ActionIcon
                              variant="subtle"
                              color="blue"
                              component={Link}
                              href={tx.invoiceUrl}
                              target="_blank"
                            >
                              <IconFileInvoice size={16} />
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
              <Text size="sm" c="dimmed">Rows per page</Text>
              <Select
                size="xs"
                w={70}
                data={['5', '10', '20', '50']}
                value={pageSize}
                onChange={(val) => setPageSize(val || '10')}
              />
              <Text size="sm" c="dimmed">
                {filteredTransactions.length} {filteredTransactions.length === 1 ? 'transaction' : 'transactions'}
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
        </Stack>
      </Paper>

      {/* MODALS - unchanged, just included for completeness */}
      <Modal
        opened={addPlanOpened}
        onClose={addPlanHandlers.close}
        title={<Text fw={700} size="lg">Add New Subscription Plan</Text>}
        centered
        size="lg"
        radius="md"
      >
        <form onSubmit={addPlanForm.onSubmit(addPlan)}>
          <Stack gap="sm">
            <Grid>
              <Grid.Col span={6}>
                <TextInput label="Plan Name" placeholder="e.g. Premium" {...addPlanForm.getInputProps('name')} required />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput label="Price" placeholder="29.99" {...addPlanForm.getInputProps('price')} required />
              </Grid.Col>
              <Grid.Col span={6}>
                <Select label="Billing Interval" data={[{ value: 'month', label: 'Monthly' }, { value: 'year', label: 'Yearly' }]} {...addPlanForm.getInputProps('interval')} required />
              </Grid.Col>
              <Grid.Col span={6}>
                <Select label="Status" data={['Active', 'Draft']} {...addPlanForm.getInputProps('status')} required />
              </Grid.Col>
              <Grid.Col span={12}>
                <TextInput label="Features (comma separated)" placeholder="Feature 1, Feature 2, Feature 3" {...addPlanForm.getInputProps('features')} required />
              </Grid.Col>
            </Grid>
            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={addPlanHandlers.close}>Cancel</Button>
              <Button type="submit" bg="#2B3674">Create Plan</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Modal
        opened={editPlanOpened}
        onClose={editPlanHandlers.close}
        title={<Text fw={700} size="lg">Edit Plan</Text>}
        centered
        size="lg"
        radius="md"
      >
        {editingPlan && (
          <form onSubmit={editPlanForm.onSubmit(updatePlan)}>
            <Stack gap="sm">
              <Grid>
                <Grid.Col span={6}>
                  <TextInput label="Plan Name" {...editPlanForm.getInputProps('name')} required />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput label="Price" {...editPlanForm.getInputProps('price')} required />
                </Grid.Col>
                <Grid.Col span={6}>
                  <Select label="Billing Interval" data={[{ value: 'month', label: 'Monthly' }, { value: 'year', label: 'Yearly' }]} {...editPlanForm.getInputProps('interval')} required />
                </Grid.Col>
                <Grid.Col span={6}>
                  <Select label="Status" data={['Active', 'Draft']} {...editPlanForm.getInputProps('status')} required />
                </Grid.Col>
                <Grid.Col span={12}>
                  <TextInput label="Features (comma separated)" {...editPlanForm.getInputProps('features')} required />
                </Grid.Col>
              </Grid>
              <Group justify="space-between" mt="md">
                <Button color="red" variant="light" leftSection={<IconTrash size={16} />} onClick={() => { deletePlan(editingPlan.id); editPlanHandlers.close(); }} disabled={editingPlan.subscribers > 0}>
                  Delete
                </Button>
                <Group>
                  <Button variant="subtle" onClick={editPlanHandlers.close}>Cancel</Button>
                  <Button type="submit" bg="#2B3674">Update Plan</Button>
                </Group>
              </Group>
            </Stack>
          </form>
        )}
      </Modal>

      <Modal
        opened={viewPlanOpened}
        onClose={viewPlanHandlers.close}
        title={<Text fw={700} size="lg">Plan Details</Text>}
        centered
        size="lg"
        radius="md"
      >
        {viewingPlan && (
          <Stack gap="md">
            <Group gap="xl">
              <Box>
                <Text fw={700} size="xl">{viewingPlan.name}</Text>
                <Badge color={viewingPlan.status === 'Active' ? 'green' : 'gray'} mt="xs">{viewingPlan.status}</Badge>
              </Box>
            </Group>
            <Divider />
            <Grid>
              <Grid.Col span={6}>
                <Text size="sm" c="dimmed">Price</Text>
                <Text fw={700} size="lg">
                  {viewingPlan.price === 0 ? 'Free' : formatCurrency(viewingPlan.price)}
                  <Text span size="sm" fw={400} c="dimmed">/{viewingPlan.interval}</Text>
                </Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="sm" c="dimmed">Subscribers</Text>
                <Text fw={700} size="lg">{viewingPlan.subscribers}</Text>
              </Grid.Col>
              <Grid.Col span={12}>
                <Text size="sm" c="dimmed">Features</Text>
                <Box component="ul" style={{ paddingLeft: 20, marginTop: 8 }}>
                  {viewingPlan.features.map((feature, idx) => (
                    <Text component="li" key={idx} size="sm" mb={4}>{feature}</Text>
                  ))}
                </Box>
              </Grid.Col>
            </Grid>
            <Group justify="flex-end">
              <Button variant="light" leftSection={<IconEdit size={16} />} onClick={() => { viewPlanHandlers.close(); setEditingPlan(viewingPlan); editPlanHandlers.open(); }}>
                Edit Plan
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Box>
  );
}