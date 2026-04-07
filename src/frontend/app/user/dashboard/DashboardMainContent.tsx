// components/DashboardMainContent.tsx
"use client";
import {
  Container,
  SimpleGrid,
  Button,
  Paper,
  Title,
  Text,
  Group,
  Box,
  Grid,
  Card,
  Badge,
  ScrollArea,
  Center,
  Loader,
  Alert,
  Flex,
  Stack,
  ActionIcon,
  Table,
  Avatar,
} from "@mantine/core";
import {
  IconPlus,
  IconMap,
  IconCar,
  IconUser as IconUserPerson,
  IconMapPin,
  IconFileReport,
  IconCheck,
  IconUsers,
  IconSearch,
  IconChevronRight,
  IconEye,
  IconEdit,
  IconTrash,
  IconFilter,
  IconSortAscending,
  IconDownload,
  IconRefresh,
  IconGps,
  IconMessageCircle,
  IconClock,
  IconLocation,
  IconAlertCircle, // <-- added missing import
} from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useMediaQuery } from "@mantine/hooks"; // <-- added missing import

const LocationPicker = dynamic(() => import("../../components/LocationPicker"), {
  ssr: false,
});
const GpsTracker = dynamic(() => import("../../components/GpsTracker"), {
  ssr: false,
});

interface DashboardMainContentProps {
  user: any;
  missingPersons: any[];
  missingVehicles: any[];
  userReports: any[];
  recentSightings: any[];
  dataLoading: boolean;
  colorScheme: "light" | "dark";
  getUserRoute: (path: string) => string;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
}

