"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { adminFetch } from '@/app/lib/adminApi';
import { 
  Grid, Paper, Text, Group, Box, Title, TextInput, ActionIcon, Avatar, SimpleGrid, Stack, UnstyledButton,
  useMantineTheme, useMantineColorScheme
} from '@mantine/core';
import { 
  IconSearch, IconSettings, IconBell, IconUsers, IconShoppingCart, IconCar, 
  IconChevronRight, IconCircleCheck, IconDownload
} from '@tabler/icons-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid 
} from 'recharts';
import Link from 'next/link';

// Helper to get dynamic background/color values
const getBg = (colorScheme, light, dark) => (colorScheme === 'dark' ? dark : light);
const getTextColor = (colorScheme, light, dark) => (colorScheme === 'dark' ? dark : light);

const FALLBACK_WEEKLY = [
  { name: 'Sat', Subscription: 0, Registration: 0 },
  { name: 'Sun', Subscription: 0, Registration: 0 },
  { name: 'Mon', Subscription: 0, Registration: 0 },
  { name: 'Tue', Subscription: 0, Registration: 0 },
  { name: 'Wed', Subscription: 0, Registration: 0 },
  { name: 'Thu', Subscription: 0, Registration: 0 },
  { name: 'Fri', Subscription: 0, Registration: 0 },
];

