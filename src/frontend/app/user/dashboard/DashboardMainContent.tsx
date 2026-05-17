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
  IconAlertCircle,
  IconBell,
  IconChartBar,
  IconShieldCheck,
  IconUserCircle,
} from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useMediaQuery } from "@mantine/hooks";

const LocationPicker = dynamic(() => import("../../components/LocationPicker"), {
  ssr: false,
});
const GpsTracker = dynamic(() => import("../../components/GpsTracker"), {
  ssr: false,
});

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

const getImageUrl = (path: string | null) => {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  const baseUrl = API_BASE_URL.replace("/api/v1", "");
  return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
};

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
  const getSightingLocationText = (location: any) => {
    if (!location) return "Unknown location";
    if (typeof location === "string") return location;
    if (typeof location === "object") {
      return (
        location.address ||
        (Array.isArray(location.coordinates)
          ? `${location.coordinates[1]}, ${location.coordinates[0]}`
          : "Unknown location")
      );
    }
    return String(location);
  };

  return (
    <Container size="xl" py={{ base: 30, md: 40 }}>
      {/* Quick Actions */}
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg" mb="xl">
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
        <Button
          component={Link}
          href={getUserRoute("/user/gps/register")}
          size="lg"
          radius="md"
          leftSection={<IconGps size={20} />}
          fullWidth
          style={{
            background: "linear-gradient(135deg, #10b981 0%, #047857 100%)",
            color: "white",
            height: 80,
            fontSize: 18,
            boxShadow: "0 4px 14px 0 rgba(16, 185, 129, 0.39)",
            border: "none",
          }}
        >
          Register GPS Device
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

      {/* Grid Layout for new sections */}
      <Grid gutter="xl" mb="xl">
        <Grid.Col span={{ base: 12, md: 8 }}>
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
                  <Title order={3}>Your Recent Reports</Title>
                </Flex>
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
                      <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {userReports.slice(0, 5).map((caseItem) => (
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
                          <Button component={Link} href={getUserRoute(`/case/${caseItem.id}`)} size="xs" variant="light">
                            View
                          </Button>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
              {userReports.length > 5 && (
                <Center mt="md">
                  <Button variant="subtle" component={Link} href={getUserRoute("/reported-cases")}>
                    View All Cases
                  </Button>
                </Center>
              )}
            </Paper>
          )}

          {/* GPS Tracker */}
          <Paper p={{ base: "md", md: "lg" }} withBorder radius="lg">
            <Flex align="center" gap="sm" mb="lg">
              <IconGps size={24} color="#2f80ed" />
              <Title order={3}>GPS Smart Belt Tracking</Title>
            </Flex>
            <GpsTracker />
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          {/* Profile Snapshot Placeholder */}
          <Paper mb="xl" p="lg" withBorder radius="lg" bg={getBg("#f0f5ff", "#1C2F4A")}>
            <Flex align="center" gap="md">
              <Avatar size="lg" color="blue" radius="xl">
                {user ? `${user.firstName?.charAt(0)}${user.lastName?.charAt(0)}`.toUpperCase() : "U"}
              </Avatar>
              <Box>
                <Title order={4}>{user ? `${user.firstName} ${user.lastName}` : "User Profile"}</Title>
                <Text size="sm" c="dimmed">Verified Account</Text>
              </Box>
            </Flex>
          </Paper>

          {/* Notifications Panel Placeholder */}
          <Paper mb="xl" p="md" withBorder radius="lg">
            <Flex align="center" justify="space-between" mb="md">
              <Flex align="center" gap="sm">
                <IconBell size={20} color="#2f80ed" />
                <Title order={4}>Notifications</Title>
              </Flex>
              <Badge color="red" variant="filled">2 New</Badge>
            </Flex>
            <Stack gap="sm">
              <Alert color="blue" variant="light" p="sm">
                <Text size="sm">New sighting match for your report!</Text>
              </Alert>
              <Alert color="gray" variant="light" p="sm">
                <Text size="sm">GPS battery is running low (15%).</Text>
              </Alert>
            </Stack>
          </Paper>

          {/* Recent Sightings */}
          <Paper mb="xl" p="md" withBorder radius="lg">
            <Flex align="center" gap="sm" mb="md">
              <IconMessageCircle size={20} color="#2f80ed" />
              <Title order={4}>Recent Sightings</Title>
            </Flex>
            {recentSightings.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">
                No recent sightings
              </Text>
            ) : (
              <Stack gap="sm">
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
                        <Text size="xs" c="dimmed" lineClamp={1}>
                          {getSightingLocationText(sighting.location)}
                        </Text>
                      </Box>
                    </Group>
                  </Card>
                ))}
              </Stack>
            )}
          </Paper>

          {/* Analytics & Security Placeholders */}
          <Paper mb="xl" p="md" withBorder radius="lg">
            <Flex align="center" gap="sm" mb="md">
              <IconChartBar size={20} color="#2f80ed" />
              <Title order={4}>Analytics & Activity</Title>
            </Flex>
            <Center h={100} bg={getBg("gray.0", "dark.6")} style={{ borderRadius: 8 }}>
              <Text c="dimmed" size="sm">[ Activity Chart Placeholder ]</Text>
            </Center>
          </Paper>

          <Paper p="md" withBorder radius="lg" bg={getBg("green.0", "dark.6")}>
            <Flex align="center" gap="sm" mb="xs">
              <IconShieldCheck size={20} color="green" />
              <Title order={4}>Security & Trust</Title>
            </Flex>
            <Text size="sm" c="dimmed">Your account is fully verified. Trust score: High (98%).</Text>
          </Paper>
        </Grid.Col>
      </Grid>
    </Container>
  );
}