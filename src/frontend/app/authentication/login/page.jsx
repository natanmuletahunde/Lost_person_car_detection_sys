'use client';

import {
  Container,
  Paper,
  TextInput,
  Button,
  Title,
  Text,
  Divider,
  Box,
  rem,
  PasswordInput,
  Alert,
  useMantineTheme,
  useMantineColorScheme,
  Center,
  Loader,
} from '@mantine/core';
import { IconCheck, IconX, IconAlertCircle } from '@tabler/icons-react';
import Image from 'next/image';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SocialLoginIcons from '../../components/SocialLoginIcons';

const getBg = (colorScheme, light, dark) =>
  colorScheme === 'dark' ? dark : light;

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

/* ---------------- Validation ---------------- */
const passwordLoginSchema = z.object({
  loginValue: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

const phoneLoginSchema = z.object({
  loginValue: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number cannot exceed 15 digits')
    .regex(/^[\d\s\+\-]+$/, 'Invalid phone number'),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginPage() {
  const [type, setType] = useState('email');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');

  const router = useRouter();
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const isMobile = useMediaQuery('(max-width: 576px)');
  const isTablet = useMediaQuery('(max-width: 768px)');

  const schema = type === 'email' ? passwordLoginSchema : phoneLoginSchema;

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    trigger,
    watch,
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { loginValue: '', password: '' },
  });

  const watchedValue = watch('loginValue');

  const notify = (title, message, color, icon) =>
    notifications.show({
      title,
      message,
      color,
      icon,
      position: 'top-right',
    });

  const handleTypeSwitch = () => {
    setType(type === 'email' ? 'phone' : 'email');
    reset();
    setLoginError('');
  };

  const handleForgotPassword = () => {
    if (!watchedValue || errors.loginValue) {
      notify(
        'Error',
        'Please enter a valid email or phone number first.',
        'red',
        <IconX size={18} />
      );
      return;
    }

    notify(
      'Password Reset',
      `Password reset instructions have been sent to your ${type === 'email' ? 'email' : 'phone'}.`,
      'blue',
      <IconCheck size={18} />
    );
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setLoginError('');

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Login failed');

      const { user, token, accessToken, refreshToken } = result.data;
      const resolvedAccessToken = accessToken || token;

      if (!resolvedAccessToken) {
        throw new Error('Login succeeded but no access token was returned');
      }

      localStorage.setItem('accessToken', resolvedAccessToken);
      localStorage.setItem('token', resolvedAccessToken);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      localStorage.setItem('currentUser', JSON.stringify(user));
      localStorage.setItem('isAuthenticated', 'true');

      notify('Success', `Welcome ${user.firstName}`, 'green', <IconCheck />);

      setTimeout(() => {
        const redirectUrl = sessionStorage.getItem('redirectUrl');
        if (redirectUrl) {
          sessionStorage.removeItem('redirectUrl');
          router.push(redirectUrl);
        } else {
          router.push(user.role === 'admin' ? '/admin' : '/user/homepage');
        }
      }, 800);
    } catch (err) {
      setLoginError(err.message);
      notify('Error', err.message, 'red', <IconX />);
    } finally {
      setIsSubmitting(false);
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
      <Container size={isMobile ? 'sm' : isTablet ? 500 : 500}>
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
            WELCOME !!
          </Title>

          <Title ta="center" order={4} mb="md" c={textColor}>
            Login
          </Title>

          <Text ta="center" mb="sm" c="dimmed">
            {type === 'email'
              ? 'Please enter your email and password'
              : 'Please enter your phone number and password'}
          </Text>

          <form onSubmit={handleSubmit(onSubmit)}>
            <TextInput
              label={type === 'email' ? 'Email' : 'Phone number'}
              placeholder={
                type === 'email'
                  ? 'example@email.com'
                  : '+251 9xx xxx xxx'
              }
              {...register('loginValue')}
              error={errors.loginValue?.message}
              onBlur={() => trigger('loginValue')}
              disabled={isSubmitting}
            />

            <PasswordInput
              mt="md"
              label="Password"
              placeholder="Enter your password"
              {...register('password')}
              error={errors.password?.message}
              onBlur={() => trigger('password')}
              disabled={isSubmitting}
            />

            {loginError && (
              <Alert
                mt="md"
                icon={<IconAlertCircle size={16} />}
                color="red"
                variant="light"
                title="Login Error"
                withCloseButton
                onClose={() => setLoginError('')}
              >
                {loginError}
              </Alert>
            )}

            <Button
              fullWidth
              mt="md"
              type="submit"
              loading={isSubmitting}
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          <Box mt="sm" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text
              c="blue"
              onClick={handleTypeSwitch}
              style={{ cursor: 'pointer' }}
              size="sm"
            >
              {type === 'email'
                ? 'Login using phone number'
                : 'Login using email'}
            </Text>

            <Text
              c="blue"
              onClick={handleForgotPassword}
              style={{ cursor: 'pointer' }}
              size="sm"
            >
              Forgot password?
            </Text>
          </Box>

          <Text ta="center" mt="xs" c="dimmed">
            Don't have an account?{' '}
            <Link href="/authentication/signup" style={{ color: '#228be6', textDecoration: 'none' }}>
              Sign up
            </Link>
          </Text>

          <Divider my="md" label="or sign in using" labelPosition="center" />

          <SocialLoginIcons isMobile={isMobile} />

          <Alert
            mt="lg"
            icon={<IconAlertCircle size={16} />}
            color="gray"
            variant="outline"
            title="Demo Credentials"
            size="sm"
          >
            <Text size="xs">
              Try: john@example.com / SecurePass123!
            </Text>
          </Alert>
        </Paper>
      </Container>
    </Box>
  );
}