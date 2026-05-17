"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, Title, Text, Paper, Group, Avatar, Badge, Grid,
  Button, Divider, Alert, ActionIcon, Loader,
  Container, Stack
} from '@mantine/core';
import { IconArrowLeft, IconEdit, IconAlertCircle } from '@tabler/icons-react';
import Link from 'next/link';
import { adminFetch, uploadUrl } from '@/app/lib/adminApi';

const getReporterLabel = (reportedBy: unknown) => {
  if (!reportedBy) return 'N/A';
  if (typeof reportedBy === 'string') return reportedBy;
  const o = reportedBy as Record<string, string>;
  const name = `${o.firstName || ''} ${o.lastName || ''}`.trim();
  return name || o.email || 'N/A';
};

export default function RecordDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [record, setRecord] = useState<Record<string, unknown> | null>(null);
  const [sightings, setSightings] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecord = async () => {
      const rawId = params.id as string;
      if (!rawId) {
        setError('Invalid ID');
        setLoading(false);
        return;
      }

      const m = rawId.match(/^(person|vehicle)-(.+)$/);
      if (!m) {
        setError('Invalid record ID format');
        setLoading(false);
        return;
      }
      const [, type, id] = m;

      try {
        const payload = await adminFetch(`/admin/cases/${type}/${id}`);
        const c = payload.case as Record<string, unknown>;
        const isPerson = type === 'person';
        const title = isPerson
          ? `${c.firstName || ''} ${c.lastName || ''}`.trim()
          : `${c.make || ''} ${c.model || ''}`.trim();
        const plate = isPerson ? 'N/A' : String(c.plateNumber || 'N/A');
        const reportDate = isPerson
          ? c.reportDate || c.createdAt
          : c.createdAt || c.lastSeenDate;

        setRecord({
          id: rawId,
          title: title || 'Record',
          model: isPerson ? 'Person' : 'Vehicle',
          user: getReporterLabel(c.reportedBy),
          plate,
          date: new Date(reportDate as string).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          status: c.status || 'Active',
          raw: c,
        });
        setSightings(payload.sightings || []);
      } catch (err) {
        console.error(err);
        setError((err as Error).message || 'Failed to load record');
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
        <Button component={Link} href="/admin/registered_data" leftSection={<IconArrowLeft size={16} />} mt="md">
          Back to Data Management
        </Button>
      </Container>
    );
  }

  const raw = record.raw as Record<string, unknown>;
  const rawImgs = (raw.images as string[] | undefined) || [];
  const imgs = rawImgs.length > 0 ? rawImgs : (raw.imagePreview ? [raw.imagePreview as string] : []);

  return (
    <Box p="xl" bg="#F4F7FE" style={{ minHeight: '100vh' }}>
      <Container size="lg">
        <Group justify="space-between" mb="lg">
          <Group>
            <ActionIcon
              variant="subtle"
              color="blue"
              onClick={() => router.push('/admin/registered_data')}
              size="lg"
            >
              <IconArrowLeft size={20} />
            </ActionIcon>
            <Title order={2} fw={700} c="#2B3674">
              Record Details
            </Title>
          </Group>
          <Button
            leftSection={<IconEdit size={16} />}
            variant="light"
            color="blue"
            component={Link}
            href="/admin/registered_data"
          >
            Back to list
          </Button>
        </Group>

        <Paper p="xl" radius="lg" shadow="md" withBorder>
          <Group gap="xl" mb="lg">
            <Avatar size={100} radius="xl" color="blue" src={imgs[0] ? uploadUrl(imgs[0]) : undefined}>
              {String(record.title).charAt(0)}
            </Avatar>
            <Box>
              <Text fw={700} size="xxl" style={{ fontSize: '2rem' }}>
                {String(record.title)}
              </Text>
              <Group gap="xs" mt="xs">
                <Badge size="lg" color={record.status === 'Resolved' ? 'green' : 'gray'}>
                  {String(record.status)}
                </Badge>
                <Badge size="lg" color="blue">
                  {String(record.model)}
                </Badge>
              </Group>
            </Box>
          </Group>

          <Divider my="lg" />

          <Grid>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Text size="sm" c="dimmed">
                Type
              </Text>
              <Text fw={500}>{String(record.model)}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Text size="sm" c="dimmed">
                Plate / ID
              </Text>
              <Text fw={500} style={{ fontFamily: 'monospace' }}>
                {String(record.plate)}
              </Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Text size="sm" c="dimmed">
                Reported By
              </Text>
              <Text fw={500}>{String(record.user)}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Text size="sm" c="dimmed">
                Report date
              </Text>
              <Text fw={500}>{String(record.date)}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Text size="sm" c="dimmed">
                Case ID
              </Text>
              <Text fw={500}>{String(raw.caseId || '—')}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Text size="sm" c="dimmed">
                Record key
              </Text>
              <Text fw={500}>{String(record.id)}</Text>
            </Grid.Col>
          </Grid>

          {imgs.length > 0 && (
            <>
              <Divider my="lg" />
              <Title order={5} mb="sm">
                Images
              </Title>
              <Group gap="md">
                {imgs.map((src) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={src}
                    src={uploadUrl(src)}
                    alt=""
                    style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8 }}
                  />
                ))}
              </Group>
            </>
          )}

          {sightings.length > 0 && (
            <>
              <Divider my="lg" />
              <Title order={5} mb="sm">
                Recent sightings ({sightings.length})
              </Title>
              <Stack gap="xs">
                {sightings.slice(0, 5).map((s: unknown) => {
                  const sv = s as Record<string, unknown>;
                  return (
                    <Paper key={String(sv._id)} p="sm" withBorder>
                      <Text size="sm">{String(sv.description || '')}</Text>
                      <Badge size="sm" mt={4}>
                        {String(sv.status || 'pending')}
                      </Badge>
                    </Paper>
                  );
                })}
              </Stack>
            </>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
