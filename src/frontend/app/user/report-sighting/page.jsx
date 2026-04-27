'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Title,
  Text,
  TextInput,
  Select,
  Textarea,
  Button,
  SimpleGrid,
  FileInput,
  Paper,
  Card,
  Flex,
  Avatar,
  Tooltip,
  ActionIcon,
  Loader,
  Divider,
  useMantineTheme,
  useMantineColorScheme,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconMapPin,
  IconAlertCircle,
  IconUpload,
  IconCheck,
  IconHome,
  IconDashboard,
  IconQuestionMark,
  IconInfoCircle,
  IconExternalLink,
} from '@tabler/icons-react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import MainFooter from '../../components/MainFooter';
import { useMediaQuery } from '@mantine/hooks';

// JSON Server URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
const SIGHTINGS_API = `${API_BASE_URL}/sightings`;

// Theme constants (same as registration form)
const PRIMARY_COLOR = '#0034D1';
const PRIMARY_LIGHT = '#4d79ff';
const PRIMARY_DARK = '#0029a8';
const PRIMARY_GRADIENT = `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, #0066ff 100%)`;

// Helper for dynamic background/text colors
const getBg = (colorScheme, light, dark) => (colorScheme === 'dark' ? dark : light);

// Dynamic import of the map (no SSR)
const LocationPicker = dynamic(() => import('../../components/LocationPicker'), {
  ssr: false,
  loading: () => (
    <Box
      style={{
        height: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f0f5ff',
        borderRadius: '12px',
      }}
    >
      <Loader size="lg" color={PRIMARY_COLOR} />
    </Box>
  ),
});

