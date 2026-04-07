// components/DashboardBottomSections.tsx
"use client";
import {
  Container,
  Paper,
  Title,
  Text,
  Grid,
  Box,
  Flex,
  Button,
  SimpleGrid,
  Avatar,
  Group,
  Stack,
  useMantineTheme,
} from "@mantine/core";
import {
  IconTarget,
  IconChartBar,
  IconGlobe,
  IconStarFilled,
  IconQuote,
  IconLogin,
  IconArrowRight,
  IconCheck,
} from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { Carousel } from "@mantine/carousel";
import { motion } from "framer-motion";
import { useMediaQuery } from "@mantine/hooks"; // <-- added missing import
import MainFooter from "../../components/MainFooter";

interface DashboardBottomSectionsProps {
  user: any;
  missingPersons: any[];
  missingVehicles: any[];
  userReports: any[];
  colorScheme: "light" | "dark";
  getUserRoute: (path: string) => string;
}

export default function DashboardBottomSections({
  user,
  missingPersons,
  missingVehicles,
  userReports,
  colorScheme,
  getUserRoute,
}: DashboardBottomSectionsProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const getBg = (light: string, dark: string) =>
    colorScheme === "dark" ? dark : light;

  return (
    <Container size="xl" py={{ base: 30, md: 40 }}>
      {/* Our Company Section */}
      <Box py={{ base: 40, md: 60 }}>
        <Title
          order={2}
          mb={{ base: 30, md: 50 }}
          ta="center"
          style={{ color: "#2f80ed" }}
        >
          Our Company
        </Title>
        <Grid gutter="lg">
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper
              shadow="md"
              p={0}
              radius="lg"
              withBorder
              h="100%"
              bg={getBg("white", "#2C2E33")}
            >
              <Box
                py="md"
                px="lg"
                style={{
                  borderBottom: `1px solid ${getBg("#e9ecef", "#2C2E33")}`,
                  background: "linear-gradient(to right, #2f80ed, #1e56a0)",
                }}
              >
                <Flex align="center" gap="sm">
                  <IconTarget size={24} color="white" />
                  <Title order={3} c="white">
                    AIM
                  </Title>
                </Flex>
              </Box>
              <Box
                p="xl"
                bg={getBg("#f0f5ff", "#1C2F4A")}
                style={{
                  height: 200,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text ta="center" c="dimmed">
                  Our mission to reunite people with their lost items
                </Text>
              </Box>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper
              shadow="md"
              p={0}
              radius="lg"
              withBorder
              h="100%"
              bg={getBg("white", "#2C2E33")}
            >
              <Box
                py="md"
                px="lg"
                style={{
                  borderBottom: `1px solid ${getBg("#e9ecef", "#2C2E33")}`,
                  background: "linear-gradient(to right, #2f80ed, #1e56a0)",
                }}
              >
                <Flex align="center" gap="sm">
                  <IconChartBar size={24} color="white" />
                  <Title order={3} c="white">
                    Vision
                  </Title>
                </Flex>
              </Box>
              <Box
                p="xl"
                bg={getBg("#f0f5ff", "#1C2F4A")}
                style={{
                  height: 200,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text ta="center" c="dimmed">
                  Creating a world where nothing is ever truly lost
                </Text>
              </Box>
            </Paper>
          </Grid.Col>
          <Grid.Col span={12}>
            <Paper
              shadow="md"
              p={0}
              radius="lg"
              withBorder
              maw={800}
              mx="auto"
              bg={getBg("white", "#2C2E33")}
            >
              <Box
                py="md"
                px="lg"
                style={{
                  borderBottom: `1px solid ${getBg("#e9ecef", "#2C2E33")}`,
                  background: "linear-gradient(to right, #2f80ed, #1e56a0)",
                }}
              >
                <Flex align="center" gap="sm">
                  <IconGlobe size={24} color="white" />
                  <Title order={3} c="white">
                    Strategy
                  </Title>
                </Flex>
              </Box>
              <Box
                p="xl"
                bg={getBg("#f0f5ff", "#1C2F4A")}
                style={{
                  height: 200,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text ta="center" c="dimmed">
                  Leveraging technology and community for faster recoveries
                </Text>
              </Box>
            </Paper>
          </Grid.Col>
        </Grid>
      </Box>

      {/* Real Stories Carousel & Stats */}
      <Box py={{ base: 40, md: 60, lg: 80 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <Title
            order={2}
            fw={800}
            mb={5}
            ta="center"
            style={{ color: "#2f80ed" }}
          >
            Real Stories, Real Results
          </Title>
          <Text
            size="sm"
            c="dimmed"
            mb={40}
            maw={600}
            mx="auto"
            ta="center"
          >
            Hear from families and individuals who have successfully recovered
            their loved ones and vehicles through our advanced detection system
          </Text>
        </motion.div>

        <Box px={{ base: 0, md: 20 }} mb={60}>
          <Carousel
            slideSize={{ base: "100%", sm: "50%", md: "33.333%" }}
            slideGap="lg"
            align="start"
            loop
            withIndicators
            speed={300}
          >
            {[
              {
                id: 1,
                name: "Sara Johnson",
                role: "Found Car in 24 Hours",
                avatarColor: "blue",
                quote:
                  "I found my car within 24 hours of posting here. The AI detection is incredible!",
                rating: 5,
                date: "2 weeks ago",
              },
              {
                id: 2,
                name: "Kebede M.",
                role: "Found Missing Brother",
                avatarColor: "green",
                quote:
                  "The alert system is so fast. Thank you for helping me find my brother.",
                rating: 5,
                date: "1 month ago",
              },
              {
                id: 3,
                name: "Michael Chen",
                role: "Recovered Family Heirloom",
                avatarColor: "orange",
                quote:
                  "I thought I lost my grandmother's necklace forever. Community found it in 48 hours.",
                rating: 5,
                date: "3 weeks ago",
              },
              {
                id: 4,
                name: "Amina Hassan",
                role: "Found Stolen Phone",
                avatarColor: "pink",
                quote:
                  "My phone was stolen. Using location tracking, police recovered it same day.",
                rating: 5,
                date: "1 week ago",
              },
              {
                id: 5,
                name: "David Wilson",
                role: "Business Documents",
                avatarColor: "grape",
                quote:
                  "Left important contracts in a taxi. Driver found me through this platform.",
                rating: 5,
                date: "2 months ago",
              },
              {
                id: 6,
                name: "Maria Rodriguez",
                role: "Pet Found After Storm",
                avatarColor: "teal",
                quote:
                  "Our dog ran away. Neighbors spotted him through the app.",
                rating: 5,
                date: "3 days ago",
              },
            ].map((review) => (
              <Carousel.Slide key={review.id}>
                <Paper
                  p={{ base: "lg", md: "xl" }}
                  radius="lg"
                  withBorder
                  shadow="sm"
                  h="100%"
                  bg={getBg("white", "#2C2E33")}
                >
                  <Box mb="md">
                    <Group gap={2} mb="xs">
                      {[...Array(review.rating)].map((_, i) => (
                        <IconStarFilled key={i} size={16} color="#FAB005" />
                      ))}
                    </Group>
                    <IconQuote
                      size={24}
                      color="var(--mantine-color-blue-3)"
                      style={{ opacity: 0.3, margin: "10px 0" }}
                    />
                    <Text
                      size="sm"
                      mb="md"
                      style={{ lineHeight: 1.6, fontStyle: "italic" }}
                    >
                      "{review.quote}"
                    </Text>
                  </Box>
                  <Group gap="sm" align="center">
                    <Avatar
                      size="md"
                      color={review.avatarColor}
                      radius="xl"
                      variant="filled"
                    >
                      {review.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </Avatar>
                    <Box style={{ flex: 1 }}>
                      <Text size="sm" fw={700}>
                        {review.name}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {review.role}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {review.date}
                      </Text>
                    </Box>
                  </Group>
                </Paper>
              </Carousel.Slide>
            ))}
          </Carousel>
        </Box>

        <Grid gutter="lg" align="center" justify="center" mb={40}>
          <Grid.Col span={{ base: 6, sm: 3 }}>
            <Stack align="center" gap={5}>
              <Title order={1} c="blue.6" size={42}>
                {missingPersons.length + missingVehicles.length}
              </Title>
              <Text size="sm" fw={700}>
                Active Reports
              </Text>
            </Stack>
          </Grid.Col>
          <Grid.Col span={{ base: 6, sm: 3 }}>
            <Stack align="center" gap={5}>
              <Title order={1} c="blue.6" size={42}>
                {missingPersons.length}
              </Title>
              <Text size="sm" fw={700}>
                Missing People
              </Text>
            </Stack>
          </Grid.Col>
          <Grid.Col span={{ base: 6, sm: 3 }}>
            <Stack align="center" gap={5}>
              <Title order={1} c="blue.6" size={42}>
                {missingVehicles.length}
              </Title>
              <Text size="sm" fw={700}>
                Missing Vehicles
              </Text>
            </Stack>
          </Grid.Col>
          <Grid.Col span={{ base: 6, sm: 3 }}>
            <Stack align="center" gap={5}>
              <Title order={1} c="blue.6" size={42}>
                {user
                  ? userReports.filter((r) => r.status === "Resolved").length
                  : "0"}
              </Title>
              <Text size="sm" fw={700}>
                Your Resolved
              </Text>
            </Stack>
          </Grid.Col>
        </Grid>

        <Box mt={40}>
          <Title order={3} size="h4" mb="lg" c="dimmed" ta="center">
            Success Stories Gallery
          </Title>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
            {[
              {
                img: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=500",
                title: "Family Reunion",
                description: "Emotional reunions with loved ones",
              },
              {
                img: "https://images.unsplash.com/photo-1543465077-db45d34b88a5?q=80&w=500",
                title: "Car Recovery",
                description: "Vehicles returned to owners",
              },
              {
                img: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=500",
                title: "Happy Moments",
                description: "Joyful recovery stories",
              },
            ].map((item, idx) => (
              <Paper
                key={idx}
                radius="md"
                style={{
                  overflow: "hidden",
                  position: "relative",
                  aspectRatio: "16/9",
                }}
              >
                <Image
                  src={item.img}
                  alt={item.title}
                  fill
                  style={{ objectFit: "cover" }}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <Box
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background:
                      "linear-gradient(transparent, rgba(0,0,0,0.7))",
                    padding: "12px",
                  }}
                >
                  <Text size="sm" c="white" fw={600}>
                    {item.title}
                  </Text>
                  <Text size="xs" c="white">
                    {item.description}
                  </Text>
                </Box>
              </Paper>
            ))}
          </SimpleGrid>
        </Box>
      </Box>

      {/* Final Call to Action for non-logged users */}
      {!user && (
        <Box py={{ base: 40, md: 60 }}>
          <Paper
            shadow="lg"
            p={{ base: "lg", md: 50 }}
            radius="lg"
            bg="linear-gradient(135deg, #2f80ed 0%, #1e56a0 100%)"
            ta="center"
          >
            <Title order={2} c="white" mb="md">
              Ready to get started?
            </Title>
            <Text
              size={{ base: "md", md: "lg" }}
              c="white"
              mb="xl"
              maw={600}
              mx="auto"
              style={{ opacity: 0.9 }}
            >
              Join thousands of users who have successfully found their lost
              items and helped others in the community.
            </Text>
            <Flex
              gap="md"
              justify="center"
              direction={{ base: "column", sm: "row" }}
              align="center"
            >
              <Button
                size={isMobile ? "md" : "xl"}
                variant="white"
                color="blue"
                radius="xl"
                leftSection={<IconLogin size={20} />}
                component={Link}
                href="/login"
                fullWidth={isMobile}
              >
                Login
              </Button>
              <Button
                size={isMobile ? "md" : "xl"}
                bg="black"
                color="white"
                radius="xl"
                rightSection={<IconArrowRight size={20} />}
                component={Link}
                href="/signup"
                fullWidth={isMobile}
                style={{ boxShadow: "0 10px 30px rgba(0,0,0,0.3)" }}
              >
                Create Free Account
              </Button>
            </Flex>
          </Paper>
        </Box>
      )}

      <MainFooter />
    </Container>
  );
}