'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
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
} from '@tabler/icons-react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import MainFooter from '../../components/MainFooter';
import { useMediaQuery } from '@mantine/hooks';
import { useTranslations } from 'next-intl';

// Real backend API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';
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

function ReportSightingPageContent() {
  const router = useRouter();
  const t = useTranslations('ReportSighting');
  const searchParams = useSearchParams(); // get query parameters
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);

  const [currentUser, setCurrentUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHelpVisible, setIsHelpVisible] = useState(false);
  const [prefilled, setPrefilled] = useState(false);
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
      sessionStorage.setItem('redirectUrl', window.location.pathname + window.location.search);
      notifications.show({
        title: 'Login Required',
        message: 'Please login to submit a sighting',
        color: 'yellow',
        icon: <IconAlertCircle size={20} />,
      });
      router.push('/authentication/login');
      return;
    }
    setCurrentUser(JSON.parse(userData));
  }, [router]);

  const typeParam = searchParams ? searchParams.get('type') : null;
  const nameParam = searchParams ? searchParams.get('name') : null;
  const plateNumberParam = searchParams ? searchParams.get('plateNumber') : null;
  const locationParam = searchParams ? searchParams.get('location') : null;
  const caseIdParam = searchParams ? searchParams.get('caseId') : null;

  // Prefill form from URL parameters
  useEffect(() => {
    if (prefilled) return;
    
    if (typeParam || nameParam || plateNumberParam || locationParam) {
      setFormValues(prev => ({
        ...prev,
        type: typeParam || prev.type,
        name: nameParam || prev.name,
        plateNumber: plateNumberParam || prev.plateNumber,
        location: locationParam || prev.location,
      }));
      setPrefilled(true);
    }
  }, [typeParam, nameParam, plateNumberParam, locationParam, prefilled]);

  // Fetch details by caseId if name or plateNumber are not provided directly in URL
  useEffect(() => {
    if (!caseIdParam || prefilled) return;

    const fetchCaseDetails = async () => {
      try {
        const isPerson = typeParam?.toLowerCase() === 'person';
        const url = isPerson
          ? `${API_BASE_URL}/missing-persons/${caseIdParam}`
          : `${API_BASE_URL}/missing-vehicles/${caseIdParam}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch case details');
        
        const result = await res.json();
        if (result?.success && result?.data) {
          if (isPerson) {
            const p = result.data.person;
            if (p) {
              setFormValues(prev => ({
                ...prev,
                type: 'Person',
                name: `${p.firstName} ${p.lastName}`,
                location: p.location || '',
              }));
              setPrefilled(true);
            }
          } else {
            const v = result.data.vehicle;
            if (v) {
              setFormValues(prev => ({
                ...prev,
                type: 'Vehicle',
                plateNumber: v.plateNumber || '',
                location: v.location || '',
              }));
              setPrefilled(true);
            }
          }
        }
      } catch (err) {
        console.error('Error prefilling from caseId:', err);
      }
    };

    fetchCaseDetails();
  }, [caseIdParam, typeParam, prefilled]);

  const handleLocationSelect = (lat, lng, address) => {
    setFormValues((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      location: address,
    }));
  };

  const tryRefreshAccessToken = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return null;
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ refreshToken }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.data) return null;
      const access = data.data.accessToken || data.data.token;
      const nextRefresh = data.data.refreshToken;
      if (!access) return null;
      localStorage.setItem('accessToken', access);
      localStorage.setItem('token', access);
      if (nextRefresh) localStorage.setItem('refreshToken', nextRefresh);
      return access;
    } catch {
      return null;
    }
  };

  const submitSightingToBackend = async (data, token) => {
    const post = (t) =>
      fetch(SIGHTINGS_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${t}`,
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

    let response = await post(token);
    if (response.status === 401) {
      const next = await tryRefreshAccessToken();
      if (next) response = await post(next);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const msg =
        errorData?.message ||
        (Array.isArray(errorData?.errors) && errorData.errors[0]?.msg) ||
        `Failed to submit sighting: ${response.statusText}`;
      throw new Error(msg);
    }

    return response.json();
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const required = ['type', 'location'];
    if (formValues.type === 'Person') required.push('name');
    else required.push('plateNumber');

    const missing = required.filter((f) => !formValues[f] || formValues[f].toString().trim() === '');
    if (missing.length > 0) {
      notifications.show({
        title: t('missingFields'),
        message: `${t('missingFieldsDesc')} ${missing.join(', ')}`,
        color: 'red',
        icon: <IconAlertCircle size={20} />,
      });
      return;
    }

    const latitude = Number(formValues.latitude);
    const longitude = Number(formValues.longitude);
    const hasValidCoords =
      !Number.isNaN(latitude) &&
      !Number.isNaN(longitude) &&
      formValues.latitude !== '' &&
      formValues.longitude !== '' &&
      !(latitude === 0 && longitude === 0);
    if (!hasValidCoords) {
      notifications.show({
        title: t('locationReq'),
        message: t('locationReqDesc'),
        color: 'red',
        icon: <IconAlertCircle size={20} />,
      });
      return;
    }

    const authToken =
      localStorage.getItem('accessToken') ||
      localStorage.getItem('token') ||
      currentUser?.token ||
      null;

    if (!authToken) {
      notifications.show({
        title: t('authReq'),
        message: t('authReqDesc') || 'Please login again. No API token was found.',
        color: 'yellow',
        icon: <IconAlertCircle size={20} />,
      });
      router.push('/authentication/login');
      return;
    }

    const sightingType = String(formValues.type || 'Person').toLowerCase();
    if (sightingType !== 'person' && sightingType !== 'vehicle') {
      notifications.show({
        title: t('invalidType') || 'Invalid type',
        message: t('invalidTypeDesc') || 'Please choose Person or Vehicle.',
        color: 'red',
        icon: <IconAlertCircle size={20} />,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const combinedDateTime =
        formValues.date && formValues.time
          ? new Date(`${formValues.date}T${formValues.time}`).toISOString()
          : new Date().toISOString();

      const baseDescription = formValues.description?.trim()
        ? formValues.description.trim()
        : 'No additional details provided';
      const subjectInfo =
        formValues.type === 'Person'
          ? `Person name: ${formValues.name}`
          : `Vehicle plate: ${formValues.plateNumber}`;

      let description = `${subjectInfo}. ${baseDescription}. Seen at: ${combinedDateTime}`;
      const MAX_DESC = 1000;
      if (description.length > MAX_DESC) {
        description = description.slice(0, MAX_DESC);
      }

      const payload = {
        type: sightingType,
        name: formValues.type === 'Person' ? formValues.name : undefined,
        plateNumber: formValues.type === 'Vehicle' ? formValues.plateNumber : undefined,
        description,
        location: {
          type: 'Point',
          coordinates: [longitude, latitude],
          address: (formValues.location || '').slice(0, 300),
        },
        images: formValues.imagePreview ? [formValues.imagePreview] : [],
      };

      await submitSightingToBackend(payload, authToken);

      notifications.show({
        title: t('thankYou'),
        message: t('successDesc'),
        color: 'green',
        icon: <IconCheck size={20} />,
      });
      // Navigate directly to dashboard — avoid root redirect chain
      router.push('/user/dashboard');
    } catch (err) {
      console.error('Error submitting sighting:', err);
      notifications.show({
        title: t('failedTitle') || 'Submission Failed',
        message: err?.message || t('failedDesc') || 'Failed to submit sighting. Please try again.',
        color: 'red',
        icon: <IconAlertCircle size={20} />,
      });
    } finally {
      setIsSubmitting(false);
    }
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
            {t('title')}
          </Title>
          <Text mb="xl" c="dimmed" size="sm">
            {t('subtitle')}
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
                label={t('type')}
                value={formValues.type}
                onChange={(v) => setFormValues((p) => ({ ...p, type: v }))}
                data={[
                  { value: 'Person', label: t('person') },
                  { value: 'Vehicle', label: t('vehicle') },
                ]}
                radius="md"
                variant="filled"
                styles={{
                  input: { borderColor: getBg(colorScheme, '#f0f5ff', theme.colors.dark[5]) },
                }}
              />

              {formValues.type === 'Person' ? (
                <TextInput
                  label={t('personName')}
                  placeholder="John Doe"
                  value={formValues.name}
                  onChange={(e) => setFormValues((p) => ({ ...p, name: e.target.value }))}
                  radius="md"
                  variant="filled"
                />
              ) : (
                <TextInput
                  label={t('plateNumber')}
                  placeholder="AA-12345"
                  value={formValues.plateNumber}
                  onChange={(e) => setFormValues((p) => ({ ...p, plateNumber: e.target.value }))}
                  radius="md"
                  variant="filled"
                />
              )}

              <Textarea
                label={t('details')}
                placeholder={t('detailsPlaceholder')}
                minRows={3}
                value={formValues.description}
                onChange={(e) => setFormValues((p) => ({ ...p, description: e.target.value }))}
                radius="md"
                variant="filled"
              />

              <TextInput
                label={t('location')}
                placeholder={t('locationPlaceholder')}
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
                  label={t('date')}
                  type="date"
                  value={formValues.date}
                  onChange={(e) => setFormValues((p) => ({ ...p, date: e.target.value }))}
                  radius="md"
                  variant="filled"
                />
                <TextInput
                  label={t('time')}
                  type="time"
                  value={formValues.time}
                  onChange={(e) => setFormValues((p) => ({ ...p, time: e.target.value }))}
                  radius="md"
                  variant="filled"
                />
              </SimpleGrid>

              <FileInput
                label={t('photo')}
                placeholder={t('photoPlaceholder')}
                leftSection={<IconUpload size={16} color={PRIMARY_COLOR} />}
                accept="image/*"
                onChange={handleImageChange}
                radius="md"
                variant="filled"
                clearable
              />

              <Button
                type="button"
                fullWidth
                mt="xl"
                size="md"
                onClick={handleSubmit}
                loading={isSubmitting}
                disabled={isSubmitting}
                radius="xl"
                style={{
                  background: PRIMARY_GRADIENT,
                  border: 'none',
                  boxShadow: `0 8px 30px ${PRIMARY_COLOR}40`,
                  fontWeight: 700,
                  height: '50px',
                }}
              >
                {isSubmitting ? t('submitting') : t('submit')}
              </Button>
            </SimpleGrid>
          </Card>

          <Divider my="xl" color={getBg(colorScheme, '#f0f5ff', theme.colors.dark[5])} />
          <Text size="xs" c="dimmed" ta="center">
            <IconInfoCircle size={12} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            {t('confidential')}
          </Text>
        </Paper>
      </Container>

      <MainFooter />
    </Box>
  );
}

export default function ReportSightingPage() {
  return (
    <Suspense
      fallback={
        <Box
          style={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f0f5ff',
          }}
        >
          <Loader size="xl" color="#0034D1" />
        </Box>
      }
    >
      <ReportSightingPageContent />
    </Suspense>
  );
}