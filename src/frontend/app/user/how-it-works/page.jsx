"use client";

import {
  Box,
  Container,
  Title,
  Text,
  Button,
  Group,
  TextInput,
  Avatar,
  Paper,
  SimpleGrid,
  Card,
  Grid,
  ActionIcon,
  Menu,
  UnstyledButton,
  Stack,
  Badge,
  ThemeIcon,
  List,
  Divider,
  Accordion,
  useMantineTheme,
  useMantineColorScheme,
  Flex,
} from "@mantine/core";
import {
  IconSearch,
  IconChevronRight,
  IconArrowRight,
  IconBell,
  IconUser,
  IconHistory,
  IconSettings,
  IconLogout,
  IconShieldCheck,
  IconStarFilled,
  IconHome,
  IconMail,
  IconPhone,
  IconCalendar,
  IconMapPin,
  IconLogin,
  IconUserPlus,
  IconQuote,
  IconCar,
  IconUser as IconUserPerson,
  IconCheck,
  IconHeart,
  IconGlobe,
  IconTarget,
  IconChartBar,
  IconFileReport,
  IconClock,
  IconAlertCircle,
  IconSun,
  IconMoon,
  IconUserPlus as IconUserPlus2,
  IconAlertTriangle,
  IconCamera,
  IconLock,
  IconCreditCard,
  IconBuildingBank,
  IconWallet,
  IconMessageCircle,
  IconBrandTelegram,
  IconFileDescription,
  IconStethoscope,
  IconScale,
  IconHeartHandshake,
  IconStar,
  IconUsers,
  IconMapPin as IconLocation,
} from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import MainFooter from "../../components/MainFooter";
import { useMediaQuery } from "@mantine/hooks";
import { motion } from "framer-motion";

const PRIMARY_COLOR = "#0034D1";
const PRIMARY_GRADIENT = `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, #0066ff 100%)`;

