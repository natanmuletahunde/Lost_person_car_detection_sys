// components/DashboardHero.tsx
"use client";
import { Box, Container, Title, Text, Button, Group, Stack, Grid, Badge } from "@mantine/core";
import { IconArrowRight, IconCalendar } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

interface DashboardHeroProps {
  user: any;
  isMobile: boolean;
  getUserRoute: (path: string) => string;
}

export default function DashboardHero({ user, isMobile, getUserRoute }: DashboardHeroProps) {
  return (
    <Box
      bg="#2f80ed"
      style={{
        overflow: "hidden",
        position: "relative",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "linear-gradient(135deg, #2f80ed 0%, #1e56a0 100%)",
        },
      }}
    >
      <Container size="xl" p={0}>
        <Grid gutter={0} align="stretch">
          <Grid.Col span={{ base: 12, md: 7 }} p={{ base: 40, md: 60 }}>
            <Stack gap="md" style={{ height: "100%", justifyContent: "center", position: "relative", zIndex: 1 }}>
              {user ? (
                <>
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <Title order={1} size={{ base: 32, md: 48, lg: 52 }} fw={900} mb={5} c="white" style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.3)" }}>
                      Welcome back, {user.firstName}!
                    </Title>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
                    <Title order={2} size={{ base: 24, md: 36, lg: 42 }} fw={800} mb={5} c="white">
                      If you lost it we will find it
                    </Title>
                  </motion.div>
                </>
              ) : (
                <>
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <Title order={1} size={{ base: 32, md: 48, lg: 52 }} fw={900} mb={5} c="white" style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.3)" }}>
                      If you lost it we will find it
                    </Title>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
                    <Title order={2} size={{ base: 24, md: 36, lg: 42 }} fw={800} mb={5} c="white">
                      Join thousands who found their lost items
                    </Title>
                  </motion.div>
                </>
              )}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
                <Text size={{ base: "md", md: "lg", lg: "xl" }} mb="xl" fw={600} c="white" maw={600} style={{ opacity: 0.9 }}>
                  Returning items is easier than ever with Flegas™ Black Lions™ cloud based platform, accessible from any device.
                </Text>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
                <Group mb="xl" wrap={isMobile ? "wrap" : "nowrap"}>
                  {user ? (
                    <Button component={Link} href={getUserRoute("/user/subscribe")} size={isMobile ? "md" : "xl"} bg="black" color="white" radius="xl" rightSection={<IconArrowRight size={20} />} fullWidth={isMobile}
                      style={{ boxShadow: "0 10px 30px rgba(0,0,0,0.3)", "&:hover": { transform: "translateY(-2px)", transition: "transform 0.2s" } }}>
                      {user?.reportCount >= 1 ? "Report Missing Item (Upgrade)" : "Report Missing Item"}
                    </Button>
                  ) : (
                    <Button component={Link} href="/authentication/signup" size={isMobile ? "md" : "xl"} bg="black" color="white" radius="xl" rightSection={<IconArrowRight size={20} />} fullWidth={isMobile}
                      style={{ boxShadow: "0 10px 30px rgba(0,0,0,0.3)", "&:hover": { transform: "translateY(-2px)", transition: "transform 0.2s" } }}>
                      Get Started Free
                    </Button>
                  )}
                  <Button size={isMobile ? "md" : "xl"} variant="outline" color="white" radius="xl" rightSection={<IconArrowRight size={20} />} component={Link} href="/user/how-it-works" fullWidth={isMobile}
                    style={{ borderWidth: 2, "&:hover": { background: "rgba(255,255,255,0.1)" } }}>
                    How it works
                  </Button>
                </Group>
              </motion.div>
              {user && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.4 }}>
                  <Group gap="md" wrap="wrap">
                    <Text size="sm" fw={500} c="white" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <IconCalendar size={14} /> Member since: {new Date(user.createdAt).toLocaleDateString()}
                    </Text>
                    <Badge color="green" variant="light" size="lg">{user.isActive ? "Active Account" : "Inactive"}</Badge>
                  </Group>
                </motion.div>
              )}
            </Stack>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 5 }}>
            <Box style={{ height: "100%", minHeight: isMobile ? 300 : 450, position: "relative" }}>
              <Image src="https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?q=80&w=1000" alt="City" fill style={{ objectFit: "cover" }} priority sizes="(max-width: 768px) 100vw, 50vw" />
              <Box style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(to right, rgba(47, 128, 237, 0.9), rgba(47, 128, 237, 0.3))" }} />
            </Box>
          </Grid.Col>
        </Grid>
      </Container>
    </Box>
  );
}