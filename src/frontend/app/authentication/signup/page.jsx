'use client';

import {
  Container,
  Paper,
  TextInput,
  PasswordInput,
  Button,
  Title,
  Text,
  Grid,
  Box,
  Alert,
  rem,
  useMantineTheme,
  useMantineColorScheme,
} from '@mantine/core';
import { IconAlertCircle, IconCheck, IconX } from '@tabler/icons-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/navigation';

// Helper to get dynamic background/color values
const getBg = (colorScheme, light, dark) => (colorScheme === 'dark' ? dark : light);
const getTextColor = (colorScheme, light, dark) => (colorScheme === 'dark' ? dark : light);

/* ---------------- Zod schema ---------------- */
const signupSchema = z.object({
  firstName: z.string().min(2).max(50).regex(/^[A-Za-z\s]+$/, {
    message: 'First name must contain only letters and spaces',
  }),
  lastName: z.string().min(2).max(50).regex(/^[A-Za-z\s]+$/, {
    message: 'Last name must contain only letters and spaces',
  }),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number cannot exceed 15 digits')
    .regex(/^[0-9+\-\s()]+$/, 'Please enter a valid phone number'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function SignupPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMobile = useMediaQuery('(max-width: 576px)');
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const router = useRouter();

  // Dynamic colors
  const mainBg = getBg(colorScheme, '#EAF2FF', theme.colors.dark[7]);
  const paperBg = getBg(colorScheme, '#dbeafe', theme.colors.blue[9]);
  const textColor = getBg(colorScheme, undefined, theme.colors.gray[3]);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid },
    reset,
    trigger,
    watch,
  } = useForm({
    resolver: zodResolver(signupSchema),
    mode: 'onBlur',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Watch password field for real-time validation feedback
  const password = watch('password');

  const showNotification = (title, message, color, icon) => {
    notifications.show({
      title,
      message,
      color,
      icon,
      position: 'top-right',
      autoClose: 5000,
      withBorder: true,
    });
  };

  const validatePassword = (password) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
    };
    return requirements;
  };

  // Create signup log entry
  const createSignupLog = async (user) => {
    try {
      // Optionally fetch IP address
      let ipAddress = 'unknown';
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipRes.json();
        ipAddress = ipData.ip;
      } catch (ipError) {
        console.warn('Could not fetch IP address', ipError);
      }

      const logEntry = {
        userId: user.id,
        userEmail: user.email,
        action: 'signup',
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        ipAddress,
      };

      await fetch('http://localhost:3001/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry),
      });
    } catch (error) {
      console.error('Failed to create signup log:', error);
      // Non‑blocking – signup still succeeds
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    try {
      // Generate UUID for the new user
      const userId = uuidv4();
      const createdAt = new Date().toISOString();

      // Prepare user data for API (remove confirmPassword)
      const { confirmPassword, ...userDataToSave } = {
        id: userId,
        ...data,
        confirmPassword: undefined,
        createdAt,
        updatedAt: createdAt,
        isActive: true,
        role: 'user',
      };

      // ✅ Uncommented user creation fetch
      const response = await fetch('http://localhost:3001/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userDataToSave),
      });

      if (!response.ok) {
        throw new Error('Failed to create account');
      }

      const result = await response.json();

      // Log the signup with the newly created user's ID
      await createSignupLog(result).catch(err => console.error('Signup log error:', err));

      showNotification(
        'Success!',
        'Account created successfully! Redirecting to login...',
        'green',
        <IconCheck size={18} />
      );

      console.log('User created:', result);
      reset();

      // Redirect to login page after a short delay
      setTimeout(() => {
        router.push('/authentication/login');
      }, 1500);

    } catch (error) {
      console.error('Signup error:', error);

      showNotification(
        'Error',
        error.message || 'Failed to create account. Please try again.',
        'red',
        <IconX size={18} />
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const passwordRequirements = validatePassword(password);

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
      <Container size={isMobile ? 'sm' : 500}>
        <Paper radius="lg" p={isMobile ? 'md' : 'xl'} shadow="md" bg={paperBg}>
          <Box ta="center" mb="md">
            <Image
              src="/logo.jpg"
              alt="Logo"
              width={100}
              height={75}
              style={{ objectFit: 'contain', borderRadius: 8 }}
              priority
            />
          </Box>

          <Title ta="center" mb="md" order={2} c={textColor}>
            Create Account
          </Title>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid>
              <Grid.Col span={isMobile ? 12 : 6}>
                <TextInput
                  label="First Name"
                  placeholder="Enter your first name"
                  {...register('firstName')}
                  error={errors.firstName?.message}
                  onBlur={() => trigger('firstName')}
                  disabled={isSubmitting}
                />
              </Grid.Col>
              <Grid.Col span={isMobile ? 12 : 6}>
                <TextInput
                  label="Last Name"
                  placeholder="Enter your last name"
                  {...register('lastName')}
                  error={errors.lastName?.message}
                  onBlur={() => trigger('lastName')}
                  disabled={isSubmitting}
                />
              </Grid.Col>
            </Grid>

            <TextInput
              mt="md"
              label="Email"
              type="email"
              placeholder="you@example.com"
              {...register('email')}
              error={errors.email?.message}
              onBlur={() => trigger('email')}
              disabled={isSubmitting}
            />

            <TextInput
              mt="md"
              label="Phone"
              placeholder="+1 (555) 123-4567"
              {...register('phone')}
              error={errors.phone?.message}
              onBlur={() => trigger('phone')}
              disabled={isSubmitting}
            />

            <PasswordInput
              mt="md"
              label="Password"
              placeholder="Create a strong password"
              {...register('password')}
              error={errors.password?.message}
              onBlur={() => trigger('password')}
              disabled={isSubmitting}
            />

            <PasswordInput
              mt="md"
              label="Confirm Password"
              placeholder="Re-enter your password"
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
              onBlur={() => trigger('confirmPassword')}
              disabled={isSubmitting}
            />

            {/* Password Requirements */}
            <Alert
              mt="md"
              icon={<IconAlertCircle size={16} />}
              color="blue"
              title="Password Requirements"
              variant="light"
            >
              <Box style={{ fontSize: rem(14) }}>
                <Text>Password must contain:</Text>
                <Box ml="md" mt={4}>
                  <Text color={passwordRequirements.length ? 'green' : 'red'} size="sm">
                    • At least 8 characters {passwordRequirements.length ? '✓' : '✗'}
                  </Text>
                  <Text color={passwordRequirements.uppercase ? 'green' : 'red'} size="sm">
                    • One uppercase letter {passwordRequirements.uppercase ? '✓' : '✗'}
                  </Text>
                  <Text color={passwordRequirements.lowercase ? 'green' : 'red'} size="sm">
                    • One lowercase letter {passwordRequirements.lowercase ? '✓' : '✗'}
                  </Text>
                  <Text color={passwordRequirements.number ? 'green' : 'red'} size="sm">
                    • One number {passwordRequirements.number ? '✓' : '✗'}
                  </Text>
                  <Text color={passwordRequirements.special ? 'green' : 'red'} size="sm">
                    • One special character {passwordRequirements.special ? '✓' : '✗'}
                  </Text>
                </Box>
              </Box>
            </Alert>

            <Button
              fullWidth
              mt="xl"
              type="submit"
              loading={isSubmitting}
              disabled={!isDirty || !isValid || isSubmitting}
              size="md"
            >
              Create Account
            </Button>
          </form>

          <Text ta="center" mt="md" size="sm" c="dimmed">
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#228be6', textDecoration: 'none' }}>
              Sign in
            </Link>
          </Text>
        </Paper>
      </Container>
    </Box>
  );
}