export default function DashboardMainContent({
  user,
  missingPersons,
  missingVehicles,
  userReports,
  recentSightings,
  dataLoading,
  colorScheme,
  getUserRoute,
  getStatusColor,
  getPriorityColor,
}: DashboardMainContentProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const getBg = (light: string, dark: string) =>
    colorScheme === "dark" ? dark : light;

  return (
    <Container size="xl" py={{ base: 30, md: 40 }}>
      {/* Quick Actions */}
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg" mb="xl">
        <Button
          component={Link}
          href={getUserRoute("/user/register")}
          size="lg"
          radius="md"
          leftSection={<IconPlus size={20} />}
          fullWidth
          style={{
            background: "linear-gradient(135deg, #2f80ed 0%, #1e56a0 100%)",
            height: 80,
            fontSize: 18,
          }}
        >
          Report Missing
        </Button>
        <Button
          component={Link}
          href={getUserRoute("/user/report-sighting")}
          size="lg"
          radius="md"
          leftSection={<IconMap size={20} />}
          fullWidth
          variant="outline"
          color="blue"
          style={{ height: 80, fontSize: 18, borderWidth: 2 }}
        >
          Report Sighting
        </Button>
      </SimpleGrid>

      {/* User Stats Dashboard */}
      {user && (
        <Paper
          p={{ base: "lg", md: "xl" }}
          radius="lg"
          bg={getBg("#f0f5ff", "#1C2F4A")}
          mb="xl"
        >
          <Group justify="space-between" mb="md">
            <Title order={3} style={{ color: "#2f80ed" }}>
              Your Dashboard Stats
            </Title>
            <Button
              variant="subtle"
              color="blue"
              size="sm"
              rightSection={<IconRefresh size={16} />}
              onClick={() => window.location.reload()}
            >
              Refresh
            </Button>
          </Group>
          <SimpleGrid cols={{ base: 2, sm: 2, md: 4 }} spacing="lg">
            {[
              {
                label: "Reports Filed",
                value: userReports.length,
                color: "blue",
                icon: <IconFileReport />,
                trend: `+${userReports.length}`,
              },
              {
                label: "Items Found",
                value: userReports.filter((r) => r.status === "Resolved").length,
                color: "green",
                icon: <IconCheck />,
                trend: "+0",
              },
              {
                label: "Active Searches",
                value: userReports.filter((r) => r.status === "Active").length,
                color: "orange",
                icon: <IconSearch />,
                trend: "+0",
              },
              {
                label: "Community Help",
                value: 27,
                color: "grape",
                icon: <IconUsers />,
                trend: "+5",
              },
            ].map((stat, idx) => (
              <Paper
                key={idx}
                p="md"
                bg={getBg("white", "#2C2E33")}
                radius="md"
                withBorder
              >
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Box style={{ color: `var(--mantine-color-${stat.color}-6)` }}>
                      {stat.icon}
                    </Box>
                    <Badge size="sm" color={stat.color} variant="light">
                      {stat.trend}
                    </Badge>
                  </Group>
                  <Title
                    order={2}
                    style={{ color: `var(--mantine-color-${stat.color}-6)` }}
                  >
                    {stat.value}
                  </Title>
                  <Text size="sm" c="dimmed">
                    {stat.label}
                  </Text>
                </Stack>
              </Paper>
            ))}
          </SimpleGrid>
        </Paper>
      )}

      {/* Reported Cases Table (if user has reports) */}
      {user && userReports.length > 0 && (
        <Paper
          p={{ base: "md", md: "lg" }}
          radius="lg"
          withBorder
          shadow="sm"
          mb="xl"
        >
          <Group justify="space-between" mb="lg">
            <Flex align="center" gap="sm">
              <IconFileReport size={24} color="#2f80ed" />
              <Title order={2} size="h3">
                Your Recent Reports
              </Title>
            </Flex>
            <Group gap="sm">
              <Button
                variant="outline"
                color="blue"
                leftSection={<IconFilter size={16} />}
                size="sm"
              >
                Filter
              </Button>
              <Button
                variant="outline"
                color="blue"
                leftSection={<IconSortAscending size={16} />}
                size="sm"
              >
                Sort
              </Button>
              <Button
                color="blue"
                leftSection={<IconDownload size={16} />}
                size="sm"
              >
                Export
              </Button>
            </Group>
          </Group>
          <ScrollArea>
            <Table
              verticalSpacing="md"
              highlightOnHover
              withTableBorder
              withColumnBorders
              striped
            >
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Case ID</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Priority</Table.Th>
                  <Table.Th>Location</Table.Th>
                  <Table.Th>Date</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {userReports.slice(0, 6).map((caseItem) => (
                  <Table.Tr key={caseItem.id}>
                    <Table.Td>
                      <Text fw={600}>{caseItem.caseId || `#${caseItem.id}`}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        {caseItem.type === "Vehicle" ? (
                          <IconCar size={16} />
                        ) : (
                          <IconUserPerson size={16} />
                        )}
                        <Text>{caseItem.type}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={getStatusColor(caseItem.status)}
                        variant="light"
                        size="sm"
                      >
                        {caseItem.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={getPriorityColor(caseItem.priority)}
                        variant="light"
                        size="sm"
                      >
                        {caseItem.priority || "Medium"}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <IconLocation size={14} />
                        <Text size="sm" lineClamp={1}>
                          {caseItem.location}
                        </Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {new Date(
                          caseItem.reportDate || caseItem.lastSeenDate
                        ).toLocaleDateString()}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs" wrap="nowrap">
                        <ActionIcon
                          variant="subtle"
                          color="blue"
                          size="sm"
                          component={Link}
                          href={getUserRoute(`/case/${caseItem.id}`)}
                        >
                          <IconEye size={16} />
                        </ActionIcon>
                        <ActionIcon variant="subtle" color="green" size="sm">
                          <IconEdit size={16} />
                        </ActionIcon>
                        <ActionIcon variant="subtle" color="red" size="sm">
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
          {userReports.length > 6 && (
            <Group
              justify="space-between"
              mt="lg"
              pt="md"
              style={{
                borderTop: `1px solid ${getBg("#e9ecef", "#2C2E33")}`,
              }}
            >
              <Text size="sm" c="dimmed">
                Showing 6 of {userReports.length} cases
              </Text>
              <Button
                variant="light"
                color="blue"
                rightSection={<IconChevronRight size={16} />}
                component={Link}
                href={getUserRoute("/reported-cases")}
                radius="xl"
              >
                View All Cases
              </Button>
            </Group>
          )}
        </Paper>
      )}

      {/* Missing Cars Section */}
      <Paper mb="xl" p={{ base: "md", md: "lg" }} withBorder radius="lg">
        <Group justify="space-between" mb="lg">
          <Flex align="center" gap="sm">
            <IconCar size={24} color="#2f80ed" />
            <Title order={2} size="h3">
              Have you seen this car?
            </Title>
          </Flex>
          <ActionIcon
            variant="light"
            radius="xl"
            color="blue"
            component={Link}
            href={getUserRoute("/cars")}
            size="lg"
          >
            <IconChevronRight />
          </ActionIcon>
        </Group>
        {dataLoading ? (
          <Center py="xl">
            <Loader color="blue" />
          </Center>
        ) : missingVehicles.length === 0 ? (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="No vehicles"
            color="blue"
            variant="light"
          >
            No missing vehicles reported yet.
          </Alert>
        ) : (
          <ScrollArea w="100%" pb="xl">
            <Group wrap="nowrap" gap="lg">
              {missingVehicles.slice(0, 6).map((vehicle) => (
                <Card
                  key={vehicle.id}
                  radius="md"
                  w={{ base: 240, sm: 280 }}
                  p={0}
                  withBorder
                  bg={getBg("white", "#2C2E33")}
                >
                  <Box style={{ position: "relative", height: 160 }}>
                    {vehicle.imagePreview ? (
                      <Image
                        src={vehicle.imagePreview}
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
                  <Box p="xs">
                    <Text size="sm" fw={700} lineClamp={1}>
                      {vehicle.brand} {vehicle.model}
                    </Text>
                    {vehicle.submodel && (
                      <Text size="xs" c="dimmed" lineClamp={1}>
                        {vehicle.submodel}
                      </Text>
                    )}
                    <Group gap={4} mt={4}>
                      <IconMapPin size={12} />
                      <Text size="xs" lineClamp={1}>
                        {vehicle.location || "Location unknown"}
                      </Text>
                    </Group>
                    <Group gap="xs" mt={4} justify="space-between">
                      <Badge size="xs" color="blue" variant="light">
                        {vehicle.color || "N/A"}
                      </Badge>
                      <Text size="xs" fw={600} style={{ fontFamily: "monospace" }}>
                        {vehicle.plateNumber || "No plate"}
                      </Text>
                    </Group>
                    <Badge size="xs" color="red" variant="filled" fullWidth mt={6}>
                      ACTIVE
                    </Badge>
                    <Button
                      component={Link}
                      href={getUserRoute(
                        `/report-sighting?type=Vehicle&caseId=${
                          vehicle.caseId || vehicle.id
                        }&plateNumber=${encodeURIComponent(
                          vehicle.plateNumber || ""
                        )}&brand=${encodeURIComponent(
                          vehicle.brand
                        )}&model=${encodeURIComponent(
                          vehicle.model
                        )}&location=${encodeURIComponent(vehicle.location || "")}`
                      )}
                      size="xs"
                      variant="light"
                      color="blue"
                      fullWidth
                      mt="xs"
                      leftSection={<IconMap size={14} />}
                    >
                      Report Sighting
                    </Button>
                  </Box>
                </Card>
              ))}
            </Group>
          </ScrollArea>
        )}
      </Paper>

      {/* Missing People Section */}
      <Paper mb="xl" p={{ base: "md", md: "lg" }} withBorder radius="lg">
        <Group justify="space-between" mb="lg">
          <Flex align="center" gap="sm">
            <IconUserPerson size={24} color="#2f80ed" />
            <Title order={2} size="h3">
              Have you seen this person?
            </Title>
          </Flex>
          <ActionIcon
            variant="light"
            radius="xl"
            color="blue"
            component={Link}
            href={getUserRoute("/people")}
            size="lg"
          >
            <IconChevronRight />
          </ActionIcon>
        </Group>
        {dataLoading ? (
          <Center py="xl">
            <Loader color="blue" />
          </Center>
        ) : missingPersons.length === 0 ? (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="No persons"
            color="blue"
            variant="light"
          >
            No missing persons reported yet.
          </Alert>
        ) : (
          <ScrollArea w="100%" pb="xl">
            <Group wrap="nowrap" gap="lg">
              {missingPersons.slice(0, 6).map((person) => (
                <Card
                  key={person.id}
                  radius="md"
                  w={{ base: 220, sm: 260 }}
                  p={0}
                  withBorder
                  bg={getBg("white", "#2C2E33")}
                >
                  <Box style={{ position: "relative", height: 200 }}>
                    {person.imagePreview ? (
                      <Image
                        src={person.imagePreview}
                        fill
                        alt={`${person.firstName} ${person.lastName}`}
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <Center bg="gray.2" h="100%">
                        <IconUserPerson size={48} color="gray" />
                      </Center>
                    )}
                  </Box>
                  <Box p="xs">
                    <Text size="sm" fw={700} lineClamp={1}>
                      {person.firstName} {person.lastName}
                    </Text>
                    <Group gap="xs" mt={2}>
                      <Badge size="xs" color="pink" variant="light">
                        {person.gender || "Unknown"}
                      </Badge>
                      <Badge size="xs" color="cyan" variant="light">
                        Age {person.age || "?"}
                      </Badge>
                    </Group>
                    <Group gap={4} mt={4}>
                      <IconMapPin size={12} />
                      <Text size="xs" lineClamp={1}>
                        {person.location || "Location unknown"}
                      </Text>
                    </Group>
                    {person.description && (
                      <Text size="xs" c="dimmed" lineClamp={2} mt={4}>
                        {person.description}
                      </Text>
                    )}
                    <Badge size="xs" color="red" variant="filled" fullWidth mt={6}>
                      ACTIVE
                    </Badge>
                    <Button
                      component={Link}
                      href={getUserRoute(
                        `/report-sighting?type=Person&caseId=${
                          person.caseId || person.id
                        }&name=${encodeURIComponent(
                          person.firstName + " " + person.lastName
                        )}&location=${encodeURIComponent(person.location || "")}`
                      )}
                      size="xs"
                      variant="light"
                      color="blue"
                      fullWidth
                      mt="xs"
                      leftSection={<IconMap size={14} />}
                    >
                      Report Sighting
                    </Button>
                  </Box>
                </Card>
              ))}
            </Group>
          </ScrollArea>
        )}
      </Paper>

      {/* Interactive Map */}
      <Paper mb="xl" p={{ base: "md", md: "lg" }} withBorder radius="lg">
        <Flex align="center" gap="sm" mb="lg">
          <IconMap size={24} color="#2f80ed" />
          <Title order={3}>Nearby Missing Items</Title>
        </Flex>
        <Box style={{ height: 400, borderRadius: "12px", overflow: "hidden" }}>
          <LocationPicker
            onLocationSelect={() => {}}
            initialPosition={[9.03, 38.74]}
            markers={[
              ...missingPersons.map((p) => ({
                lat: p.latitude || 9.03,
                lng: p.longitude || 38.74,
                title: `${p.firstName} ${p.lastName}`,
                type: "person",
              })),
              ...missingVehicles.map((v) => ({
                lat: v.latitude || 9.03,
                lng: v.longitude || 38.74,
                title: `${v.brand} ${v.model}`,
                type: "vehicle",
              })),
            ]}
          />
        </Box>
      </Paper>

      {/* Recent Sightings */}
      <Paper mb="xl" p={{ base: "md", md: "lg" }} withBorder radius="lg">
        <Flex align="center" gap="sm" mb="lg">
          <IconMessageCircle size={24} color="#2f80ed" />
          <Title order={3}>Recent Sightings</Title>
        </Flex>
        {recentSightings.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            No recent sightings
          </Text>
        ) : (
          <Stack gap="md">
            {recentSightings.map((sighting) => (
              <Card key={sighting.id} withBorder p="sm" radius="md">
                <Group gap="sm" align="flex-start">
                  <Avatar color="blue" radius="xl">
                    {sighting.type === "Person" ? (
                      <IconUserPerson size={16} />
                    ) : (
                      <IconCar size={16} />
                    )}
                  </Avatar>
                  <Box style={{ flex: 1 }}>
                    <Text size="sm" fw={500}>
                      {sighting.type === "Person"
                        ? sighting.name
                        : sighting.plateNumber}
                    </Text>
                    <Group gap="xs" mt={4}>
                      <IconMapPin size={12} />
                      <Text size="xs" c="dimmed" lineClamp={1}>
                        {sighting.location}
                      </Text>
                    </Group>
                    <Group gap="xs" mt={4}>
                      <IconClock size={12} />
                      <Text size="xs" c="dimmed">
                        {new Date(sighting.reportDate).toLocaleString()}
                      </Text>
                    </Group>
                  </Box>
                  <Badge size="sm" color="green">
                    New
                  </Badge>
                </Group>
              </Card>
            ))}
          </Stack>
        )}
      </Paper>

      {/* GPS Tracker */}
      <Paper mb="xl" p={{ base: "md", md: "lg" }} withBorder radius="lg">
        <Flex align="center" gap="sm" mb="lg">
          <IconGps size={24} color="#2f80ed" />
          <Title order={3}>GPS Smart Belt Tracking</Title>
        </Flex>
        <GpsTracker />
      </Paper>
    </Container>
  );
}