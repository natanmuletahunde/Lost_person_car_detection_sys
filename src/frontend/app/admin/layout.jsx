"use client";

import React, { useState } from 'react';
import { AppShell, Box, Stack, UnstyledButton, Group, Text, ScrollArea, ActionIcon, Tooltip, useMantineTheme, useMantineColorScheme } from '@mantine/core';
import { 
  IconLayoutDashboard, IconUsers, IconDatabase, IconFileCheck, 
  IconCoin, IconBell, IconMessageDots, IconSettings, IconHistory, IconLogout,
  IconChevronLeft, IconMenu2
} from '@tabler/icons-react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image'; // corrected import

export default function AdminLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();

  // Sidebar gradient – light mode uses original blue; dark mode uses a darker blue variant
  const sidebarGradient = colorScheme === 'dark'
    ? `linear-gradient(180deg, ${theme.colors.blue[8]} 0%, ${theme.colors.blue[9]} 100%)`
    : `linear-gradient(180deg, ${theme.colors.blue[5]} 0%, ${theme.colors.blue[7]} 100%)`;

  // Main content background – light: #F4F7FE, dark: dark[7]
  const mainBg = colorScheme === 'dark' ? theme.colors.dark[7] : '#F4F7FE';

  const menuItems = [
    { icon: <IconLayoutDashboard size={22} />, label: 'Dashboard', path: '/admin' },
    { icon: <IconUsers size={22} />, label: 'Accounts', path: '/admin/accounts' },
    { icon: <IconDatabase size={22} />, label: 'Data Management', path: '/admin/data' },
    { icon: <IconFileCheck size={22} />, label: 'Document Validation', path: '/admin/docs' },
    { icon: <IconCoin size={22} />, label: 'Finance', path: '/admin/finance' },
    { icon: <IconBell size={22} />, label: 'Notifications', path: '/admin/notifications' },
    { icon: <IconMessageDots size={22} />, label: 'Feedback', path: '/admin/feedback' },
    { icon: <IconSettings size={22} />, label: 'Setting', path: '/admin/settings' },
    { icon: <IconHistory size={22} />, label: 'Activities', path: '/admin/activities' },
  ];

  return (
    <AppShell
      navbar={{ 
        width: collapsed ? 80 : 280,
        breakpoint: 'sm' 
      }}
      padding="0"
      transitionDuration={300}
      transitionTimingFunction="ease"
    >
      <AppShell.Navbar 
        p="md" 
        style={{ 
          background: sidebarGradient,
          borderRight: 'none',
          zIndex: 100,
          transition: 'width 0.3s ease'
        }}
      >
        <Stack justify="space-between" h="100%">
          <Box>
            {/* TOGGLE BUTTON & LOGO */}
            <Group mb={30} mt={10} justify={collapsed ? "center" : "space-between"}>
              {!collapsed && (
                <Image 
                  src="/logo.jpg" 
                  alt="Logo" 
                  width={120}
                  height={40}
                  style={{ width: 'auto', height: '40px' }}
                />
              )}
              <ActionIcon 
                onClick={() => setCollapsed(!collapsed)} 
                variant="transparent" 
                color="white"
              >
                {collapsed ? <IconMenu2 size={24} /> : <IconChevronLeft size={24} />}
              </ActionIcon>
            </Group>

            {/* NAVIGATION MENU */}
            <ScrollArea h="calc(100vh - 250px)" scrollbarSize={0}>
              <Stack gap={4}>
                {menuItems.map((item) => (
                  <AdminNavItem 
                    key={item.label}
                    {...item} 
                    collapsed={collapsed}
                    active={pathname === item.path}
                    onClick={() => router.push(item.path)}
                  />
                ))}
              </Stack>
            </ScrollArea>
          </Box>
          
          {/* BOTTOM ACTIONS */}
          <Stack gap={4} mb={20}>
            <AdminNavItem 
              icon={<IconLogout size={22} />} 
              label="Logout" 
              collapsed={collapsed}
              onClick={() => router.push('/login')} 
            />
          </Stack>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main bg={mainBg} style={{ minHeight: '100vh' }}>
        {children}
      </AppShell.Main>
    </AppShell>
  );
}

function AdminNavItem({ icon, label, active, onClick, collapsed }) {
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();

  // Determine active background color – slightly lighter/darker depending on mode
  const activeBg = colorScheme === 'dark'
    ? theme.colors.blue[7] + '40' // semi-transparent blue
    : 'rgba(255, 255, 255, 0.2)';

  const content = (
    <UnstyledButton 
      onClick={onClick}
      p="md" 
      w="100%" 
      style={{ 
        borderRadius: '8px',
        backgroundColor: active ? activeBg : 'transparent',
        transition: 'all 0.2s ease',
        position: 'relative',
        display: 'flex',
        justifyContent: collapsed ? 'center' : 'flex-start'
      }}
    >
      {active && !collapsed && (
        <Box 
          style={{ 
            position: 'absolute', 
            left: -16, 
            top: 10, 
            bottom: 10, 
            width: 4, 
            backgroundColor: 'white', 
            borderRadius: '0 4px 4px 0' 
          }} 
        />
      )}
      
      <Group gap="md" wrap="nowrap">
        {React.cloneElement(icon, { color: 'white' })}
        {!collapsed && (
          <Text c="white" size="sm" fw={active ? 700 : 400} style={{ whiteSpace: 'nowrap' }}>
            {label}
          </Text>
        )}
      </Group>
    </UnstyledButton>
  );

  // If collapsed, show a tooltip on hover
  return collapsed ? (
    <Tooltip label={label} position="right" withArrow offset={15}>
      {content}
    </Tooltip>
  ) : content;
}