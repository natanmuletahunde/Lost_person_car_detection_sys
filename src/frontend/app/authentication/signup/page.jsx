'use client';

function getBg(colorScheme, light, dark) {
  return colorScheme === 'dark' ? dark : light;
}

import {
  Container,
  Paper,
  TextInput,
  PasswordInput,
  Button,
  Title,
  Grid,
  Box,
  rem,
  useMantineTheme,
  useMantineColorScheme,
  Text,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconCheck, IconX } from '@tabler/icons-react';
import Image from 'next/image';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import Link from 'next/link';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

/* ---------------- Schema ---------------- */
const signupSchema = z
  .object({
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(10),
    telegramUsername: z.string().optional(),
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const isMobile = useMediaQuery('(max-width: 576px)');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(signupSchema),
  });

  const notify = (t, m, c, i) =>
    notifications.show({ title: t, message: m, color: c, icon: i });

  const onSubmit = async (data) => {
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message);

      const { user, token, accessToken, refreshToken } = result.data;
      const resolvedAccessToken = accessToken || token;

      if (!resolvedAccessToken) {
        throw new Error('Signup succeeded but no access token was returned');
      }

      localStorage.setItem('accessToken', resolvedAccessToken);
      localStorage.setItem('token', resolvedAccessToken);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      localStorage.setItem('currentUser', JSON.stringify(user));
      localStorage.setItem('isAuthenticated', 'true');

      notify('Success', 'Account created', 'green', <IconCheck />);

      reset();

      setTimeout(() => router.push('/authentication/login'), 800);
    } catch (err) {
      notify('Error', err.message, 'red', <IconX />);
    } finally {
      setLoading(false);
    }
  };

  const mainBg = getBg(colorScheme, '#EAF2FF', theme.colors.dark[7]);
  const paperBg = getBg(colorScheme, '#dbeafe', theme.colors.blue[9]);
  const textColor = getBg(colorScheme, undefined, theme.colors.gray[3]);

  return (
    <Box
      style={{
        minHeight: '100vh',
        backgroundColor: mainBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: rem(16),
      }}
    >
      <Container size={500}>
        <Paper radius="lg" p={isMobile ? 'md' : 'xl'} shadow="md" bg={paperBg}>
          <Box ta="center" mb="sm">
            <Image
              src="/logo.jpg"
              alt="Logo"
              width={isMobile ? 80 : 100}
              height={isMobile ? 60 : 75}
              style={{ objectFit: 'contain', borderRadius: 8 }}
              priority
            />
          </Box>

          <Title ta="center" fw={700} c={textColor}>
            JOIN US !!
          </Title>

          <Title ta="center" order={4} mb="md" c={textColor}>
            Sign Up
          </Title>

          <Text ta="center" mb="sm" c="dimmed">
            Please fill in the details to create your account
          </Text>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid gutter="md">
              <Grid.Col span={6}>
                <TextInput
                  label="First Name"
                  placeholder="First name"
                  {...register('firstName')}
                  error={errors.firstName?.message}
                  disabled={loading}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput
                  label="Last Name"
                  placeholder="Last name"
                  {...register('lastName')}
                  error={errors.lastName?.message}
                  disabled={loading}
                />
              </Grid.Col>
            </Grid>

            <TextInput
              mt="md"
              label="Email"
              placeholder="example@email.com"
              {...register('email')}
              error={errors.email?.message}
              disabled={loading}
            />
            <TextInput
              mt="md"
              label="Phone"
              placeholder="+251 9xx xxx xxx"
              {...register('phone')}
              error={errors.phone?.message}
              disabled={loading}
            />
            <TextInput
              mt="md"
              label="Telegram Username (Optional)"
              placeholder="@username"
              description="To receive direct alerts via Telegram"
              {...register('telegramUsername')}
              error={errors.telegramUsername?.message}
              disabled={loading}
            />

            <PasswordInput
              mt="md"
              label="Password"
              placeholder="Enter your password"
              {...register('password')}
              error={errors.password?.message}
              disabled={loading}
            />
            <PasswordInput
              mt="md"
              label="Confirm Password"
              placeholder="Confirm your password"
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
              disabled={loading}
            />

            <Button
              fullWidth
              mt="xl"
              type="submit"
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <Text ta="center" mt="md" c="dimmed">
            Already have an account?{' '}
            <Link href="/authentication/login" style={{ color: '#228be6', textDecoration: 'none' }}>
              Login
            </Link>
          </Text>
        </Paper>
      </Container>
    </Box>
  );
}