export default function HowItWorksPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const theme = useMantineTheme();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");

  // Helper to get dynamic background colors
  const getBg = (light, dark) => (colorScheme === "dark" ? dark : light);
  const getTextColor = (light, dark) => (colorScheme === "dark" ? dark : light);

  // Get user initials for avatar
  const getUserInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  // Check for logged in user
  useEffect(() => {
    const checkAuth = () => {
      const userData = localStorage.getItem("currentUser");
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("currentUser");
    setUser(null);
    router.push("/");
  };

  // FAQ Data
  const faqData = [
    {
      icon: <IconUserPlus2 size={20} />,
      question: "How many free registrations do I get?",
      answer:
        "You get 1 free registration total (for either a person or vehicle). After that, you'll need to subscribe to a premium plan to continue reporting missing cases.",
    },
    {
      icon: <IconCamera size={20} />,
      question: "How do alerts work?",
      answer:
        "Our camera system automatically detects missing persons/vehicles. When a match is found, you'll receive an alert in your dashboard. The alert stays active until you view and acknowledge it.",
    },
    {
      icon: <IconStethoscope size={20} />,
      question: "What documents are needed for special cases?",
      answer:
        "For mentally ill persons: valid doctor's report. For criminal background cases: official arrest warrant or court order. These are verified by our admin team.",
    },
    {
      icon: <IconClock size={20} />,
      question: "How long do alerts stay active?",
      answer:
        "Alerts remain active until you view them. The system operates 24/7, so you can receive alerts at any time.",
    },
    {
      icon: <IconBuildingBank size={20} />,
      question: "What payment methods are accepted?",
      answer:
        "We accept Bank Transfer, Wallet payments, and Credit/Debit cards. All payments are secure and encrypted.",
    },
    {
      icon: <IconBrandTelegram size={20} />,
      question: "Will I get notifications via Telegram?",
      answer:
        "Yes! You can connect your Telegram account for instant notifications when your case is detected.",
    },
    {
      icon: <IconUsers size={20} />,
      question: "Can police officers have special access?",
      answer:
        "Yes, law enforcement officers can have priority access to certain cases. Contact our admin for verification.",
    },
    {
      icon: <IconMessageCircle size={20} />,
      question: "Is the platform available in Amharic?",
      answer:
        "We're working on Amharic language support! Currently the platform is in English, but Amharic is coming soon.",
    },
  ];

  // Testimonials
  const testimonials = [
    {
      name: "Sara Johnson",
      role: "Found Car in 24 Hours",
      avatarColor: "blue",
      content:
        "I found my car within 24 hours of posting here. The AI detection is incredible!",
      rating: 5,
      date: "2 weeks ago",
    },
    {
      name: "Kebede M.",
      role: "Found Missing Brother",
      avatarColor: "green",
      content:
        "The alert system is so fast. Thank you for helping me find my brother.",
      rating: 5,
      date: "1 month ago",
    },
    {
      name: "Tigist Haile",
      role: "Vehicle Owner",
      avatarColor: "orange",
      content:
        "My car was stolen and within 3 days, Flega's system spotted it. The police were notified and I got my car back.",
      rating: 5,
      date: "3 weeks ago",
    },
  ];

  if (loading) {
    return (
      <Box
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box textAlign="center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            style={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              border: "4px solid #2f80ed",
              borderTopColor: "transparent",
              margin: "0 auto 20px",
            }}
          />
          <Text size="lg" fw={700} style={{ color: "#2f80ed" }}>
            Loading...
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      bg={getBg("white", theme.colors.dark[7])}
      style={{ minHeight: "100vh" }}
    >
      {/* --- HEADER (EXACT MATCH TO DASHBOARD) --- */}
      <Box
        bg={getBg("white", theme.colors.dark[7])}
        py={{ base: "xs", md: "sm" }}
        style={{
          borderBottom: `1px solid ${getBg(theme.colors.gray[2], theme.colors.dark[5])}`,
          position: "sticky",
          top: 0,
          zIndex: 100,
          backdropFilter: "blur(10px)",
          background: getBg(
            "rgba(255,255,255,0.95)",
            `rgba(${theme.colors.dark[7]},0.95)`,
          ),
        }}
      >
        <Container size="xl">
          <Group justify="space-between" wrap="nowrap">
            {/* Logo */}
            <Link href="/" style={{ flexShrink: 0 }}>
              <Image
                src="/logo.jpg"
                alt="Logo"
                width={120}
                height={40}
                style={{
                  width: "auto",
                  height: "40px",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              />
            </Link>

            <TextInput
              placeholder="Search lost items, cars, or people..."
              leftSection={<IconSearch size={16} />}
              style={{
                flex: 1,
                maxWidth: isMobile ? "200px" : "400px",
                minWidth: isMobile ? "150px" : "300px",
              }}
              radius="xl"
              size={isMobile ? "sm" : "md"}
              variant="filled"
            />

            <Group gap={isMobile ? "xs" : "md"} wrap="nowrap">
              {/* Notification Bell */}

              <Button
                variant="subtle"
                component={Link}
                href="/user/about"
                radius="xl"
                style={{
                  color: colorScheme === "dark" ? "#e0e0e0" : "#333333",
                }}
              >
                About Us
              </Button>
              <ActionIcon
                component={Link}
                href="/"
                variant="subtle"
                color="gray"
                size="lg"
                title="Home"
              >
                <IconHome size={24} />
              </ActionIcon>

              {user ? (
                <Menu
                  shadow="md"
                  width={320}
                  radius="md"
                  transitionProps={{ transition: "pop-top-right" }}
                >
                  <Menu.Target>
                    <UnstyledButton>
                      <Group gap="sm" wrap="nowrap">
                        {!isMobile && (
                          <Box ta="right">
                            <Text fw={800} size="sm" truncate>
                              {user.firstName} {user.lastName}
                            </Text>
                            <Text
                              size="xs"
                              c="dimmed"
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <IconMail size={10} />
                              {user.email}
                            </Text>
                          </Box>
                        )}
                        <Avatar
                          src={null}
                          alt={`${user.firstName} ${user.lastName}`}
                          color="blue"
                          size={isMobile ? "sm" : "md"}
                          radius="xl"
                          style={{
                            border: "2px solid #2f80ed",
                          }}
                        >
                          {getUserInitials(user.firstName, user.lastName)}
                        </Avatar>
                      </Group>
                    </UnstyledButton>
                  </Menu.Target>
                  <Menu.Dropdown
                    bg={getBg("white", theme.colors.dark[7])}
                    style={{
                      borderColor: getBg(
                        theme.colors.gray[2],
                        theme.colors.dark[5],
                      ),
                    }}
                  >
                    <Box
                      mb="md"
                      pb="md"
                      style={{
                        borderBottom: `1px solid ${getBg(theme.colors.gray[2], theme.colors.dark[5])}`,
                      }}
                    >
                      <Group mb="xs">
                        <Avatar
                          src={null}
                          alt={`${user.firstName} ${user.lastName}`}
                          color="blue"
                          size="lg"
                          radius="xl"
                          style={{ border: "3px solid #2f80ed" }}
                        >
                          {getUserInitials(user.firstName, user.lastName)}
                        </Avatar>
                        <Box style={{ flex: 1, minWidth: 0 }}>
                          <Text size="md" fw={700} truncate>
                            {user.firstName} {user.lastName}
                          </Text>
                          <Text size="sm" c="dimmed" truncate>
                            {user.email}
                          </Text>
                          <Badge
                            size="xs"
                            color={user.role === "admin" ? "red" : "blue"}
                            variant="light"
                            mt={4}
                          >
                            {user.role}
                          </Badge>
                        </Box>
                      </Group>
                      <Button
                        fullWidth
                        variant="light"
                        component={Link}
                        href="/profile"
                        leftSection={<IconUser size={16} />}
                        size="sm"
                      >
                        View Profile
                      </Button>
                    </Box>

                    <Stack gap={4}>
                      <Menu.Item
                        leftSection={<IconUser size={18} />}
                        component={Link}
                        href="/profile"
                      >
                        My Profile
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconFileReport size={18} />}
                        component={Link}
                        href="/reported-cases"
                      >
                        Reported Cases
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconBell size={18} />}
                        onClick={() => router.push("/alert")}
                      >
                        My Notifications
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconHistory size={18} />}
                        component={Link}
                        href="/history"
                      >
                        Search History
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconSettings size={18} />}
                        component={Link}
                        href="/settings"
                      >
                        Account Settings
                      </Menu.Item>
                    </Stack>
                    <Menu.Divider />
                    <Menu.Item
                      color="red"
                      leftSection={<IconLogout size={18} />}
                      onClick={handleLogout}
                    >
                      Logout
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              ) : (
                <Group gap={isMobile ? "xs" : "sm"} wrap="nowrap">
                  <Button
                    variant="outline"
                    color="blue"
                    leftSection={<IconLogin size={16} />}
                    component={Link}
                    href="/login"
                    radius="xl"
                    size={isMobile ? "xs" : "sm"}
                  >
                    {isMobile ? "Login" : "Sign In"}
                  </Button>
                  <Button
                    color="blue"
                    leftSection={<IconUserPlus size={16} />}
                    component={Link}
                    href="/signup"
                    radius="xl"
                    size={isMobile ? "xs" : "sm"}
                    style={{
                      background:
                        "linear-gradient(135deg, #2f80ed 0%, #1e56a0 100%)",
                    }}
                  >
                    {isMobile ? "Join" : "Sign Up"}
                  </Button>
                </Group>
              )}
            </Group>
          </Group>
        </Container>
      </Box>

      {/* --- MAIN CONTENT (NO HERO SECTION) --- */}
      <Container size="xl" py={40}>
        {/* Page Title */}
        <Box mb={40}>
          <Badge size="lg" color="blue" variant="light" mb="md">
            GUIDE
          </Badge>
          <Title order={1} fw={900} size={48} style={{ color: PRIMARY_COLOR }}>
            How Flega Works
          </Title>
          <Text c="dimmed" size="lg" mt={10} maw={600}>
            A simple 4-step process to report and recover missing persons and
            vehicles
          </Text>
        </Box>

        {/* Stats Section */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb={50}>
          <Paper p="xl" radius="md" withBorder style={{ textAlign: "center" }}>
            <ThemeIcon
              size={60}
              radius={60}
              mx="auto"
              mb="md"
              style={{ background: PRIMARY_GRADIENT }}
            >
              <IconUsers size={30} color="white" />
            </ThemeIcon>
            <Text fw={700} size="2rem" style={{ color: PRIMARY_COLOR }}>
              500+
            </Text>
            <Text c="dimmed">Active Cases</Text>
          </Paper>
          <Paper p="xl" radius="md" withBorder style={{ textAlign: "center" }}>
            <ThemeIcon
              size={60}
              radius={60}
              mx="auto"
              mb="md"
              style={{ background: PRIMARY_GRADIENT }}
            >
              <IconHeartHandshake size={30} color="white" />
            </ThemeIcon>
            <Text fw={700} size="2rem" style={{ color: PRIMARY_COLOR }}>
              150+
            </Text>
            <Text c="dimmed">Successful Reunions</Text>
          </Paper>
          <Paper p="xl" radius="md" withBorder style={{ textAlign: "center" }}>
            <ThemeIcon
              size={60}
              radius={60}
              mx="auto"
              mb="md"
              style={{ background: PRIMARY_GRADIENT }}
            >
              <IconCamera size={30} color="white" />
            </ThemeIcon>
            <Text fw={700} size="2rem" style={{ color: PRIMARY_COLOR }}>
              24/7
            </Text>
            <Text c="dimmed">Camera Monitoring</Text>
          </Paper>
          <Paper
            p="xl"
            radius="md"
            withBorder
            bg={getBg("white", theme.colors.dark[6])}
            style={{ textAlign: "center" }}
          >
            <ThemeIcon
              size={60}
              radius={60}
              mx="auto"
              mb="md"
              style={{ background: PRIMARY_GRADIENT }}
            >
              <IconClock size={30} color="white" />
            </ThemeIcon>
            <Text fw={700} size="2rem" style={{ color: PRIMARY_COLOR }}>
              24 hrs
            </Text>
            <Text c="dimmed">System Active</Text>
          </Paper>
        </SimpleGrid>

        {/* 4-Step Guide */}
        <Title order={2} fw={800} ta="center" mb={10}>
          Simple 4-Step Process
        </Title>
        <Text c="dimmed" ta="center" mb={50} maw={600} mx="auto">
          Four simple steps to find what you've lost or report what you've found
        </Text>

        <Grid gutter={30} mb={50}>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Card withBorder radius="lg" p="xl" style={{ height: "100%" }}>
              <ThemeIcon
                size={50}
                radius={50}
                mb="md"
                style={{ background: PRIMARY_GRADIENT }}
              >
                <Text fw={900} size="xl">
                  1
                </Text>
              </ThemeIcon>
              <Title order={4} mb="sm">
                Create Account
              </Title>
              <Text c="dimmed" size="sm">
                Register for free. First registration is always free! No hidden
                fees.
              </Text>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Card withBorder radius="lg" p="xl" style={{ height: "100%" }}>
              <ThemeIcon
                size={50}
                radius={50}
                mb="md"
                style={{ background: PRIMARY_GRADIENT }}
              >
                <Text fw={900} size="xl">
                  2
                </Text>
              </ThemeIcon>
              <Title order={4} mb="sm">
                Report Case
              </Title>
              <Text c="dimmed" size="sm">
                Choose between Person, Vehicle, or Special Case. Upload photos
                and details.
              </Text>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Card withBorder radius="lg" p="xl" style={{ height: "100%" }}>
              <ThemeIcon
                size={50}
                radius={50}
                mb="md"
                style={{ background: PRIMARY_GRADIENT }}
              >
                <Text fw={900} size="xl">
                  3
                </Text>
              </ThemeIcon>
              <Title order={4} mb="sm">
                Camera Detection
              </Title>
              <Text c="dimmed" size="sm">
                Our 24/7 camera system scans for matches. When detected, you get
                instant alerts.
              </Text>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Card withBorder radius="lg" p="xl" style={{ height: "100%" }}>
              <ThemeIcon
                size={50}
                radius={50}
                mb="md"
                style={{ background: PRIMARY_GRADIENT }}
              >
                <Text fw={900} size="xl">
                  4
                </Text>
              </ThemeIcon>
              <Title order={4} mb="sm">
                Get Alerted
              </Title>
              <Text c="dimmed" size="sm">
                Receive notifications via email, SMS, or Telegram. Case
                resolved!
              </Text>
            </Card>
          </Grid.Col>
        </Grid>

        {/* Case Types */}
        <Title order={2} fw={800} ta="center" mb={10}>
          What Can You Report?
        </Title>
        <Text c="dimmed" ta="center" mb={50} maw={600} mx="auto">
          Three types of cases you can register in our system
        </Text>

        <SimpleGrid cols={{ base: 1, md: 3 }} spacing={30} mb={50}>
          <Card withBorder radius="lg" p="xl">
            <ThemeIcon
              size={60}
              radius={60}
              mx="auto"
              mb="md"
              style={{ background: PRIMARY_GRADIENT }}
            >
              <IconUserPlus2 size={30} color="white" />
            </ThemeIcon>
            <Title order={3} ta="center" mb="sm">
              Missing Person
            </Title>
            <Text c="dimmed" ta="center" size="sm" mb="md">
              Report a missing family member or individual. Include photos,
              description, and last seen location.
            </Text>
            <List spacing="xs" size="sm" center>
              <List.Item icon={<IconCheck size={16} color={PRIMARY_COLOR} />}>
                Full name and age
              </List.Item>
              <List.Item icon={<IconCheck size={16} color={PRIMARY_COLOR} />}>
                Physical description
              </List.Item>
              <List.Item icon={<IconCheck size={16} color={PRIMARY_COLOR} />}>
                Last known location
              </List.Item>
              <List.Item icon={<IconCheck size={16} color={PRIMARY_COLOR} />}>
                Recent photos
              </List.Item>
            </List>
          </Card>

          <Card withBorder radius="lg" p="xl">
            <ThemeIcon
              size={60}
              radius={60}
              mx="auto"
              mb="md"
              style={{ background: PRIMARY_GRADIENT }}
            >
              <IconCar size={30} color="white" />
            </ThemeIcon>
            <Title order={3} ta="center" mb="sm">
              Missing Vehicle
            </Title>
            <Text c="dimmed" ta="center" size="sm" mb="md">
              Report stolen or missing vehicles. Include license plate, model,
              and identifying features.
            </Text>
            <List spacing="xs" size="sm" center>
              <List.Item icon={<IconCheck size={16} color={PRIMARY_COLOR} />}>
                Brand and model
              </List.Item>
              <List.Item icon={<IconCheck size={16} color={PRIMARY_COLOR} />}>
                License plate number
              </List.Item>
              <List.Item icon={<IconCheck size={16} color={PRIMARY_COLOR} />}>
                Color and features
              </List.Item>
              <List.Item icon={<IconCheck size={16} color={PRIMARY_COLOR} />}>
                Vehicle images
              </List.Item>
            </List>
          </Card>

          <Card withBorder radius="lg" p="xl">
            <ThemeIcon
              size={60}
              radius={60}
              mx="auto"
              mb="md"
              style={{ background: PRIMARY_GRADIENT }}
            >
              <IconAlertTriangle size={30} color="white" />
            </ThemeIcon>
            <Title order={3} ta="center" mb="sm">
              Special Cases
            </Title>
            <Text c="dimmed" ta="center" size="sm" mb="md">
              Report mentally ill persons or criminal background cases. Requires
              official documentation.
            </Text>
            <List spacing="xs" size="sm" center>
              <List.Item
                icon={<IconStethoscope size={16} color={PRIMARY_COLOR} />}
              >
                Doctor's report (mentally ill)
              </List.Item>
              <List.Item icon={<IconScale size={16} color={PRIMARY_COLOR} />}>
                Court order/arrest warrant
              </List.Item>
              <List.Item
                icon={<IconShieldCheck size={16} color={PRIMARY_COLOR} />}
              >
                Admin verification
              </List.Item>
              <List.Item
                icon={<IconFileDescription size={16} color={PRIMARY_COLOR} />}
              >
                Official documents
              </List.Item>
            </List>
          </Card>
        </SimpleGrid>

        {/* Pricing Section */}
        <Box py={20} mb={30}>
          <Paper bg={getBg("blue.0", "blue.9")} p={40} radius="lg">
            <Title order={2} mb="xl" style={{ color: PRIMARY_COLOR }}>
              Simple, Transparent Pricing
            </Title>
            <Text size="lg" mb="xl" maw={500}>
              First registration is FREE. After that, choose a plan that works
              for you.
            </Text>

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing={30}>
              <Card
                withBorder
                radius="lg"
                p="xl"
                bg={getBg("white", theme.colors.dark[6])}
              >
                {" "}
                {/* ✅ FIXED */}
                <Badge color="blue" size="lg" mb="md">
                  FREE
                </Badge>
                <Title order={3} mb="sm">
                  First Registration
                </Title>
                <Text size="sm" c="dimmed" mb="md">
                  Perfect for one-time reports
                </Text>
                <List spacing="xs" size="sm">
                  <List.Item icon={<IconCheck size={16} color="green" />}>
                    1 free report (person or vehicle)
                  </List.Item>
                  <List.Item icon={<IconCheck size={16} color="green" />}>
                    Full camera detection
                  </List.Item>
                  <List.Item icon={<IconCheck size={16} color="green" />}>
                    Email notifications
                  </List.Item>
                  <List.Item icon={<IconCheck size={16} color="green" />}>
                    Alert dashboard access
                  </List.Item>
                </List>
                <Button
                  fullWidth
                  mt="xl"
                  variant="outline"
                  color="blue"
                  onClick={() =>
                    router.push(user ? "/register-person" : "/signup")
                  }
                >
                  {user ? "Start Free Report" : "Sign Up Free"}
                </Button>
              </Card>

              <Card
                withBorder
                radius="lg"
                p="xl"
                bg={getBg("white", theme.colors.dark[6])}
              >
                {" "}
                {/* ✅ FIXED */}
                <Badge color="green" size="lg" mb="md">
                  PREMIUM
                </Badge>
                <Title order={3} mb="sm">
                  Unlimited Reports
                </Title>
                <Text size="sm" c="dimmed" mb="md">
                  Starting at 360 birr/month
                </Text>
                <List spacing="xs" size="sm">
                  <List.Item icon={<IconCheck size={16} color="green" />}>
                    Unlimited reports
                  </List.Item>
                  <List.Item icon={<IconCheck size={16} color="green" />}>
                    Priority camera detection
                  </List.Item>
                  <List.Item icon={<IconCheck size={16} color="green" />}>
                    SMS & Telegram alerts
                  </List.Item>
                  <List.Item icon={<IconCheck size={16} color="green" />}>
                    24/7 support
                  </List.Item>
                </List>
                <Group grow mt="xl">
                  <Button
                    color="green"
                    onClick={() => router.push("/subscribe?plan=monthly")}
                  >
                    Monthly 400 birr
                  </Button>
                  <Button
                    color="green"
                    variant="outline"
                    onClick={() => router.push("/subscribe?plan=annual")}
                  >
                    Annual 360/mo
                  </Button>
                </Group>
              </Card>
            </SimpleGrid>

            <Group mt="md" justify="center">
              <IconBuildingBank size={16} color={PRIMARY_COLOR} />
              <IconWallet size={16} color={PRIMARY_COLOR} />
              <IconCreditCard size={16} color={PRIMARY_COLOR} />
              <Text size="sm" c="dimmed">
                All payment methods accepted
              </Text>
            </Group>
          </Paper>
        </Box>

        {/* FAQ Section */}
        <Box py={40}>
          <Title order={2} fw={800} ta="center" mb={10}>
            Frequently Asked Questions
          </Title>
          <Text c="dimmed" ta="center" mb={40} maw={600} mx="auto">
            Got questions? We've got answers
          </Text>

          <Accordion variant="separated" radius="lg" maw={800} mx="auto">
            {faqData.map((faq, index) => (
              <Accordion.Item key={index} value={`faq-${index}`}>
                <Accordion.Control>
                  <Group gap="sm">
                    <ThemeIcon
                      size={30}
                      radius={30}
                      style={{ background: PRIMARY_GRADIENT }}
                    >
                      {faq.icon}
                    </ThemeIcon>
                    <Text fw={600}>{faq.question}</Text>
                  </Group>
                </Accordion.Control>
                <Accordion.Panel>
                  <Text c="dimmed" pl={45}>
                    {faq.answer}
                  </Text>
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        </Box>

        {/* Testimonials */}
        <Box py={40}>
          <Title
            order={2}
            fw={800}
            mb={5}
            ta="center"
            style={{ color: PRIMARY_COLOR }}
          >
            Real Stories, Real Results
          </Title>
          <Text size="sm" c="dimmed" mb={40} maw={600} mx="auto" ta="center">
            Hear from families and individuals who have successfully recovered
            their loved ones and vehicles
          </Text>

          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
            {testimonials.map((testimonial, index) => (
              <Paper key={index} p="xl" radius="md" withBorder shadow="sm">
                <Group gap={2} mb="xs">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <IconStarFilled key={i} size={16} color="#FAB005" />
                  ))}
                </Group>
                <Text size="sm" mb="md" style={{ lineHeight: 1.6 }}>
                  "{testimonial.content}"
                </Text>
                <Group gap="sm">
                  <Avatar size="md" color={testimonial.avatarColor} radius="xl">
                    {testimonial.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </Avatar>
                  <Box>
                    <Text size="sm" fw={700}>
                      {testimonial.name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {testimonial.role}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {testimonial.date}
                    </Text>
                  </Box>
                </Group>
              </Paper>
            ))}
          </SimpleGrid>
        </Box>

        {/* Final CTA */}
        <Box py={40}>
          <Paper
            p={50}
            radius="lg"
            style={{
              background: PRIMARY_GRADIENT,
              textAlign: "center",
            }}
          >
            <Title order={2} c="white" mb="md">
              Ready to Get Started?
            </Title>
            <Text c="white" opacity={0.9} mb="xl" maw={500} mx="auto">
              Join hundreds of families who have found their loved ones and
              vehicles with Flega
            </Text>
            <Group justify="center">
              <Button
                size="xl"
                color="white"
                radius="xl"
                onClick={() =>
                  router.push(user ? "/register-person" : "/signup")
                }
              >
                {user ? "Report a Case" : "Sign Up Free"}
              </Button>
              <Button
                size="xl"
                color="white"
                radius="xl"
                onClick={() =>
                  router.push(user ? "/report-sighting" : "/signup")
                }
                variant="outline"
                style={{ marginLeft: 10 }}
              >
                {user ? "Report a Sighting" : "Sign Up First"}
              </Button>
              <Button
                size="xl"
                variant="outline"
                color="white"
                radius="xl"
                onClick={() => router.push("/alert")}
              >
                View Active Alerts
              </Button>
            </Group>
            <Text size="sm" c="white" opacity={0.8} mt="xl">
              <IconLock
                size={14}
                style={{ display: "inline", marginRight: 5 }}
              />
              Your data is encrypted and secure. First registration is always
              free.
            </Text>
          </Paper>
        </Box>
      </Container>

      <MainFooter />
    </Box>
  );
}
