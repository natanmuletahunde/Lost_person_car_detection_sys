'use client';

import { ActionIcon, useMantineColorScheme } from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';

export default function DarkModeFloatingButton() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  return (
    <ActionIcon
      variant="filled"
      radius="xl"
      size="lg"
      onClick={() => toggleColorScheme()}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 1000, // high enough to stay above other elements
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        transition: 'transform 0.2s ease',
      }}
      sx={(theme) => ({
        backgroundColor: theme.colors.blue[6],
        '&:hover': {
          transform: 'scale(1.1)',
          backgroundColor: theme.colors.blue[7],
        },
      })}
    >
      {colorScheme === 'dark' ? <IconSun size={20} /> : <IconMoon size={20} />}
    </ActionIcon>
  );
}