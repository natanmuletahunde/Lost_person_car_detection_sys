"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, Title, Text, Paper, Group, Avatar, Badge, Grid,
  Button, Divider, Skeleton, Alert, ActionIcon, Loader,
  Container, Stack
} from '@mantine/core';
import { IconArrowLeft, IconEdit, IconAlertCircle } from '@tabler/icons-react';
import Link from 'next/link';

const API_BASE_URL = 'http://localhost:3000';

// Map API person to display shape
const formatPerson = (p) => ({
  id: `person-${p.id}`,
  brand: `${p.firstName} ${p.lastName}`.trim(),
  model: 'Person',
  user: p.reportedBy || 'N/A',
  plate: 'N/A',
  date: new Date(p.dateReported).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  }),
  status: p.status || 'Unverified',
  alerts: p.alerts || 0,
  // preserve raw fields for display
  firstName: p.firstName,
  lastName: p.lastName,
  reportedBy: p.reportedBy,
  dateReported: new Date(p.dateReported).toLocaleString(),
});

// Map API vehicle to display shape
const formatVehicle = (v) => ({
  id: `vehicle-${v.id}`,
  brand: v.make || v.brand,
  model: v.model || 'Car',
  user: v.reportedBy || 'N/A',
  plate: v.plateNumber || v.plate || 'N/A',
  date: new Date(v.dateReported).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  }),
  status: v.status || 'Unverified',
  alerts: v.alerts || 0,
  // raw fields
  make: v.make,
  modelDetail: v.model,
  reportedBy: v.reportedBy,
  plateNumber: v.plateNumber,
  dateReported: new Date(v.dateReported).toLocaleString(),
});

export default function RecordDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecord = async () => {
      // Expect id in format: "person-123" or "vehicle-456"
      const rawId = params.id;
      if (!rawId) {
        setError('Invalid ID');
        setLoading(false);
        return;
      }

      const [type, id] = rawId.split('-');
      if (!type || !id || isNaN(Number(id))) {
        setError('Invalid record ID format');
        setLoading(false);
        return;
      }

      try {
        let endpoint = '';
        if (type === 'person') {
          endpoint = `${API_BASE_URL}/missingPersons/${id}`;
        } else if (type === 'vehicle') {
          endpoint = `${API_BASE_URL}/missingVehicles/${id}`;
        } else {
          throw new Error('Unknown record type');
        }

        const res = await fetch(endpoint);
        if (!res.ok) throw new Error('Record not found');

        const data = await res.json();
        const formatted = type === 'person' ? formatPerson(data) : formatVehicle(data);
        setRecord(formatted);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to load record');
      } finally {
        setLoading(false);
      }
    };

    fetchRecord();
  }, [params.id]);

  if (loading) {
    return (
      <Box p="xl" style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Loader size="xl" />
      </Box>
    );
  }

  if (error || !record) {
    return (
      <Container size="lg" py="xl">
        <Alert icon={<IconAlertCircle size={16} />} title="Not Found" color="red">
          {error || `Record with ID ${params.id} does not exist.`}
        </Alert>
        <Button component={Link} href="/admin/data" leftSection={<IconArrowLeft size={16} />} mt="md">
          Back to Data Management
        </Button>
      </Container>
    );
  }

  return (
    <Box p="xl" bg="#F4F7FE" style={{ minHeight: '100vh' }}>
      <Container size="lg">
        {/* Header */}
        <Group justify="space-between" mb="lg">
          <Group>
            <ActionIcon
              variant="subtle"
              color="blue"
              onClick={() => router.push('/admin/data')}
              size="lg"
            >
              <IconArrowLeft size={20} />
            </ActionIcon>
            <Title order={2} fw={700} c="#2B3674">Record Details</Title>
          </Group>
          <Button
            leftSection={<IconEdit size={16} />}
            variant="light"
            color="blue"
            component={Link}
            href="/admin/data"   // navigate back to list for editing
          >
            Edit Record
          </Button>
        </Group>

        {/* Detail card */}
        <Paper p="xl" radius="lg" shadow="md" withBorder>
          <Group gap="xl" mb="lg">
            <Avatar size={100} radius="xl" color="blue">
              {record.brand[0]}
            </Avatar>
            <Box>
              <Text fw={700} size="xxl" style={{ fontSize: '2rem' }}>{record.brand}</Text>
              <Group gap="xs" mt="xs">
                <Badge size="lg" color={record.status === 'Verified' ? 'green' : 'gray'}>
                  {record.status}
                </Badge>
                <Badge size="lg" color={record.alerts > 0 ? 'red' : 'gray'}>
                  {record.alerts} Alert{record.alerts !== 1 ? 's' : ''}
                </Badge>
              </Group>
            </Box>
          </Group>

          <Divider my="lg" />

          <Grid>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Text size="sm" c="dimmed">Model / Type</Text>
              <Text fw={500}>{record.model}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Text size="sm" c="dimmed">Plate Number</Text>
              <Text fw={500} fw="monospace">{record.plate}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Text size="sm" c="dimmed">Reported By</Text>
              <Text fw={500}>{record.user}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Text size="sm" c="dimmed">Date Reported</Text>
              <Text fw={500}>{record.date}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Text size="sm" c="dimmed">Full Date</Text>
              <Text fw={500}>{record.dateReported}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Text size="sm" c="dimmed">Record ID</Text>
              <Text fw={500}>{record.id}</Text>
            </Grid.Col>
          </Grid>

          <Divider my="lg" />

          <Group justify="flex-end">
            <Button variant="subtle" onClick={() => router.push('/admin/data')}>
              Back to List
            </Button>
          </Group>
        </Paper>
      </Container>
    </Box>
  );
}