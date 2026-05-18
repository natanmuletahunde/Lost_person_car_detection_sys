"use client";

import {
  Box,
  Title,
  Text,
  Button,
  Group,
  Stack,
  useMantineColorScheme,
} from "@mantine/core";
import { IconArrowRight, IconChevronDown } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useMediaQuery } from "@mantine/hooks";

export default function HomeHero({
  isAuthenticated,
}: {
  isAuthenticated?: boolean;
}) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  const { scrollY } = useScroll();
  const parallaxY = useTransform(scrollY, [0, 300], [0, 60]);

  return (
    <Box
      style={{
        height: isMobile ? "auto" : "100vh",
        width: "100vw",
        overflow: "hidden",
        position: "relative",
        background: isDark
          ? "linear-gradient(135deg, #020617 0%, #0b1220 50%, #0f172a 100%)"
          : "linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #0ea5e9 100%)",
      }}
    >
      {/* RIGHT SIDE IMAGE + PARTICLES */}
      {!isMobile && (
        <Box
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "60%",
            height: "100%",
            zIndex: 1,
            overflow: "visible",
          }}
        >
          {/* HERO IMAGE */}
          <motion.div
            style={{
              y: parallaxY,
              position: "relative",
              width: "100%",
              height: "100%",
            }}
          >
            <Image
              src="/heropic.png"
              alt="Hero"
              fill
              priority
              style={{
                objectFit: "contain",
                objectPosition: "right bottom",
              }}
            />
          </motion.div>

          {/* FLOATING PARTICLES */}
          {[...Array(18)].map((_, i) => (
            <motion.div
              key={i}
              style={{
                position: "absolute",
                width: 6 + (i % 3),
                height: 6 + (i % 3),
                borderRadius: "50%",
                background: "rgba(255,255,255,0.35)",
                top: `${Math.random() * 100}%`,
                right: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.2, 0.6, 0.2],
              }}
              transition={{
                duration: 4 + (i % 3),
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </Box>
      )}

      {/* CONTENT */}
      <Box
        style={{
          position: "relative",
          zIndex: 2,
          height: isMobile ? "auto" : "100%",
          display: "flex",
          alignItems: "center",
          paddingLeft: isMobile ? 24 : "6vw",
          paddingRight: isMobile ? 24 : "40%",
          paddingTop: isMobile ? 100 : 0,
        }}
      >
        <Stack gap="xl">
          {/* ANIMATED TEXT BLOCK */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            {/* BADGE */}
            <Box
              style={{
                display: "inline-block",
                padding: "8px 14px",
                borderRadius: 20,
                background: isDark ? "#111827" : "#e2e8f0",
                border: isDark ? "1px solid #1f2937" : "1px solid #cbd5e1",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              AI Powered Recovery Platform
            </Box>

            {/* TITLE */}
            <Title
              order={1}
              size={isMobile ? 40 : 68}
              fw={900}
              c="white"
              mt="xl"
              style={{ lineHeight: 1.05 }}
            >
              If you{" "}
              <Text component="span" c="cyan.3" inherit>
                lost it
              </Text>
              ,<br />
              we will{" "}
              <Text component="span" c="teal.3" inherit>
                find it
              </Text>
            </Title>

            {/* SUBTITLE */}
            <Text size="xl" c="gray.3" mt="md" maw={600}>
              Smart AI-powered system that helps recover lost items faster using
              real-time alerts and tracking.
            </Text>

            {/* BUTTONS */}
            <Group mt={40} gap="md" wrap={isMobile ? "wrap" : "nowrap"}>
              {/* PRIMARY BUTTON */}
              <motion.div
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Button
                  component={Link}
                  href={
                    isAuthenticated
                      ? "/user/register"
                      : "/authentication/signup"
                  }
                  size="lg"
                  radius="xl"
                  rightSection={<IconArrowRight size={18} />}
                  style={{
                    background: "#2563eb",
                    fontWeight: 700,
                  }}
                >
                  {isAuthenticated ? "Register Case" : "Get Started"}
                </Button>
              </motion.div>

              {/* SECONDARY BUTTON */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Button
                  component={Link}
                  href="/user/how-it-works"
                  size="lg"
                  radius="xl"
                  variant="outline"
                  style={{
                    border: "2px solid white",
                    color: "white",
                    fontWeight: 700,
                  }}
                >
                  How it works
                </Button>
              </motion.div>
            </Group>
          </motion.div>
        </Stack>
      </Box>

      {/* SCROLL INDICATOR */}
      {!isMobile && (
        <motion.div
          style={{
            position: "absolute",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 5,
            color: "white",
          }}
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <IconChevronDown size={28} />
        </motion.div>
      )}
    </Box>
  );
}