export default function FullWidthDashboard() {
  const [dash, setDash] = useState(null);
  const [finance, setFinance] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [localStats, setLocalStats] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [d, f, usersPayload] = await Promise.all([
          adminFetch('/admin/dashboard').catch(() => ({})),
          adminFetch('/admin/finance?period=30d').catch(() => ({})),
          adminFetch('/admin/users?page=1&limit=5').catch(() => ({})),
        ]);
        if (cancelled) return;
        setDash(d);
        setFinance(f);
        const list = usersPayload?.users || [];
        setRecentUsers(
          list.map((u) => ({
            id: String(u._id || u.id),
            name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
            type: u.role || 'user',
            avatar: null,
          }))
        );
      } catch (e) {
        console.error(e);
      }
    })();

    // Read local mock cases
    try {
      const mockCases = JSON.parse(localStorage.getItem('admin_mock_cases') || '[]');
      const missingPersonCount = mockCases.filter(c => c.type === 'Person' || c.type === 'Special').length;
      const missingVehicleCount = mockCases.filter(c => c.type === 'Vehicle').length;
      const activeCases = mockCases.filter(c => c.status === 'Active').length;
      const resolvedCases = mockCases.filter(c => c.status === 'Resolved').length;
      const totalCases = mockCases.length;
      
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weeklyStatsObj = {
        'Sat': { name: 'Sat', Subscription: 0, Registration: 0 },
        'Sun': { name: 'Sun', Subscription: 0, Registration: 0 },
        'Mon': { name: 'Mon', Subscription: 0, Registration: 0 },
        'Tue': { name: 'Tue', Subscription: 0, Registration: 0 },
        'Wed': { name: 'Wed', Subscription: 0, Registration: 0 },
        'Thu': { name: 'Thu', Subscription: 0, Registration: 0 },
        'Fri': { name: 'Fri', Subscription: 0, Registration: 0 },
      };
      
      mockCases.forEach(c => {
        const date = new Date(c.reportDate);
        if (!isNaN(date)) {
          const dayName = days[date.getDay()];
          if (weeklyStatsObj[dayName]) {
            weeklyStatsObj[dayName].Registration += 1;
          }
        }
      });
      
      const weeklyStats = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(d => weeklyStatsObj[d]);

      setLocalStats({
        missingPersonCount,
        missingVehicleCount,
        activeCases,
        resolvedCases,
        totalCases,
        weeklyStats
      });
    } catch (e) {
      console.error(e);
    }

    return () => {
      cancelled = true;
    };
  }, []);

  const displayStats = useMemo(() => {
    const apiStats = dash?.stats || {};
    const ls = localStats || {};
    
    const missingPersonCount = (apiStats.missingPersonCount || 0) + (ls.missingPersonCount || 0);
    const missingVehicleCount = (apiStats.missingVehicleCount || 0) + (ls.missingVehicleCount || 0);
    const activeCases = (apiStats.activeCases || 0) + (ls.activeCases || 0);
    const resolvedCases = (apiStats.resolvedCases || 0) + (ls.resolvedCases || 0);
    const totalCases = (apiStats.totalCases || 0) + (ls.totalCases || 0);
    
    const resolutionRate = totalCases > 0 ? Math.round((resolvedCases / totalCases) * 100) : 0;
    
    const weeklyStats = (apiStats.weeklyStats || FALLBACK_WEEKLY).map(dayData => {
      const lsDay = ls.weeklyStats?.find(d => d.name === dayData.name) || { Registration: 0, Subscription: 0 };
      return {
        name: dayData.name,
        Subscription: (dayData.Subscription || 0) + (lsDay.Subscription || 0),
        Registration: (dayData.Registration || 0) + (lsDay.Registration || 0)
      };
    });

    return {
      missingPersonCount,
      missingVehicleCount,
      activeCases,
      resolvedCases,
      totalCases,
      resolutionRate,
      weeklyStats
    };
  }, [dash, localStats]);

  const weeklyData = displayStats.weeklyStats;

  const pieData = useMemo(() => {
    const active = displayStats.activeCases || 0;
    const resolved = displayStats.resolvedCases || 0;
    const other = Math.max(0, (displayStats.totalCases || 0) - active - resolved);
    const sum = active + resolved + other || 1;
    return [
      { name: 'Active', value: Math.round((active / sum) * 100), color: '#4318FF' },
      { name: 'Resolved', value: Math.round((resolved / sum) * 100), color: '#FFB800' },
      { name: 'Other', value: Math.max(0, 100 - Math.round((active / sum) * 100) - Math.round((resolved / sum) * 100)), color: '#6AD2FF' },
    ];
  }, [displayStats]);

  const subscriptionData =
    recentUsers.length > 0
      ? recentUsers
      : [
          { id: '1', name: '—', type: 'No users yet', avatar: null },
        ];
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();

  // Dynamic colors
  const mainBg = getBg(colorScheme, '#F4F7FE', theme.colors.dark[7]);
  const primaryText = getBg(colorScheme, '#2B3674', theme.colors.gray[3]);
  const headerBg = getBg(colorScheme, 'white', theme.colors.dark[6]);
  const inputBg = getBg(colorScheme, '#F4F7FE', theme.colors.dark[5]);
  const inputText = getBg(colorScheme, 'black', theme.colors.gray[3]);
  const chartLabelColor = getBg(colorScheme, '#A3AED0', theme.colors.gray[5]);
  const gridStroke = getBg(colorScheme, '#E9EDF7', theme.colors.dark[4]);
  const tooltipBg = getBg(colorScheme, 'white', theme.colors.dark[6]);
  const tooltipText = getBg(colorScheme, 'black', theme.colors.gray[3]);

  return (
    <Box bg={mainBg} style={{ minHeight: '100vh' }} p="xl">
      
      {/* HEADER SECTION */}
      <Group justify="space-between" mb="xl">
        <Title order={2} fw={700} c={primaryText}>Overview</Title>
        <Group bg={headerBg} p={8} style={{ borderRadius: '30px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <Tooltip label="Settings">
            <Link href="/admin/settings" passHref style={{ textDecoration: 'none' }}>
              <ActionIcon variant="subtle" color="blue" size="lg">
                <IconSettings size={20} />
              </ActionIcon>
            </Link>
          </Tooltip>
          <Tooltip label="Notifications">
            <Link href="/admin/notification" passHref style={{ textDecoration: 'none' }}>
              <ActionIcon variant="subtle" color="red" size="lg">
                <IconBell size={20} />
              </ActionIcon>
            </Link>
          </Tooltip>
          <Tooltip label="Refresh">
            <ActionIcon variant="subtle" color="blue" size="lg" onClick={() => window.location.reload()}>
              <IconDownload size={20} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      {/* TOP STAT CARDS */}
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg" mb="lg">
        <StatCard
          label="Missing Persons"
          value={String(displayStats.missingPersonCount)}
          color="#FFB800"
          icon={<IconUsers />}
        />
        <StatCard
          label="Missing Vehicles"
          value={String(displayStats.missingVehicleCount)}
          color="#FFB800"
          icon={<IconCar />}
        />
        <StatCard
          label="Resolved Cases"
          value={String(displayStats.resolvedCases)}
          color="#FFB800"
          icon={<IconCircleCheck />}
        />
      </SimpleGrid>

      {/* LOWER STAT CARDS */}
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg" mb="xl">
        <StatCard
          label="Active cases"
          value={String(displayStats.activeCases)}
          color="#BDEAF0"
          darkText
          icon={<IconShoppingCart />}
        />
        <StatCard
          label="Resolved cases"
          value={String(displayStats.resolvedCases)}
          color="#BDEAF0"
          darkText
          icon={<IconShoppingCart />}
        />
        <StatCard
          label="Resolution rate"
          value={`${displayStats.resolutionRate}%`}
          color="#BDEAF0"
          darkText
          icon={<IconCar />}
        />
      </SimpleGrid>

      {/* FIXED CHARTS SECTION */}
      <Grid gutter="lg" mb="xl">
        {/* WEEKLY REPORT */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Paper
            p="xl"
            radius="lg"
            shadow="xs"
            withBorder
            bg={getBg(colorScheme, 'white', theme.colors.dark[6])}
          >
            <Group justify="space-between" mb="xl">
              <Title order={4} c={primaryText}>Weekly Report</Title>
              <Group gap="lg">
                <Group gap={5}>
                  <Box w={8} h={8} bg="#4318FF" style={{borderRadius: '50%'}} />
                  <Text size="xs" c="dimmed">Subscription</Text>
                </Group>
                <Group gap={5}>
                  <Box w={8} h={8} bg="#6AD2FF" style={{borderRadius: '50%'}} />
                  <Text size="xs" c="dimmed">Registration</Text>
                </Group>
              </Group>
            </Group>
            <Box h={300}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: chartLabelColor }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: chartLabelColor }}
                  />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      color: tooltipText,
                      borderColor: getBg(colorScheme, '#e5e7eb', theme.colors.dark[4]),
                    }}
                    labelStyle={{ color: tooltipText }}
                  />
                  <Bar dataKey="Subscription" fill="#4318FF" radius={[10, 10, 10, 10]} barSize={12} />
                  <Bar dataKey="Registration" fill="#6AD2FF" radius={[10, 10, 10, 10]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid.Col>

        {/* REPORT STATISTICS */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper
            p="xl"
            radius="lg"
            shadow="xs"
            withBorder
            bg={getBg(colorScheme, 'white', theme.colors.dark[6])}
          >
            <Title order={4} mb="xl" c={primaryText}>Report Statistics</Title>
            <Box h={200}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pieData} innerRadius={60} outerRadius={80} dataKey="value">
                    {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      color: tooltipText,
                      borderColor: getBg(colorScheme, '#e5e7eb', theme.colors.dark[4]),
                    }}
                    labelStyle={{ color: tooltipText }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
            <SimpleGrid cols={2} mt="md">
              {pieData.map((e) => (
                <Group key={e.name} gap={5}>
                  <Box w={8} h={8} bg={e.color} style={{borderRadius: '50%'}} />
                  <Box>
                    <Text size="xs" c="dimmed">{e.name}</Text>
                    <Text size="sm" fw={700}>{e.value}%</Text>
                  </Box>
                </Group>
              ))}
            </SimpleGrid>
          </Paper>
        </Grid.Col>
      </Grid>

      {/* BOTTOM SECTION */}
      <Grid gutter="lg">
        {/* RECENT SUBSCRIPTION */}
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Paper
            p="xl"
            radius="lg"
            shadow="xs"
            withBorder
            bg={getBg(colorScheme, 'white', theme.colors.dark[6])}
          >
            <Title order={4} mb="lg" c={primaryText}>Recent subscription</Title>
            <Group gap="xl">
              {subscriptionData.map((sub) => (
                <Stack key={sub.id} align="center" gap={5}>
                  <Avatar radius="xl" size="lg" src={sub.avatar} />
                  <Text fw={700} size="sm" c={getBg(colorScheme, 'black', theme.colors.gray[3])}>
                    {sub.name}
                  </Text>
                  <Text size="xs" c="blue">{sub.type}</Text>
                </Stack>
              ))}
              <ActionIcon
                variant="light"
                radius="xl"
                size="lg"
                bg={getBg(colorScheme, 'white', theme.colors.dark[5])}
                c={getBg(colorScheme, 'black', theme.colors.gray[3])}
              >
                <IconChevronRight size={18} />
              </ActionIcon>
            </Group>
          </Paper>
        </Grid.Col>

        {/* REPORT HISTORY */}
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Paper
            p="xl"
            radius="lg"
            shadow="xs"
            withBorder
            bg={getBg(colorScheme, 'white', theme.colors.dark[6])}
          >
            <Title order={4} mb="lg" c={primaryText}>Report History</Title>
            <Box h={200}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="colorSub" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4318FF" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#4318FF" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6AD2FF" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6AD2FF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke={gridStroke}
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: chartLabelColor }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: chartLabelColor }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      color: tooltipText,
                      borderColor: getBg(colorScheme, '#e5e7eb', theme.colors.dark[4]),
                    }}
                    labelStyle={{ color: tooltipText }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Subscription"
                    stroke="#4318FF"
                    strokeWidth={4}
                    fill="url(#colorSub)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Registration"
                    stroke="#6AD2FF"
                    strokeWidth={4}
                    fill="url(#colorReg)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid.Col>
      </Grid>
    </Box>
  );
}