export default function ReportSightingPage() {
  const router = useRouter();
  const searchParams = useSearchParams(); // get query parameters
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);

  const [currentUser, setCurrentUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHelpVisible, setIsHelpVisible] = useState(false);
  const [formValues, setFormValues] = useState({
    type: 'Person',
    name: '',
    plateNumber: '',
    description: '',
    location: '',
    date: '',
    time: '',
    latitude: '',
    longitude: '',
    imagePreview: null,
  });

  // Load authenticated user
  useEffect(() => {
    const isAuth = localStorage.getItem('isAuthenticated');
    const userData = localStorage.getItem('currentUser');
    if (!isAuth || isAuth !== 'true' || !userData) {
      sessionStorage.setItem('redirectUrl', window.location.pathname);
      notifications.show({
        title: 'Login Required',
        message: 'Please login to submit a sighting',
        color: 'yellow',
        icon: <IconAlertCircle size={20} />,
      });
      router.push('/login');
      return;
    }
    setCurrentUser(JSON.parse(userData));
  }, [router]);

  // Prefill form from URL parameters (when coming from carousel buttons)
  useEffect(() => {
    if (searchParams) {
      const type = searchParams.get('type');
      const name = searchParams.get('name');
      const plateNumber = searchParams.get('plateNumber');
      const location = searchParams.get('location');
      // Optional: you could also extract lat/lng if provided
      // const lat = searchParams.get('lat');
      // const lng = searchParams.get('lng');

      setFormValues(prev => ({
        ...prev,
        type: type || prev.type,
        name: name || prev.name,
        plateNumber: plateNumber || prev.plateNumber,
        location: location || prev.location,
        // If coordinates are provided, you could set latitude/longitude as well
        // latitude: lat || prev.latitude,
        // longitude: lng || prev.longitude,
      }));
    }
  }, [searchParams]);

  const handleLocationSelect = (lat, lng, address) => {
    setFormValues((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      location: address,
    }));
  };

  const saveToJsonServer = async (data) => {
    try {
      const response = await fetch(SIGHTINGS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`Failed to save data: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error('Error saving to JSON Server:', error);
      throw error;
    }
  };

  // ********** LOGGING FUNCTION **********
  const createSightingLog = async (sightingData) => {
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
        action: 'sighting_submitted',
        sightingType: sightingData.type,
        description: sightingData.name || sightingData.plateNumber || 'Unknown',
        location: sightingData.location,
        originalCaseId: sightingData.originalCaseId || null,
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
      console.error('Logging failed:', error);
      // Non-blocking
    }
  };
  // **************************************

  const handleSubmit = async () => {
    const required = ['type', 'location', 'date', 'time'];
    if (formValues.type === 'Person') required.push('name');
    else required.push('plateNumber');

    const missing = required.filter((f) => !formValues[f] || formValues[f].toString().trim() === '');
    if (missing.length > 0) {
      notifications.show({
        title: 'Missing Fields',
        message: `Please fill in: ${missing.join(', ')}`,
        color: 'red',
        icon: <IconAlertCircle size={20} />,
      });
      return;
    }

    setIsSubmitting(true);

    // Extract originalCaseId from URL parameters
    const originalCaseId = searchParams.get('caseId');

    const payload = {
      ...formValues,
      originalCaseId: originalCaseId || null, // <-- save the case ID
      reportedBy: currentUser
        ? {
            userId: currentUser.id,
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            email: currentUser.email,
            phone: currentUser.phone,
            role: currentUser.role,
          }
        : null,
      reportDate: new Date().toISOString(),
      status: 'pending',
    };

    try {
      const savedSighting = await saveToJsonServer(payload);
      // 🔹 LOG SUCCESSFUL SUBMISSION
      createSightingLog(payload).catch(err => console.error('Log error:', err));

      notifications.show({
        title: 'Thank you!',
        message: 'Sighting submitted successfully.',
        color: 'green',
        icon: <IconCheck size={20} />,
      });
      router.push('/');
    } catch (err) {
      // We don't log failures here, but you could add it if needed
      notifications.show({
        title: 'Submission Failed',
        message: 'Failed to submit sighting. Please try again.',
        color: 'red',
        icon: <IconAlertCircle size={20} />,
      });
    }
    setIsSubmitting(false);
  };

  const handleImageChange = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormValues((prev) => ({ ...prev, imagePreview: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <Box
      style={{
        minHeight: '100vh',
        background: isMobile
          ? getBg(colorScheme, '#f0f5ff', theme.colors.dark[7])
          : colorScheme === 'dark'
            ? `radial-gradient(circle at 10% 20%, rgba(0, 52, 209, 0.3) 0%, ${theme.colors.dark[7]} 100%)`
            : `radial-gradient(circle at 10% 20%, rgba(0, 52, 209, 0.05) 0%, #ffffff 100%)`,
        position: 'relative',
      }}
    >
      {/* Floating Help Button (optional) */}
      <Tooltip label="Quick Help & Tips" position="left" withArrow>
        <ActionIcon
          size="lg"
          radius="xl"
          variant="filled"
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 100,
            background: PRIMARY_GRADIENT,
            boxShadow: `0 6px 20px ${PRIMARY_COLOR}40`,
            border: `2px solid white`,
          }}
          onClick={() => setIsHelpVisible(!isHelpVisible)}
        >
          <IconQuestionMark size={22} color="white" />
        </ActionIcon>
      </Tooltip>

      {/* Header */}
      <Box
        bg={getBg(colorScheme, 'white', theme.colors.dark[7])}
        style={{
          borderBottom: `2px solid ${getBg(colorScheme, '#f0f5ff', theme.colors.dark[5])}`,
          boxShadow: `0 2px 15px rgba(0, 52, 209, 0.1)`,
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <Container size="lg">
          <Flex justify="space-between" align="center" py="sm" direction={isMobile ? 'column' : 'row'} gap={isMobile ? 'md' : 'xs'}>
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              <Flex align="center" gap="md">
                <Box style={{ display: 'inline-block', height: '40px', width: 'auto', overflow: 'hidden' }}>
                  <Image src="/logo.jpg" alt="Logo" width={2040} height={952} style={{ height: '100%', width: 'auto' }} />
                </Box>
                <Box>
                  <Text size={isMobile ? 'lg' : 'xl'} fw={900} style={{ color: PRIMARY_COLOR, letterSpacing: '-0.5px' }}>
                    Sighting
                  </Text>
                  <Text size="xs" c={PRIMARY_DARK} fw={600} style={{ letterSpacing: '1px' }}>
                    Report a sighting
                  </Text>
                </Box>
              </Flex>
            </Link>
            {currentUser && (
              <Flex align="center" gap="lg">
                <Flex gap="xs">
                  <Tooltip label="Dashboard" position="bottom">
                    <ActionIcon size="lg" radius="md" variant="light" color="blue" onClick={() => router.push('/')} style={{ border: `1px solid ${PRIMARY_COLOR}30` }}>
                      <IconDashboard size={20} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Home" position="bottom">
                    <ActionIcon size="lg" radius="md" variant="light" color="blue" onClick={() => router.push('/')} style={{ border: `1px solid ${PRIMARY_COLOR}30` }}>
                      <IconHome size={20} />
                    </ActionIcon>
                  </Tooltip>
                </Flex>
                <Flex
                  align="center"
                  gap="sm"
                  style={{
                    padding: '8px 16px',
                    background: getBg(colorScheme, '#f0f5ff', theme.colors.dark[6]),
                    borderRadius: '30px',
                  }}
                >
                  <Avatar size="sm" radius="xl" src={currentUser?.avatar} style={{ background: PRIMARY_GRADIENT, border: `2px solid white` }}>
                    {currentUser?.firstName?.[0]}{currentUser?.lastName?.[0]}
                  </Avatar>
                  <Box>
                    <Text size="sm" fw={600} style={{ color: PRIMARY_DARK }}>
                      {currentUser?.firstName} {currentUser?.lastName}
                    </Text>
                  </Box>
                </Flex>
              </Flex>
            )}
          </Flex>
        </Container>
      </Box>

      {/* Main Form Container */}
      <Container size="lg" py={isMobile ? 20 : 40}>
        <Paper
          radius="lg"
          p={isMobile ? 'md' : 'xl'}
          bg={getBg(colorScheme, 'white', theme.colors.dark[7])}
          style={{
            border: `2px solid ${getBg(colorScheme, '#f0f5ff', theme.colors.dark[5])}`,
            boxShadow: `0 8px 30px rgba(0, 52, 209, 0.08)`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative corner */}
          <Box
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 100,
              height: 100,
              background: PRIMARY_GRADIENT,
              borderBottomLeftRadius: '100%',
              opacity: 0.05,
            }}
          />

          {/* Title */}
          <Title order={2} mb="md" style={{ color: PRIMARY_DARK, fontWeight: 800 }}>
            Report a Sighting
          </Title>
          <Text mb="xl" c="dimmed" size="sm">
            Let us know if you&apos;ve seen a missing person or vehicle. Your information may help
            recover them faster.
          </Text>

          <Card
            withBorder
            radius="lg"
            padding="xl"
            bg={getBg(colorScheme, '#f8fbff', theme.colors.dark[6])}
            style={{ borderLeft: `4px solid ${PRIMARY_COLOR}` }}
          >
            <SimpleGrid cols={1} spacing="md">
              <Select
                label="Type"
                value={formValues.type}
                onChange={(v) => setFormValues((p) => ({ ...p, type: v }))}
                data={[
                  { value: 'Person', label: 'Person' },
                  { value: 'Vehicle', label: 'Vehicle' },
                ]}
                radius="md"
                variant="filled"
                styles={{
                  input: { borderColor: getBg(colorScheme, '#f0f5ff', theme.colors.dark[5]) },
                }}
              />

              {formValues.type === 'Person' ? (
                <TextInput
                  label="Person Name"
                  placeholder="John Doe"
                  value={formValues.name}
                  onChange={(e) => setFormValues((p) => ({ ...p, name: e.target.value }))}
                  radius="md"
                  variant="filled"
                />
              ) : (
                <TextInput
                  label="Plate Number"
                  placeholder="AA-12345"
                  value={formValues.plateNumber}
                  onChange={(e) => setFormValues((p) => ({ ...p, plateNumber: e.target.value }))}
                  radius="md"
                  variant="filled"
                />
              )}

              <Textarea
                label="Additional Details"
                placeholder="Color, clothing, distinguishing marks, etc."
                minRows={3}
                value={formValues.description}
                onChange={(e) => setFormValues((p) => ({ ...p, description: e.target.value }))}
                radius="md"
                variant="filled"
              />

              <TextInput
                label="Location"
                placeholder="Tap map or type address"
                leftSection={<IconMapPin size={16} color={PRIMARY_COLOR} />}
                value={formValues.location}
                onChange={(e) => setFormValues((p) => ({ ...p, location: e.target.value }))}
                radius="md"
                variant="filled"
              />

              {/* Interactive Map */}
              <Card withBorder radius="lg" padding={0} style={{ overflow: 'hidden' }}>
                <LocationPicker onLocationSelect={handleLocationSelect} />
              </Card>

              <SimpleGrid cols={2} breakpoints={[{ maxWidth: 'sm', cols: 1 }]} spacing="md">
                <TextInput
                  label="Date"
                  type="date"
                  value={formValues.date}
                  onChange={(e) => setFormValues((p) => ({ ...p, date: e.target.value }))}
                  radius="md"
                  variant="filled"
                />
                <TextInput
                  label="Time"
                  type="time"
                  value={formValues.time}
                  onChange={(e) => setFormValues((p) => ({ ...p, time: e.target.value }))}
                  radius="md"
                  variant="filled"
                />
              </SimpleGrid>

              <FileInput
                label="Photo (optional)"
                placeholder="Upload an image"
                leftSection={<IconUpload size={16} color={PRIMARY_COLOR} />}
                accept="image/*"
                onChange={handleImageChange}
                radius="md"
                variant="filled"
                clearable
              />

              <Button
                fullWidth
                mt="xl"
                size="md"
                onClick={handleSubmit}
                loading={isSubmitting}
                radius="xl"
                style={{
                  background: PRIMARY_GRADIENT,
                  border: 'none',
                  boxShadow: `0 8px 30px ${PRIMARY_COLOR}40`,
                  fontWeight: 700,
                  height: '50px',
                }}
              >
                Submit Sighting
              </Button>
            </SimpleGrid>
          </Card>

          <Divider my="xl" color={getBg(colorScheme, '#f0f5ff', theme.colors.dark[5])} />
          <Text size="xs" c="dimmed" ta="center">
            <IconInfoCircle size={12} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            Your sighting will help reunite families. All information is kept confidential.
          </Text>
        </Paper>
      </Container>

      <MainFooter />
    </Box>
  );
}