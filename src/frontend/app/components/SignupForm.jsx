'use client';

import {
  TextInput,
  PasswordInput,
  Button,
  Stack,
} from '@mantine/core';

export default function SignupForm() {
  return (
    <Stack gap="md">
      <TextInput
        label="Full Name"
        placeholder="Enter your full name"
        radius="md"
        required
      />

      <TextInput
        label="Email Address"
        placeholder="example@email.com"
        radius="md"
        required
      />

      <TextInput
        label="Phone Number"
        placeholder="+251 9xx xxx xxx"
        radius="md"
        required
      />

      <PasswordInput
        label="Password"
        placeholder="Create a password"
        radius="md"
        required
      />

      <PasswordInput
        label="Confirm Password"
        placeholder="Repeat password"
        radius="md"
        required
      />

      <Button
        fullWidth
        size="md"
        radius="md"
        mt="md"
      >
        Sign Up
      </Button>
    </Stack>
  );
}
