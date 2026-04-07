'use client';

import { Text, Container } from '@mantine/core';

export default function Footer() {
  return (
    <Container mt={40} mb={20}>
      <Text size="sm" c="dimmed" ta="center">
        © {new Date().getFullYear()} AI Lost Person & Car Detection System
      </Text>
    </Container>
  );
}
