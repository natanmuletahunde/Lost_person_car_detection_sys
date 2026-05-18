"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Title,
  Text,
  Group,
  Card,
  Badge,
  Button,
  Center,
  Loader,
  Alert,
  SimpleGrid,
  Box,
  useMantineColorScheme,
  ActionIcon,
} from "@mantine/core";
import { IconCar, IconMapPin, IconMap, IconAlertCircle, IconArrowLeft } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient } from "../../lib/apiClient";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";
const API_ROOT = API_BASE_URL.replace(/\/api\/v1\/?$/, '') || 'http://localhost:5000';
const MISSING_VEHICLES_API = `${API_BASE_URL}/missing-vehicles`;

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  const baseUrl = API_BASE_URL.replace("/api/v1", "");
  return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
};

export default function CarsPage() {
  const router = useRouter();
  const { colorScheme } = useMantineColorScheme();
  const [missingVehicles, setMissingVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getBg = (light, dark) => (colorScheme === "dark" ? dark : light);

  const extractArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  };

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await apiClient(MISSING_VEHICLES_API);
        if (res.ok) {
          const vehicles = extractArray(await res.json());
          setMissingVehicles(vehicles.filter((v) => v.status === "Active"));
        } else {
          setError("Failed to fetch vehicles");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, []);

  if (loading) {
    return (
      <Center style={{ minHeight: "100vh" }}>
        <Loader size="xl" color="blue" />
      </Center>
    );
  }

  return (
    <Container size="xl" py={40}>
      <Group mb="xl">
        <ActionIcon
          variant="light"
          color="blue"
          size="lg"
          radius="xl"
          onClick={() => router.back()}
        >
          <IconArrowLeft />
        </ActionIcon>
        <Box>
          <Title order={1} style={{ color: "#2f80ed" }}>
            Missing Vehicles
          </Title>
          <Text c="dimmed">Help us locate these missing vehicles</Text>
        </Box>
      </Group>

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red" mb="lg">
          {error}
        </Alert>
      )}

      {missingVehicles.length === 0 && !error ? (
        <Alert icon={<IconAlertCircle size={16} />} title="No vehicles" color="blue" variant="light">
          No missing vehicles reported yet.
        </Alert>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="lg">
          {missingVehicles.map((vehicle) => {
            return (
              <Card
                key={vehicle.id}
                radius="md"
                p={0}
                withBorder
                bg={getBg("white", "#2C2E33")}
              >
                <Box style={{ position: "relative", height: 200 }}>
                  {vehicle.imagePreview ? (
                    <Image
                      src={getImageUrl(vehicle.imagePreview) || "/default-car.jpg"}
                      fill
                      alt={vehicle.brand}
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <Center bg="gray.2" h="100%">
                      <IconCar size={48} color="gray" />
                    </Center>
                  )}
                </Box>
                <Box p="md">
                  <Text size="md" fw={700} lineClamp={1}>
                    {vehicle.brand} {vehicle.model}
                  </Text>
                  {vehicle.submodel && (
                    <Text size="sm" c="dimmed" lineClamp={1}>
                      {vehicle.submodel}
                    </Text>
                  )}
                  <Group gap={4} mt={8}>
                    <IconMapPin size={16} />
                    <Text size="sm" lineClamp={1}>
                      {vehicle.location || "Location unknown"}
                    </Text>
                  </Group>
                  <Group gap="xs" mt={8} justify="space-between">
                    <Badge size="sm" color="blue" variant="light">
                      {vehicle.color || "N/A"}
                    </Badge>
                    <Text size="sm" fw={600} style={{ fontFamily: "monospace" }}>
                      {vehicle.plateNumber || "No plate"}
                    </Text>
                  </Group>
                  <Badge size="sm" color="red" variant="filled" fullWidth mt={10}>
                    ACTIVE
                  </Badge>
                  <Button
                    component={Link}
                    href={`/user/report-sighting?type=Vehicle&caseId=${
                      vehicle.caseId || vehicle.id
                    }&plateNumber=${encodeURIComponent(
                      vehicle.plateNumber || ""
                    )}&brand=${encodeURIComponent(
                      vehicle.brand
                    )}&model=${encodeURIComponent(
                      vehicle.model
                    )}&location=${encodeURIComponent(vehicle.location || "")}`}
                    size="sm"
                    variant="light"
                    color="blue"
                    fullWidth
                    mt="md"
                    leftSection={<IconMap size={16} />}
                  >
                    Report Sighting
                  </Button>
                </Box>
              </Card>
            );
          })}
        </SimpleGrid>
      )}
    </Container>
  );
}
