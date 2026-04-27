'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Title,
  Text,
  Group,
  Button,
  Paper,
  Stack,
  Avatar,
  Badge,
  ActionIcon,
  Loader,
  TextInput,
  Menu,
  UnstyledButton,
  useMantineTheme,
  useMantineColorScheme,
  Flex,
} from '@mantine/core';
import {
  IconSearch,
  IconHome,
  IconUser,
  IconBell,
  IconShieldCheck,
  IconHistory,
  IconSettings,
  IconLogout,
  IconMap,
  IconGps,
  IconMenu2,
} from '@tabler/icons-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useMediaQuery } from '@mantine/hooks';
import MainFooter from '../../components/MainFooter';
import GpsTracker from '../../components/GpsTracker';

// Helper for dynamic background colors
const getBg = (colorScheme, light, dark) => (colorScheme === 'dark' ? dark : light);

export default function GpsTrackingPage() {
  const router = useRouter();
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Dynamic colors
  const mainBg = getBg(colorScheme, 'white', theme.colors.dark[7]);
  const headerBg = getBg(colorScheme, 'white', theme.colors.dark[6]);
  const borderColor = getBg(colorScheme, '#E9ECEF', theme.colors.dark[5]);

  // ------------------ LOGGING FUNCTION ------------------
  const createActionLog = async (action, details = {}) => {
    try {
      if (!currentUser) return;
      let ip = 'unknown';
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipRes.json();
        ip = ipData.ip;
      } catch (e) { /* ignore */ }

      const logEntry = {
        userId: currentUser.id,
        userEmail: currentUser.email,
        action,
        ...details,
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        ipAddress: ip,
      };

      await fetch('http://localhost:3001/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry),
      });
    } catch (error) {
      console.error('Action log failed:', error);
      // Non‑blocking
    }
  };
  // -------------------------------------------------------

  // Check authentication and log page view
  useEffect(() => {
    const userData = localStorage.getItem('currentUser');
    if (!userData) {
      router.push('/login');
      return;
    }
    const user = JSON.parse(userData);
    setCurrentUser(user);
    setLoading(false);
    // Log page view after user is set
    createActionLog('gps_page_view');
  }, [router]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <Box
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: mainBg,
        }}
      >
        <Loader size="lg" />
      </Box>
    );
  }

  const handleLogout = () => {
    createActionLog('logout', { fromPage: 'gps-tracking' });
    localStorage.removeItem('currentUser');
    router.push('/login');
  };

  return (
    <Box
      bg={mainBg}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Sticky Header */}
      <Box
        bg={headerBg}
        py="sm"
        style={{
          borderBottom: `1px solid ${borderColor}`,
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <Container size="xl" px={isMobile ? 'md' : 'xl'}>
          <Flex justify="space-between" align="center" wrap="wrap" gap="sm">
            {/* Logo */}
            <Link href="/" style={{ flexShrink: 0 }}>
              <Image
                src="/logo.jpg"
                alt="Logo"
                width={0}
                height={40}
                sizes="100vw"
                style={{ width: 'auto', height: '40px', borderRadius: '8px' }}
              />
            </Link>

            {/* Search Bar */}
            {!isMobile && (
              <TextInput
                placeholder="Search..."
                leftSection={<IconSearch size={16} />}
                style={{ width: '30%', minWidth: 200 }}
                radius="xl"
              />
            )}

            {/* User Menu */}
            <Group gap="md">
              <ActionIcon
                variant="transparent"
                color="gray"
                size="lg"
                component={Link}
                href="/"
              >
                <IconHome size={24} />
              </ActionIcon>

              <Menu shadow="md" width={280} radius="md" position="bottom-end">
                <Menu.Target>
                  <UnstyledButton>
                    <Group gap="sm">
                      {!isMobile && (
                        <Box ta="right">
                          <Text fw={700} size="sm" truncate>
                            {currentUser?.firstName} {currentUser?.lastName}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {currentUser?.role || 'User'}
                          </Text>
                        </Box>
                      )}
                      <Avatar src={null} alt="User" color="blue" size="md" radius="xl">
                        {currentUser?.firstName?.[0]}{currentUser?.lastName?.[0]}
                      </Avatar>
                    </Group>
                  </UnstyledButton>
                </Menu.Target>
                <Menu.Dropdown p="md">
                  <Stack gap={4}>
                    <Menu.Item leftSection={<IconUser size={18} />} component={Link} href="/profile">
                      Profile
                    </Menu.Item>
                    <Menu.Item leftSection={<IconBell size={18} />} component={Link} href="/alert">
                      Notifications
                    </Menu.Item>
                    <Menu.Item leftSection={<IconShieldCheck size={18} />} component={Link} href="/privacy">
                      Privacy & Policy
                    </Menu.Item>
                    <Menu.Item leftSection={<IconHistory size={18} />} component={Link} href="/history">
                      History
                    </Menu.Item>
                    <Menu.Item leftSection={<IconSettings size={18} />} component={Link} href="/settings">
                      Settings
                    </Menu.Item>
                    <Menu.Divider />
                    <Menu.Item
                      color="red"
                      leftSection={<IconLogout size={18} />}
                      onClick={handleLogout}
                    >
                      Logout
                    </Menu.Item>
                  </Stack>
                </Menu.Dropdown>
              </Menu>
            </Group>
          </Flex>
        </Container>
      </Box>

      {/* Full‑width content area */}
      <Box
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          padding: isMobile ? '8px' : '16px',
        }}
      >
        {/* Title row */}
        <Container size="xl" px={0} mb="md">
          <Flex direction={isMobile ? 'column' : 'row'} align={isMobile ? 'flex-start' : 'center'} gap="xs">
            <IconGps size={28} color="#2f80ed" />
            <Title order={1} size={isMobile ? 'h3' : 'h2'}>GPS Smart Belt Tracking</Title>
            {!isMobile && <Text c="dimmed" size="sm" ml="auto">Real‑time location monitoring</Text>}
          </Flex>
          {isMobile && <Text c="dimmed" size="xs" mt={4}>Real‑time location monitoring</Text>}
        </Container>

        {/* GpsTracker takes remaining height */}
        <Box style={{ flex: 1, minHeight: 0 }}>
          <GpsTracker />
        </Box>
      </Box>

      <MainFooter />
    </Box>
  );
}