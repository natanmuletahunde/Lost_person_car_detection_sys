"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { adminFetch } from '@/app/lib/adminApi';
import { 
  Grid, Paper, Text, Group, Box, Title, TextInput, ActionIcon, Avatar, SimpleGrid, Stack, UnstyledButton,
  useMantineTheme, useMantineColorScheme
} from '@mantine/core';
import { 
  IconSearch, IconSettings, IconBell, IconUsers, IconShoppingCart, IconCar, 
  IconChevronRight, IconCircleCheck 
} from '@tabler/icons-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid 
} from 'recharts';

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [d, f, usersPayload] = await Promise.all([
          adminFetch('/admin/dashboard'),
          adminFetch('/admin/finance?period=30d'),
          adminFetch('/admin/users?page=1&limit=5'),
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
    return () => {
      cancelled = true;
    };
  }, []);

  const weeklyData = useMemo(() => {
    return dash?.stats?.weeklyStats || FALLBACK_WEEKLY;
  }, [dash]);

  const pieData = useMemo(() => {
    const s = dash?.stats;
    if (!s) {
      return [
        { name: 'Active', value: 0, color: '#4318FF' },
        { name: 'Resolved', value: 0, color: '#FFB800' },
        { name: 'Other', value: 0, color: '#6AD2FF' },
      ];
    }
    const active = Number(s.activeCases) || 0;
    const resolved = Number(s.resolvedCases) || 0;
    const other = Math.max(0, (Number(s.totalCases) || 0) - active - resolved);
    const sum = active + resolved + other || 1;
    return [
      { name: 'Active', value: Math.round((active / sum) * 100), color: '#4318FF' },
      { name: 'Resolved', value: Math.round((resolved / sum) * 100), color: '#FFB800' },
      { name: 'Other', value: Math.max(0, 100 - Math.round((active / sum) * 100) - Math.round((resolved / sum) * 100)), color: '#6AD2FF' },
    ];
  }, [dash]);

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
          <TextInput 
            variant="unstyled" 
            placeholder="Search for something" 
            leftSection={<IconSearch size={18} color="gray" />} 
            styles={{
              input: {
                backgroundColor: inputBg,
                borderRadius: '20px',
                height: '35px',
                paddingLeft: '40px',
                color: inputText,
              }
            }}
          />
          <ActionIcon variant="transparent" color="gray"><IconSettings size={20} /></ActionIcon>
          <ActionIcon variant="transparent" color="red"><IconBell size={20} /></ActionIcon>
        </Group>
      </Group>

      {/* TOP STAT CARDS */}
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg" mb="lg">
        <StatCard
          label="Missing Persons"
          value={dash?.stats?.missingPersonCount != null ? String(dash.stats.missingPersonCount) : '—'}
          color="#FFB800"
          icon={<IconUsers />}
        />
        <StatCard
          label="Missing Vehicles"
          value={dash?.stats?.missingVehicleCount != null ? String(dash.stats.missingVehicleCount) : '—'}
          color="#FFB800"
          icon={<IconCar />}
        />
        <StatCard
          label="Resolved Cases"
          value={dash?.stats?.resolvedCases != null ? String(dash.stats.resolvedCases) : '—'}
          color="#FFB800"
          icon={<IconCircleCheck />}
        />
      </SimpleGrid>

      {/* LOWER STAT CARDS */}
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg" mb="xl">
        <StatCard
          label="Active cases"
          value={dash?.stats?.activeCases != null ? String(dash.stats.activeCases) : '—'}
          color="#BDEAF0"
          darkText
          icon={<IconShoppingCart />}
        />
        <StatCard
          label="Resolved cases"
          value={dash?.stats?.resolvedCases != null ? String(dash.stats.resolvedCases) : '—'}
          color="#BDEAF0"
          darkText
          icon={<IconShoppingCart />}
        />
        <StatCard
          label="Resolution rate"
          value={dash?.stats?.resolutionRate != null ? `${dash.stats.resolutionRate}%` : '—'}
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