// --- HELPER COMPONENT ---

function StatCard({ label, value, color, icon, darkText = false }) {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();

  // Determine text color: if darkText true, use black/dark gray; else white.
  const textColor = darkText
    ? getBg(colorScheme, 'black', theme.colors.gray[3])
    : 'white';

  // Button overlay background: light uses rgba(0,0,0,0.1), dark uses rgba(255,255,255,0.1)
  const overlayBg = colorScheme === 'dark'
    ? 'rgba(255, 255, 255, 0.1)'
    : 'rgba(0, 0, 0, 0.1)';

  return (
    <Paper radius="md" shadow="md" style={{ overflow: 'hidden' }}>
      <Box p="md" bg={color} c={textColor}>
        <Group justify="space-between" align="center">
          <Box>
            <Text fw={800} style={{ fontSize: '32px', lineHeight: 1 }}>{value}</Text>
            <Text size="xs" fw={600}>{label}</Text>
          </Box>
          <Box style={{ opacity: 0.3 }}>{icon && React.cloneElement(icon, { size: 40 })}</Box>
        </Group>
      </Box>
      <UnstyledButton w="100%" py={5} bg={overlayBg}>
        <Group justify="center" gap={5}>
          <Text size="xs" fw={700} c={textColor}>More info</Text>
          <IconChevronRight size={12} stroke={3} color={textColor} />
        </Group>
      </UnstyledButton>
    </Paper>
  );
}