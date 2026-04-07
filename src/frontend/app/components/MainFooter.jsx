'use client';

import { Container, Text, SimpleGrid, Box, Anchor, Divider, Group, Stack, useMantineTheme, useMantineColorScheme } from '@mantine/core';
import { 
  IconBrandFacebook, 
  IconBrandTwitter, 
  IconBrandInstagram, 
  IconBrandLinkedin, 
  IconBrandYoutube 
} from '@tabler/icons-react';
import Link from 'next/link';

// Helper to get dynamic background/color values
const getBg = (colorScheme, light, dark) => (colorScheme === 'dark' ? dark : light);
const getTextColor = (colorScheme, light, dark) => (colorScheme === 'dark' ? dark : light);

export default function MainFooter() {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();

  // Dynamic colors
  const footerBg = getBg(colorScheme, 'white', theme.colors.dark[7]);
  const borderColor = getBg(colorScheme, '#f0f0f0', theme.colors.dark[5]);
  const headingColor = getTextColor(colorScheme, theme.colors.dark[9], theme.colors.gray[2]); // dark in light mode, light in dark mode
  const dimmedColor = 'dimmed'; // already adapts

  // Social icon hover style (optional – you can keep the same)
  const iconStyle = {
    transition: 'color 0.2s ease',
    cursor: 'pointer',
  };

  return (
    <Box
      bg={footerBg}
      pt={80}
      pb={40}
      style={{
        borderTop: `1px solid ${borderColor}`,
        position: 'relative',
        zIndex: 20,
      }}
    >
      <Container size="lg">
        <SimpleGrid cols={{ base: 1, sm: 2, md: 5 }} spacing={40} mb={50}>
          {/* Brand Column */}
          <Stack gap="md">
            <Group gap="xs" component={Link} href="/" style={{ textDecoration: 'none' }}>
              <Box style={{ width: 30, height: 30, borderRadius: 8, background: '#2f80ed' }} />
              <Text fw={800} size="xl" c={headingColor}>Flega</Text>
            </Group>
            <Text size="sm" c={dimmedColor}>
              Ethiopian based platform that is made for local and global use.
            </Text>

            {/* SOCIAL ICONS LINKED TO FLEGA BRAND PAGES */}
            <Group gap="sm">
              <Anchor
                href="https://facebook.com/flegalostandfound"
                target="_blank"
                c={dimmedColor}
                style={iconStyle}
              >
                <IconBrandFacebook size={22} />
              </Anchor>

              <Anchor
                href="https://twitter.com/flega_et"
                target="_blank"
                c={dimmedColor}
                style={iconStyle}
              >
                <IconBrandTwitter size={22} />
              </Anchor>

              <Anchor
                href="https://instagram.com/flega_et"
                target="_blank"
                c={dimmedColor}
                style={iconStyle}
              >
                <IconBrandInstagram size={22} />
              </Anchor>

              <Anchor
                href="https://linkedin.com/company/flega"
                target="_blank"
                c={dimmedColor}
                style={iconStyle}
              >
                <IconBrandLinkedin size={22} />
              </Anchor>

              <Anchor
                href="https://youtube.com/@flega"
                target="_blank"
                c={dimmedColor}
                style={iconStyle}
              >
                <IconBrandYoutube size={22} />
              </Anchor>
            </Group>
          </Stack>

          {/* Product Column */}
          <Stack gap="sm">
            <Text fw={700} c={headingColor}>Product</Text>
            {['Features', 'Pricing', 'Updates'].map((link) => (
              <Anchor key={link} href="#" size="sm" c={dimmedColor} underline="never">
                {link}
              </Anchor>
            ))}
          </Stack>

          {/* Company Column */}
          <Stack gap="sm">
            <Text fw={700} c={headingColor}>Company</Text>
            <Anchor component={Link} href="/about" size="sm" c={dimmedColor} underline="never">
              About
            </Anchor>
            <Anchor component={Link} href="/about" size="sm" c={dimmedColor} underline="never">
              Contact us
            </Anchor>
            <Anchor href="#" size="sm" c={dimmedColor} underline="never">
              Blog
            </Anchor>
          </Stack>

          {/* Support Column */}
          <Stack gap="sm">
            <Text fw={700} c={headingColor}>Support</Text>
            {['Help center', 'Report a bug', 'Chat support'].map((link) => (
              <Anchor key={link} href="#" size="sm" c={dimmedColor} underline="never">
                {link}
              </Anchor>
            ))}
          </Stack>

          {/* Contacts Column */}
          <Stack gap="sm">
            <Text fw={700} c={headingColor}>Contact us</Text>
            <Anchor href="mailto:contact@flega.com" size="sm" c={dimmedColor} underline="never">
              ✉️ contact@flega.com
            </Anchor>
            <Text size="sm" c={dimmedColor}>
              📍 Adama, Ethiopia
            </Text>
          </Stack>
        </SimpleGrid>

        <Divider mb="xl" color={borderColor} />

        <Group justify="space-between">
          <Text size="xs" c={dimmedColor}>Copyright © 2026 Flega™</Text>
          <Group gap="xs">
            <Anchor href="#" size="xs" c={dimmedColor}>
              Terms
            </Anchor>
            <Text size="xs" c={dimmedColor}>|</Text>
            <Anchor href="#" size="xs" c={dimmedColor}>
              Privacy
            </Anchor>
          </Group>
        </Group>
      </Container>
    </Box>
  );
}