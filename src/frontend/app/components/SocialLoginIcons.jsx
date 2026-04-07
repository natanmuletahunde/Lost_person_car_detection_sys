'use client';

import { Group, ActionIcon } from '@mantine/core';
import {
  IconBrandGoogle,
  IconBrandFacebook,
  IconBrandTelegram,
} from '@tabler/icons-react';

export default function SocialLoginIcons() {
  return (
    <Group justify="center" gap="xl">
      <ActionIcon
        component="a"
        href="https://accounts.google.com"
        target="_blank"
        size="lg"
        variant="subtle"
      >
        <IconBrandGoogle size={28} color="#DB4437" />
      </ActionIcon>

      <ActionIcon
        component="a"
        href="https://facebook.com"
        target="_blank"
        size="lg"
        variant="subtle"
      >
        <IconBrandFacebook size={28} color="#1877F2" />
      </ActionIcon>

      <ActionIcon
        component="a"
        href="https://telegram.org"
        target="_blank"
        size="lg"
        variant="subtle"
      >
        <IconBrandTelegram size={28} color="#229ED9" />
      </ActionIcon>
    </Group>
  );
}
