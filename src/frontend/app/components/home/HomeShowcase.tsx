"use client";
import { useState, useEffect } from "react";
import { Box, Container, Title, Text, Group, Card, Badge, Button, Center, Loader, Alert, ScrollArea, useMantineColorScheme, Flex } from "@mantine/core";
import { IconCar, IconUser as IconUserPerson, IconAlertCircle, IconMapPin, IconMap } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { apiClient } from "../../../backend/apiClient"; // I will use the built-in fetch if apiClient is not available, or define it locally.

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";
const API_ROOT = API_BASE_URL.replace(/\/api\/v1\/?$/, '') || 'http://localhost:5000';

function getImageUrl(item: any) {
  if (item.imagePreview) return item.imagePreview;
  if (Array.isArray(item.images) && item.images[0]) {
    const path = item.images[0];
    if (path.startsWith('http')) return path;
    return `${API_ROOT}${path.startsWith('/') ? path : `/${path}`}`;
  }
  return null;
}

export default function HomeShowcase() {
  const { colorScheme } = useMantineColorScheme();
  const getBg = (light: string, dark: string) => (colorScheme === "dark" ? dark : light);
  const getJustify = (items: any[]) => {
    if (items.length === 1) return "center";
    if (items.length > 1 && items.length <= 3) {
      return { base: "flex-start", sm: "center" };
    }
    return "flex-start";
  };

  const [missingPersons, setMissingPersons] = useState([]);
  const [missingVehicles, setMissingVehicles] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const fetchMissingData = async () => {
      setDataLoading(true);
      try {
        const [personsRes, vehiclesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/missing-persons`).then(res => res.json()).catch(() => ({ data: [] })),
          fetch(`${API_BASE_URL}/missing-vehicles`).then(res => res.json()).catch(() => ({ data: [] }))
        ]);

        const extractArray = (payload: any) => {
          if (Array.isArray(payload)) return payload;
          if (Array.isArray(payload?.data)) return payload.data;
          return [];
        };

        const persons = extractArray(personsRes);
        const vehicles = extractArray(vehiclesRes);
        
        setMissingPersons(persons.filter((p: any) => p.status === "Active"));
        setMissingVehicles(vehicles.filter((v: any) => v.status === "Active"));
      } catch (error) {
        console.error("Error fetching missing data:", error);
      } finally {
        setDataLoading(false);
      }
    };

    fetchMissingData();
  }, []);

  return (
    <Box id="cases" py={{ base: 60, md: 100 }} bg="transparent">
      <Container size="xl">
        <Title order={2} ta="center" fw={900} mb="sm" style={{ color: "#2f80ed" }}>
          Active Community Alerts
        </Title>
        <Text c="dimmed" ta="center" maw={600} mx="auto" mb={50}>
          Take a look at the current active cases. Your vigilance can help bring someone home or recover a stolen vehicle.
        </Text>

        <Box mb={60}>
          <Flex align="center" gap="sm" mb="lg">
            <IconUserPerson size={24} color="#2f80ed" />
            <Title order={3}>Have you seen this person?</Title>
          </Flex>
          {dataLoading ? (
            <Center py="xl"><Loader color="blue" /></Center>
          ) : missingPersons.length === 0 ? (
            <Alert icon={<IconAlertCircle size={16} />} title="No persons" color="blue" variant="light">
              No missing persons reported currently.
            </Alert>
          ) : (
            <ScrollArea w="100%" pb="xl">
              <Group wrap="nowrap" gap="lg" justify={getJustify(missingPersons)}>
                {missingPersons.slice(0, 6).map((person: any) => {
                  const personId = person._id || person.id;
                  const imageUrl = getImageUrl(person);
                  return (
                    <Card key={personId} radius="md" w={{ base: 220, sm: 260 }} p={0} withBorder bg={getBg("white", "#2C2E33")}>
                      <Box style={{ position: "relative", height: 200 }}>
                        {imageUrl ? (
                          <Image src={imageUrl} fill alt={`${person.firstName} ${person.lastName}`} style={{ objectFit: "cover" }} />
                        ) : (
                          <Center bg="gray.2" h="100%"><IconUserPerson size={48} color="gray" /></Center>
                        )}
                      </Box>
                      <Box p="xs">
                        <Text size="sm" fw={700} lineClamp={1}>{person.firstName} {person.lastName}</Text>
                        <Group gap="xs" mt={2}>
                          <Badge size="xs" color="pink" variant="light">{person.gender || "Unknown"}</Badge>
                          <Badge size="xs" color="cyan" variant="light">Age {person.age || "?"}</Badge>
                        </Group>
                        <Group gap={4} mt={4}>
                          <IconMapPin size={12} />
                          <Text size="xs" lineClamp={1}>{person.location || "Location unknown"}</Text>
                        </Group>
                        <Badge size="xs" color="red" variant="filled" fullWidth mt={6}>ACTIVE</Badge>
                        <Button component={Link} href={`/user/report-sighting?type=Person&caseId=${person.caseId || personId}`} size="xs" variant="light" color="blue" fullWidth mt="xs" leftSection={<IconMap size={14} />}>
                          Report Sighting
                        </Button>
                      </Box>
                    </Card>
                  );
                })}
              </Group>
            </ScrollArea>
          )}
        </Box>

        <Box>
          <Flex align="center" gap="sm" mb="lg">
            <IconCar size={24} color="#2f80ed" />
            <Title order={3}>Have you seen this car?</Title>
          </Flex>
          {dataLoading ? (
            <Center py="xl"><Loader color="blue" /></Center>
          ) : missingVehicles.length === 0 ? (
            <Alert icon={<IconAlertCircle size={16} />} title="No vehicles" color="blue" variant="light">
              No missing vehicles reported currently.
            </Alert>
          ) : (
            <ScrollArea w="100%" pb="xl">
              <Group wrap="nowrap" gap="lg" justify={getJustify(missingVehicles)}>
                {missingVehicles.slice(0, 6).map((vehicle: any) => {
                  const vehicleId = vehicle._id || vehicle.id;
                  const imageUrl = getImageUrl(vehicle);
                  return (
                    <Card key={vehicleId} radius="md" w={{ base: 240, sm: 280 }} p={0} withBorder bg={getBg("white", "#2C2E33")}>
                      <Box style={{ position: "relative", height: 160 }}>
                        {imageUrl ? (
                          <Image src={imageUrl} fill alt={vehicle.brand} style={{ objectFit: "cover" }} />
                        ) : (
                          <Center bg="gray.2" h="100%"><IconCar size={48} color="gray" /></Center>
                        )}
                      </Box>
                      <Box p="xs">
                        <Text size="sm" fw={700} lineClamp={1}>{vehicle.brand} {vehicle.model}</Text>
                        <Group gap={4} mt={4}>
                          <IconMapPin size={12} />
                          <Text size="xs" lineClamp={1}>{vehicle.location || "Location unknown"}</Text>
                        </Group>
                        <Group gap="xs" mt={4} justify="space-between">
                          <Badge size="xs" color="blue" variant="light">{vehicle.color || "N/A"}</Badge>
                          <Text size="xs" fw={600} style={{ fontFamily: "monospace" }}>{vehicle.plateNumber || "No plate"}</Text>
                        </Group>
                        <Badge size="xs" color="red" variant="filled" fullWidth mt={6}>ACTIVE</Badge>
                        <Button component={Link} href={`/user/report-sighting?type=Vehicle&caseId=${vehicle.caseId || vehicleId}`} size="xs" variant="light" color="blue" fullWidth mt="xs" leftSection={<IconMap size={14} />}>
                          Report Sighting
                        </Button>
                      </Box>
                    </Card>
                  );
                })}
              </Group>
            </ScrollArea>
          )}
        </Box>
      </Container>
    </Box>
  );
}
