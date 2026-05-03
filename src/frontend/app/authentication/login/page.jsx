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
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SocialLoginIcons from '../../components/SocialLoginIcons';

// Helper to get dynamic background/color values
const getBg = (colorScheme, light, dark) => (colorScheme === 'dark' ? dark : light);
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

/* ---------------- Validation schemas ---------------- */
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
  // All hooks called unconditionally at the top
  const [type, setType] = useState('email');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [authChecking, setAuthChecking] = useState(true);

  const router = useRouter();
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const isMobile = useMediaQuery('(max-width: 576px)');
  const isTablet = useMediaQuery('(max-width: 768px)');

  const currentSchema = type === 'email' ? passwordLoginSchema : phoneLoginSchema;

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    trigger,
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(currentSchema),
    mode: 'onChange',
    defaultValues: {
      loginValue: '',
      password: '',
    },
  });

  // Check if user is already logged in
  useEffect(() => {
    const userData = localStorage.getItem('currentUser');
    const accessToken = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (userData && accessToken) {
      try {
        const user = JSON.parse(userData);
        if (user.role && user.role.toLowerCase() === 'admin') {
          router.push('/admin');
        } else {
          router.push('/user/dashboard');
        }
      } catch (e) {
        console.error('Error parsing user data', e);
        setAuthChecking(false);
      }
    } else {
      setAuthChecking(false);
    }
  }, [router]);

  // Check if user exists when login value changes (with debounce)
  useEffect(() => {
    const checkUserExists = async () => {
      if (!watchedValue || watchedValue.length < 3) {
        setUserExists(null);
        return;
      }

      setIsCheckingUser(true);
      setLoginError('');

      try {
let queryField = type === 'email' ? 'email' : 'phone';
        const response = await fetch(
          `http://localhost:3001/users/check?${queryField}=${encodeURIComponent(watchedValue)}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const users = await response.json();
          setUserExists(users.length > 0);

          if (users.length === 0) {
            setLoginError(`No account found with this ${type === 'email' ? 'email' : 'phone number'}`);
          } else {
            clearErrors('loginValue');
          }
        }
      } catch (error) {
        console.error('Error checking user:', error);
        setUserExists(null);
      } finally {
        setIsCheckingUser(false);
      }
    };

    const timeoutId = setTimeout(() => {
      checkUserExists();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [watchedValue, type, clearErrors]);

  // All other functions (showNotification, handleTypeSwitch, createLoginLog, onSubmit, etc.)
  const showNotification = (title, message, color, icon) => {
    notifications.show({
      title,
      message,
      color,
      icon,
      position: 'top-right',
      autoClose: 3000,
      withBorder: true,
    });
  };

  const handleTypeSwitch = () => {
    const newType = type === 'email' ? 'phone' : 'email';
    setType(newType);
    setValue('loginValue', '');
    setValue('password', '');
    setLoginError('');
    reset();
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setLoginError('');

    try {
      const queryField = type === 'email' ? 'email' : 'phone';

const response = await fetch(
        `http://localhost:3001/users/check?${queryField}=${encodeURIComponent(data.loginValue)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Login failed');
      }

      const result = await response.json();

      if (!result.data?.exists) {
        setLoginError(`No account found with this ${type === 'email' ? 'email' : 'phone number'}`);
        showNotification(
          'Account Not Found',
          `Please check your ${type === 'email' ? 'email' : 'phone number'} or sign up for a new account.`,
          'red',
          <IconX size={18} />
        );
        setIsSubmitting(false);
        return;
      }

      const user = result.data.user;

      showNotification(
        'Login Successful!',
        `Welcome back, ${user.firstName}!`,
        'green',
        <IconCheck size={18} />
      );

        showNotification(
          'Login Successful!',
          `Welcome back, ${user.firstName}!`,
          'green',
          <IconCheck size={18} />
        );

        localStorage.setItem('currentUser', JSON.stringify({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isActive: user.isActive,
        }));

        localStorage.setItem('isAuthenticated', 'true');

        await fetch(`http://localhost:3001/users/${user.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lastLogin: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        });

setTimeout(() => {
          if (user.role && user.role.toLowerCase() === 'admin') {
            router.push('/admin');
          } else {
            router.push('/user/dashboard');
          }
        }, 1000);

      } else {
        setLoginError('Invalid password. Please try again.');
        showNotification(
          'Login Failed',
          'The password you entered is incorrect.',
          'red',
          <IconX size={18} />
        );
      }

    } catch (error) {
      console.error('Login error:', error);
      setLoginError(error.message || 'An error occurred. Please try again.');
      showNotification(
        'Error',
        error.message || 'Failed to connect to server. Please check your connection.',
        'red',
        <IconX size={18} />
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    const watchedValue = watch('loginValue');
    if (!watchedValue || errors.loginValue) {
      showNotification(
        'Error',
        'Please enter a valid email or phone number first.',
        'red',
        <IconX size={18} />
      );
      return;
    }

    showNotification(
      'Password Reset',
      `Password reset instructions have been sent to your ${type === 'email' ? 'email' : 'phone'}.`,
      'blue',
      <IconCheck size={18} />
    );
  };

  // Conditional rendering after all hooks are defined
  if (authChecking) {
    return (
      <Center style={{ minHeight: '100vh', background: getBg(colorScheme, '#EAF2FF', theme.colors.dark[7]) }}>
        <Loader size="xl" color="blue" />
      </Center>
    );
  }

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