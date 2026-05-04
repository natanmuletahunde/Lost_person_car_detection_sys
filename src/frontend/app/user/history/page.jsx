'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Center,
  Container,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  Title,
  useMantineColorScheme,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconArrowLeft, IconHistory } from '@tabler/icons-react';

import MainFooter from '../../components/MainFooter';

const getBg = (colorScheme, light, dark) => (colorScheme === 'dark' ? dark : light);

export default function SearchHistoryPage() {
  const router = useRouter();
  const { colorScheme } = useMantineColorScheme();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    const userData = localStorage.getItem('currentUser');
    if (!isAuthenticated || !userData || isAuthenticated !== 'true') {
      notifications.show({
        title: 'Login required',
        message: 'Please sign in to view your search history.',
        color: 'yellow',
        icon: <IconAlertCircle size={20} />,
      });
      router.push('/authentication/login');
      return;
    }
    setReady(true);
  }, [router]);

  const mainBg = getBg(colorScheme, 'white', '#1A1B1E');
  const paperBg = getBg(colorScheme, 'white', '#25262b');

  if (!ready) {
    return (
      <Box bg={mainBg} style={{ minHeight: '100vh' }}>
        <Center py="xl">
          <Loader color="blue" />
        </Center>
      </Box>
    );
  }

  return (
    <Box bg={mainBg} style={{ minHeight: '100vh' }}>
      <Container size="md" py="xl">
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={18} />}
          component={Link}
          href="/user/dashboard"
          mb="lg"
        >
          Back to dashboard
        </Button>

        <Group gap="sm" mb="md">
          <IconHistory size={28} />
          <Title order={1}>Search history</Title>
        </Group>

        <Paper p="xl" radius="md" withBorder bg={paperBg}>
          <Stack gap="md">
            <Text c="dimmed">
              Saved searches and filters from the app will appear here once that feature is
              connected. For now, you can review your submitted cases and alerts from the links
              below.
            </Text>
            <Group>
              <Button component={Link} href="/user/reported-cases" variant="light">
                Reported cases
              </Button>
              <Button component={Link} href="/user/alert" variant="light">
                Alerts
              </Button>
            </Group>
          </Stack>
        </Paper>
      </Container>
      <MainFooter />
    </Box>
  );
}
