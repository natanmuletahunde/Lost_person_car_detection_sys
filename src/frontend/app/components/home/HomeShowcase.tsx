"use client";
import { useState, useEffect } from "react";
import {
  Box,
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
  useMantineColorScheme,
  Flex,
} from "@mantine/core";
import {
  IconCar,
  IconUser as IconUserPerson,
  IconAlertCircle,
  IconMapPin,
  IconMap,
} from "@tabler/icons-react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";
const API_ROOT = API_BASE_URL.replace(/\/api\/v1\/?$/, "") || "http://localhost:5000";

// Simple auth hook (same as in About page) – replace with your shared hook if available
const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem('auth_token') 
      || localStorage.getItem('accessToken') 
      || localStorage.getItem('token')
      || sessionStorage.getItem('auth_token');
    setIsLoggedIn(!!token);
  }, [pathname]);

  return { isLoggedIn };
};

function getImageUrl(item: any) {
  if (item.imagePreview) {
    const path = item.imagePreview;
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    return `${API_ROOT}${path.startsWith('/') ? path : `/${path}`}`;
  }
  if (Array.isArray(item.images) && item.images[0]) {
    const path = item.images[0];
    if (path.startsWith("http")) return path;
    return `${API_ROOT}${path.startsWith("/") ? path : `/${path}`}`;
  }
  return null;
}

export default function HomeShowcase() {
  const t = useTranslations("Showcase");
  const tCommon = useTranslations("Common");
  const { colorScheme } = useMantineColorScheme();
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const getBg = (light: string, dark: string) =>
    colorScheme === "dark" ? dark : light;

  const [missingPersons, setMissingPersons] = useState([]);
  const [missingVehicles, setMissingVehicles] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const fetchMissingData = async () => {
      setDataLoading(true);
      try {
        const [personsRes, vehiclesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/missing-persons`)
            .then((res) => res.json())
            .catch(() => ({ data: [] })),
          fetch(`${API_BASE_URL}/missing-vehicles`)
            .then((res) => res.json())
            .catch(() => ({ data: [] })),
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

    const timer = setTimeout(() => {
      fetchMissingData();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleReportSighting = (url: string) => {
  // Try common token keys
  const token = localStorage.getItem('auth_token') 
    || localStorage.getItem('accessToken') 
    || localStorage.getItem('token')
    || sessionStorage.getItem('auth_token');

  if (!token) {
    sessionStorage.setItem('returnUrl', url);
    router.replace(`/authentication/login?returnUrl=${encodeURIComponent(url)}`);
  } else {
    router.push(url);
  }
};

  // Helper to render a scrollable, centered card row
  const renderCardRow = (items: any[], type: "person" | "vehicle") => {
    if (items.length === 0) return null;

    return (
      <Box
        style={{
          overflowX: "auto",
          overflowY: "visible",
          paddingBottom: "16px",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <Flex
          gap="lg"
          justify="center"
          wrap="nowrap"
          style={{
            minWidth: "min-content",
            width: "fit-content",
            margin: "0 auto",
          }}
        >
          {items.map((item: any) => {
            const id = item._id || item.id;
            const imageUrl = getImageUrl(item);
            if (type === "person") {
              const reportUrl = `/user/report-sighting?type=person&caseId=${item.caseId || id}&name=${encodeURIComponent(item.firstName + " " + item.lastName)}`;
              return (
                <Card
                  key={id}
                  radius="md"
                  w={{ base: 220, sm: 260 }}
                  p={0}
                  withBorder
                  bg={getBg("white", "#2C2E33")}
                  style={{ flexShrink: 0 }}
                >
                  <Box style={{ position: "relative", height: 200 }}>
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        fill
                        alt={`${item.firstName} ${item.lastName}`}
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
                      {item.firstName} {item.lastName}
                    </Text>
                    <Group gap="xs" mt={2}>
                      <Badge size="xs" color="pink" variant="light">
                        {item.gender || "Unknown"}
                      </Badge>
                      <Badge size="xs" color="cyan" variant="light">
                        Age {item.age || "?"}
                      </Badge>
                    </Group>
                    <Group gap={4} mt={4}>
                      <IconMapPin size={12} />
                      <Text size="xs" lineClamp={1}>
                        {item.location || "Location unknown"}
                      </Text>
                    </Group>
                    <Badge size="xs" color="red" variant="filled" fullWidth mt={6}>
                      ACTIVE
                    </Badge>
                    <Button
                      onClick={() => handleReportSighting(reportUrl)}
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
              );
            } else {
              const reportUrl = `/user/report-sighting?type=vehicle&caseId=${item.caseId || id}&name=${encodeURIComponent(item.brand + " " + item.model)}&plateNumber=${encodeURIComponent(item.plateNumber || "")}`;
              return (
                <Card
                  key={id}
                  radius="md"
                  w={{ base: 240, sm: 280 }}
                  p={0}
                  withBorder
                  bg={getBg("white", "#2C2E33")}
                  style={{ flexShrink: 0 }}
                >
                  <Box style={{ position: "relative", height: 160 }}>
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        fill
                        alt={item.brand}
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
                      {item.brand} {item.model}
                    </Text>
                    <Group gap={4} mt={4}>
                      <IconMapPin size={12} />
                      <Text size="xs" lineClamp={1}>
                        {item.location || "Location unknown"}
                      </Text>
                    </Group>
                    <Group gap="xs" mt={4} justify="space-between">
                      <Badge size="xs" color="blue" variant="light">
                        {item.color || "N/A"}
                      </Badge>
                      <Text size="xs" fw={600} style={{ fontFamily: "monospace" }}>
                        {item.plateNumber || "No plate"}
                      </Text>
                    </Group>
                    <Badge size="xs" color="red" variant="filled" fullWidth mt={6}>
                      ACTIVE
                    </Badge>
                    <Button
                      onClick={() => handleReportSighting(reportUrl)}
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
              );
            }
          })}
        </Flex>
      </Box>
    );
  };

  return (
    <Box id="cases" py={{ base: 60, md: 100 }} bg="transparent">
      <Container size="xl">
        <Title
          order={2}
          ta="center"
          fw={900}
          mb="sm"
          style={{ color: "#2f80ed" }}
        >
          Active Community Alerts
        </Title>
        <Text c="dimmed" ta="center" maw={600} mx="auto" mb={50}>
          Take a look at the current active cases. Your vigilance can help bring
          someone home or recover a stolen vehicle.
        </Text>

        {/* Missing Persons Section */}
        <Box mb={60}>
          <Flex align="center" gap="sm" mb="lg" justify="center">
            <IconUserPerson size={24} color="#2f80ed" />
            <Title order={3}>{t("personTitle")}</Title>
          </Flex>
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
              No missing persons reported currently.
            </Alert>
          ) : (
            renderCardRow(missingPersons.slice(0, 8), "person")
          )}
        </Box>

        {/* Missing Vehicles Section */}
        <Box>
          <Flex align="center" gap="sm" mb="lg" justify="center">
            <IconCar size={24} color="#2f80ed" />
            <Title order={3}>{t("carTitle")}</Title>
          </Flex>
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
              No missing vehicles reported currently.
            </Alert>
          ) : (
            renderCardRow(missingVehicles.slice(0, 8), "vehicle")
          )}
        </Box>
      </Container>
    </Box>
  );
}