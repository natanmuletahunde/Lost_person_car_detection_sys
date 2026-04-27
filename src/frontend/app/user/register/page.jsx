'use client';

import { useState, useEffect } from 'react';
import {
  Container, Box, Title, Text, SimpleGrid, Paper, Button, Stack,
  Loader, Alert, Badge, Divider, Flex, Stepper,
  Card, Tabs, Collapse, ActionIcon, Tooltip,
  Avatar, Modal, useMantineTheme,
  Checkbox, useMantineColorScheme
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconInfoCircle, IconAlertCircle, IconCheck, IconBrandTelegram,
  IconPhone, IconMail, IconUser, IconChevronRight, IconChevronLeft,
  IconQuestionMark, IconMap, IconCar, IconUserPlus, IconLock,
  IconWorld, IconMessageCircle, IconArrowRight, IconRefresh,
  IconExternalLink, IconShieldCheck, IconEyeOff, IconStar,
  IconHome, IconDashboard, IconAlertTriangle
} from '@tabler/icons-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMediaQuery } from '@mantine/hooks';
import dynamic from 'next/dynamic';

import MainFooter from '../../components/MainFooter';
import carData from '../register/data/carData';
import {
  API_BASE_URL, MISSING_PERSONS_API, MISSING_VEHICLES_API, USERS_API,
  PRIMARY_COLOR, PRIMARY_LIGHT, PRIMARY_DARK, PRIMARY_GRADIENT,
  colorOptions, regionOptions
} from './constants';
import {
  PersonDetailsStep,
  VehicleDetailsStep,
  SpecialCaseDetailsStep,
  LastSeenStep,
  ContactInfoStep,
  ReviewSubmitStep
} from './FormSections';

// Lazy load the map component
const LocationPicker = dynamic(() => import('../../components/LocationPicker'), {
  ssr: false,
  loading: () => (
    <Box style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f5ff' }}>
      <Loader size="lg" color={PRIMARY_COLOR} />
    </Box>
  ),
});

// Helper for dynamic background/text colors
const getBg = (colorScheme, light, dark) => colorScheme === 'dark' ? dark : light;

const gradientIconBox = { background: PRIMARY_GRADIENT, padding: '10px', borderRadius: '10px', color: 'white' };

export default function UnifiedRegisterPage() {
  const router = useRouter();
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);

  const [regType, setRegType] = useState('Person');
  const [loading, setLoading] = useState(true);
  const [showSubscriptionRedirect, setShowSubscriptionRedirect] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([false, false, false, false, false]);
  const [imagePreview, setImagePreview] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [isHelpVisible, setIsHelpVisible] = useState(false);
  const [mapCenter, setMapCenter] = useState([9.03, 38.74]);

  // Vehicle selection states
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedSubmodel, setSelectedSubmodel] = useState(null);
  const [ownershipDoc, setOwnershipDoc] = useState(null);
  const [ownershipDocError, setOwnershipDocError] = useState('');

  // Special case states
  const [specialCategory, setSpecialCategory] = useState(null);
  const [doctorReport, setDoctorReport] = useState(null);
  const [criminalRecord, setCriminalRecord] = useState(null);

  // Central form state
  const [formValues, setFormValues] = useState({
    firstName: '', middleName: '', lastName: '', gender: '', age: '', height: '', weight: '',
    description: '', specialCase: '', brand: '', model: '', submodel: '', color: '',
    vehicleDescription: '', plateType: '', region: '', code: '', plateNumber: '',
    specialCategory: '', location: '', lastSeenDate: '', lastSeenTime: '',
    telegramUsername: '', additionalContactInfo: '', latitude: '', longitude: '',
  });

  // Dropdown data
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [submodels, setSubmodels] = useState([]);

  const steps = [
    { label: 'Basic Info', icon: <IconUser size={18} /> },
    {
      label: regType === 'Person' ? 'Person Details' : regType === 'Vehicle' ? 'Vehicle Details' : 'Special Case Details',
      icon: regType === 'Person' ? <IconUserPlus size={18} /> : regType === 'Vehicle' ? <IconCar size={18} /> : <IconAlertTriangle size={18} />
    },
    { label: 'Last Seen', icon: <IconMap size={18} /> },
    { label: 'Contact Info', icon: <IconMessageCircle size={18} /> },
    { label: 'Review & Submit', icon: <IconCheck size={18} /> },
  ];

  // ------------------- LOGGING FUNCTION -------------------
  const createReportLog = async (reportData) => {
    try {
      let ipAddress = 'unknown';
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipRes.json();
        ipAddress = ipData.ip;
      } catch (ipError) {
        console.warn('Could not fetch IP address', ipError);
      }

      const logEntry = {
        userId: currentUser?.id,
        userEmail: currentUser?.email,
        action: 'report_submission',
        reportType: regType,
        reportId: reportData.caseId,
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
      console.error('Failed to create report submission log:', error);
      // Non-blocking
    }
  };
  // ---------------------------------------------------------

  // Authentication and registration check
  useEffect(() => {
    const checkRegistrationAndAuth = async () => {
      try {
        const isAuthenticated = localStorage.getItem('isAuthenticated');
        const userData = localStorage.getItem('currentUser');

        if (!isAuthenticated || !userData || isAuthenticated !== 'true') {
          sessionStorage.setItem('redirectUrl', window.location.pathname);
          notifications.show({ title: 'Login Required', message: 'Please login to submit a report', color: 'yellow', icon: <IconAlertCircle size={20} /> });
          router.push('/login');
          return;
        }

        const parsedUser = JSON.parse(userData);
        const response = await fetch(`${USERS_API}/${parsedUser.id}`);
        if (response.ok) {
          const userFromServer = await response.json();
          setCurrentUser(userFromServer);
          if (!userFromServer.isActive) {
            notifications.show({ title: 'Account Inactive', message: 'Your account has been deactivated. Please contact support.', color: 'red', icon: <IconAlertCircle size={20} /> });
            router.push('/login');
            return;
          }
          const registrationCount = userFromServer.registrations || 0;
          if (registrationCount >= 1 && !userFromServer.hasPaidSubscription) {
            setShowSubscriptionRedirect(true);
            setTimeout(() => router.push('/subscribe'), 3000);
            setLoading(false);
            return;
          }
        } else {
          throw new Error('Failed to fetch user data');
        }
        setLoading(false);
      } catch (error) {
        console.error('Error checking registration and auth:', error);
        setLoading(false);
      }
    };
    checkRegistrationAndAuth();
  }, [router]);

  // Initialize brands from carData
  useEffect(() => {
    const brandList = Object.keys(carData);
    setBrands(brandList);
  }, []);

  // Update models when brand changes
  useEffect(() => {
    if (selectedBrand && carData[selectedBrand]) {
      const modelList = Object.keys(carData[selectedBrand]);
      setModels(modelList);
      setSelectedModel(null);
      setSelectedSubmodel(null);
      setFormValues(prev => ({ ...prev, brand: selectedBrand, model: '', submodel: '' }));
    } else {
      setModels([]);
      setSubmodels([]);
    }
  }, [selectedBrand]);

  // Update submodels when model changes
  useEffect(() => {
    if (selectedBrand && selectedModel && carData[selectedBrand]) {
      const brandData = carData[selectedBrand];
      if (brandData[selectedModel]) {
        const submodelList = brandData[selectedModel];
        setSubmodels(submodelList);
        setSelectedSubmodel(null);
        setFormValues(prev => ({ ...prev, model: selectedModel, submodel: '' }));
      }
    } else {
      setSubmodels([]);
    }
  }, [selectedBrand, selectedModel]);

  useEffect(() => {
    if (selectedSubmodel) {
      setFormValues(prev => ({ ...prev, submodel: selectedSubmodel }));
    }
  }, [selectedSubmodel]);

  useEffect(() => {
    setFormValues(prev => ({ ...prev, specialCategory: specialCategory || '' }));
  }, [specialCategory]);

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Validate ownership document
  const validateOwnershipDoc = (file) => {
    if (!file) {
      setOwnershipDocError('');
      return true;
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setOwnershipDocError('Only JPG, PNG, WebP, or PDF files are allowed.');
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      setOwnershipDocError('File size must be less than 10 MB.');
      return false;
    }
    setOwnershipDocError('');
    return true;
  };

  const handleOwnershipDocChange = (file) => {
    setOwnershipDoc(file);
    validateOwnershipDoc(file);
  };

  // Step validation
  const validateStep = (step) => {
    switch (step) {
      case 0:
        return true;
      case 1:
        if (regType === 'Person') {
          const required = ['firstName', 'lastName', 'gender', 'age'];
          const missing = required.filter(field => !formValues[field] || formValues[field].toString().trim() === '');
          if (missing.length > 0) {
            notifications.show({ title: 'Missing Information', message: `Please fill in: ${missing.join(', ')}`, color: 'red', icon: <IconAlertCircle size={20} /> });
            return false;
          }
          return true;
        } else if (regType === 'Vehicle') {
          const required = ['brand', 'model', 'color', 'plateType', 'region', 'code', 'plateNumber'];
          const missing = required.filter(field => !formValues[field] || formValues[field].toString().trim() === '');
          if (missing.length > 0) {
            notifications.show({ title: 'Missing Information', message: `Please fill in: ${missing.join(', ')}`, color: 'red', icon: <IconAlertCircle size={20} /> });
            return false;
          }
          if (ownershipDoc && !validateOwnershipDoc(ownershipDoc)) {
            notifications.show({ title: 'Invalid Ownership Document', message: ownershipDocError, color: 'red', icon: <IconAlertCircle size={20} /> });
            return false;
          }
          return true;
        } else if (regType === 'Special') {
          const required = ['firstName', 'lastName', 'gender', 'age', 'specialCategory'];
          const missing = required.filter(field => !formValues[field] || formValues[field].toString().trim() === '');
          if (missing.length > 0) {
            notifications.show({ title: 'Missing Information', message: `Please fill in: ${missing.join(', ')}`, color: 'red', icon: <IconAlertCircle size={20} /> });
            return false;
          }
          if (specialCategory === 'mentally-ill' && !doctorReport) {
            notifications.show({ title: 'Missing Doctor\'s Report', message: 'Please upload a doctor\'s report for mentally ill case.', color: 'red', icon: <IconAlertCircle size={20} /> });
            return false;
          }
          if (specialCategory === 'criminal' && !criminalRecord) {
            notifications.show({ title: 'Missing Criminal Record', message: 'Please upload the criminal record or arrest warrant.', color: 'red', icon: <IconAlertCircle size={20} /> });
            return false;
          }
          return true;
        }
        return false;
      case 2:
        if (!formValues.location || formValues.location.trim() === '') {
          notifications.show({ title: 'Missing Location', message: 'Please provide the last seen location.', color: 'red', icon: <IconAlertCircle size={20} /> });
          return false;
        }
        if (!formValues.lastSeenDate) {
          notifications.show({ title: 'Missing Date', message: 'Please provide the last seen date.', color: 'red', icon: <IconAlertCircle size={20} /> });
          return false;
        }
        return true;
      case 3:
        return true;
      case 4:
        return true;
      default:
        return true;
    }
  };

  const handleContinue = () => {
    if (validateStep(activeStep)) {
      const newCompleted = [...completedSteps];
      newCompleted[activeStep] = true;
      setCompletedSteps(newCompleted);
      setActiveStep(prev => Math.min(steps.length - 1, prev + 1));
    }
  };

  const handleStepClick = (stepIndex) => {
    if (stepIndex <= activeStep || completedSteps[stepIndex]) {
      setActiveStep(stepIndex);
    } else {
      notifications.show({
        title: 'Step Not Available',
        message: 'Please complete the previous steps first.',
        color: 'yellow',
        icon: <IconAlertCircle size={20} />,
      });
    }
  };

  const validateRequiredFieldsForSubmit = () => {
    for (let i = 0; i <= 3; i++) {
      if (!validateStep(i)) {
        setActiveStep(i);
        return false;
      }
    }
    return true;
  };

  const saveToJsonServer = async (data) => {
    try {
      const endpoint = regType === 'Vehicle' ? MISSING_VEHICLES_API : MISSING_PERSONS_API;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`Failed to save data: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error('Error saving to JSON Server:', error);
      throw error;
    }
  };

  const updateUserRegistrationCount = async (userId, newCount) => {
    try {
      const response = await fetch(`${USERS_API}/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrations: newCount, updatedAt: new Date().toISOString() }),
      });
      if (!response.ok) throw new Error('Failed to update user registration count');
      return await response.json();
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateRequiredFieldsForSubmit()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const caseId = `CASE-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      const reportData = {
        caseId,
        type: regType,
        reportedBy: {
          userId: currentUser.id,
          firstName: currentUser.firstName,
          lastName: currentUser.lastName,
          email: currentUser.email,
          phone: currentUser.phone,
          role: currentUser.role,
          telegramUsername: formValues.telegramUsername || null,
        },
        reportDate: new Date().toISOString(),
        status: 'Active',
        lastUpdated: new Date().toISOString(),
        verified: false,
        matches: [],
        notes: [],
        contactMethods: {
          email: currentUser.email,
          phone: currentUser.phone,
          telegram: formValues.telegramUsername || null,
        },
        ...formValues,
        ownershipDocument: ownershipDoc?.name,
        doctorReport: doctorReport?.name,
        criminalRecord: criminalRecord?.name,
        imagePreview: imagePreview || null,
      };

      // Save the report (unchanged)
      await saveToJsonServer(reportData);
      const currentRegistrations = currentUser.registrations || 0;
      const newCount = currentRegistrations + 1;
      const updatedUser = await updateUserRegistrationCount(currentUser.id, newCount);
      const newUserData = { ...currentUser, registrations: newCount, updatedAt: updatedUser.updatedAt };
      setCurrentUser(newUserData);
      localStorage.setItem('currentUser', JSON.stringify(newUserData));

      // ✅ LOG THE REPORT SUBMISSION
      await createReportLog(reportData).catch(err => console.error('Log error:', err));

      notifications.show({
        title: '🎉 Report Submitted Successfully!',
        message: (
          <div>
            <p><strong>Case ID:</strong> {caseId}</p>
            <p>
              {regType === 'Person' && `Person: ${formValues.firstName} ${formValues.lastName}`}
              {regType === 'Vehicle' && `Vehicle: ${formValues.brand} ${formValues.model} - ${formValues.plateNumber}`}
              {regType === 'Special' && `Special Case: ${formValues.firstName} ${formValues.lastName} (${formValues.specialCategory === 'mentally-ill' ? 'Mentally Ill' : 'Criminal Background'})`}
            </p>
            <Text size="sm" c="dimmed" mt={5}>We will contact you if we find any matches. {formValues.telegramUsername && `You can also be contacted via Telegram: @${formValues.telegramUsername}`}</Text>
          </div>
        ),
        color: 'blue',
        icon: <IconCheck size={20} />,
        autoClose: 10000,
        withCloseButton: true,
        withBorder: true,
        position: 'top-right',
      });

      setTimeout(() => router.push('/'), 1500);
    } catch (error) {
      console.error('Error submitting report:', error);
      notifications.show({ title: 'Submission Failed', message: 'Failed to submit report. Please try again.', color: 'red', icon: <IconAlertCircle size={20} /> });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormValues(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setActiveStep(0);
    setCompletedSteps([false, false, false, false, false]);
    setImagePreview(null);
    setSelectedBrand(null);
    setSelectedModel(null);
    setSelectedSubmodel(null);
    setOwnershipDoc(null);
    setOwnershipDocError('');
    setSpecialCategory(null);
    setDoctorReport(null);
    setCriminalRecord(null);
    setFormValues({
      firstName: '', middleName: '', lastName: '', gender: '', age: '', height: '', weight: '',
      description: '', specialCase: '', brand: '', model: '', submodel: '', color: '',
      vehicleDescription: '', plateType: '', region: '', code: '', plateNumber: '',
      specialCategory: '', location: '', lastSeenDate: '', lastSeenTime: '',
      telegramUsername: '', additionalContactInfo: '', latitude: '', longitude: ''
    });
    notifications.show({ title: 'Form Reset', message: 'All form data has been cleared', color: 'blue', icon: <IconRefresh size={16} /> });
  };

  if (loading) {
    return (
      <Box
        bg={getBg(colorScheme, 'white', theme.colors.dark[7])}
        style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: PRIMARY_GRADIENT }}
      >
        <Flex direction="column" align="center" gap="md">
          <Loader size="xl" color="white" variant="dots" />
          <Text c="white" size="lg" fw={600}>Loading your registration...</Text>
          <Text c="white" size="sm" opacity={0.8}>Please wait while we prepare your form</Text>
        </Flex>
      </Box>
    );
  }

  if (showSubscriptionRedirect) {
    return (
      <Box style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: PRIMARY_GRADIENT }}>
        <Container size="sm">
          <Alert icon={<IconAlertCircle size={24} />} title="Subscription Required" color="blue" variant="filled" radius="lg" p="xl" style={{ backdropFilter: 'blur(10px)', backgroundColor: 'rgba(0, 52, 209, 0.95)', border: '2px solid white' }}>
            <Stack gap="md">
              <Flex align="center" gap="md">
                <IconStar size={32} color="gold" />
                <Box>
                  <Text c="white" size="lg" fw={700}>Upgrade to Premium</Text>
                  <Text c="white" opacity={0.9}>You have already registered 1 {regType.toLowerCase()}.</Text>
                </Box>
              </Flex>
              <Text c="white">To register additional {regType === 'Person' ? 'people' : 'vehicles'}, you need to subscribe to a premium plan.</Text>
              <Box style={{ background: 'rgba(255, 255, 255, 0.1)', padding: 'md', borderRadius: 'md', border: '1px dashed rgba(255, 255, 255, 0.3)' }}>
                <Text c="white" size="sm" fw={600} ta="center">Premium Benefits:</Text>
                <SimpleGrid cols={2} spacing="xs" mt="xs">
                  <Flex align="center" gap="xs"><IconCheck size={14} color="#4dff4d" /><Text c="white" size="xs">Unlimited Reports</Text></Flex>
                  <Flex align="center" gap="xs"><IconCheck size={14} color="#4dff4d" /><Text c="white" size="xs">Priority Support</Text></Flex>
                  <Flex align="center" gap="xs"><IconCheck size={14} color="#4dff4d" /><Text c="white" size="xs">Advanced Search</Text></Flex>
                  <Flex align="center" gap="xs"><IconCheck size={14} color="#4dff4d" /><Text c="white" size="xs">Real-time Updates</Text></Flex>
                </SimpleGrid>
              </Box>
              <Text c="white" size="sm" ta="center">Redirecting to subscription page in 3 seconds...</Text>
              <Button color="yellow" size="lg" radius="xl" onClick={() => router.push('/subscribe')} mt="md" rightSection={<IconArrowRight size={20} />} style={{ background: 'linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)', fontWeight: 700, color: '#0034D1' }}>View Premium Plans</Button>
            </Stack>
          </Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      style={{
        minHeight: '100vh',
        background: isMobile
          ? getBg(colorScheme, '#f0f5ff', theme.colors.dark[7])
          : colorScheme === 'dark'
            ? `radial-gradient(circle at 10% 20%, rgba(0, 52, 209, 0.3) 0%, ${theme.colors.dark[7]} 100%)`
            : `radial-gradient(circle at 10% 20%, rgba(0, 52, 209, 0.05) 0%, #ffffff 100%)`,
        position: 'relative',
      }}
    >
      {/* Floating Help Button */}
      <Tooltip label="Quick Help & Tips" position="left" withArrow>
        <ActionIcon
          size="lg"
          radius="xl"
          variant="filled"
          style={{
            position: 'fixed', bottom: 20, right: 20, zIndex: 100,
            background: PRIMARY_GRADIENT,
            boxShadow: `0 6px 20px ${PRIMARY_COLOR}40`,
            border: `2px solid white`,
            transition: 'all 0.3s ease',
          }}
          onClick={() => setIsHelpVisible(!isHelpVisible)}
        >
          <IconQuestionMark size={22} color="white" />
        </ActionIcon>
      </Tooltip>

      {/* Help Panel */}
      <Collapse in={isHelpVisible}>
        <Paper
          p="md"
          radius="lg"
          bg={getBg(colorScheme, 'white', theme.colors.dark[6])}
          style={{
            position: 'fixed', bottom: 80, right: 20, zIndex: 99, maxWidth: 350,
            backdropFilter: 'blur(10px)',
            border: `2px solid ${PRIMARY_COLOR}`,
            boxShadow: `0 10px 40px rgba(0, 52, 209, 0.2)`,
          }}
        >
          <Flex justify="space-between" align="center" mb="xs">
            <Text size="sm" fw={700} c={PRIMARY_COLOR}><IconInfoCircle size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />Quick Guide</Text>
            <Badge color="blue" variant="light" size="sm">Step {activeStep + 1} of {steps.length}</Badge>
          </Flex>
          <Divider my="xs" color={getBg(colorScheme, theme.colors.gray[2], theme.colors.dark[5])} />
          <Stack gap="xs">
            <Text size="xs" c="dimmed">• All fields marked with <Text span c={PRIMARY_COLOR} fw={700}>*</Text> are required</Text>
            <Text size="xs" c="dimmed">• Use clear photos for better identification</Text>
            <Text size="xs" c="dimmed">• Provide accurate last seen location</Text>
            <Text size="xs" c="dimmed">• Add Telegram for faster communication</Text>
          </Stack>
          <Button size="xs" variant="light" color="blue" fullWidth mt="md" leftSection={<IconExternalLink size={14} />} style={{ border: `1px solid ${PRIMARY_COLOR}` }}>View Detailed Guide</Button>
        </Paper>
      </Collapse>

      {/* TOP HEADER WITH LOGO */}
      <Box
        bg={getBg(colorScheme, 'white', theme.colors.dark[7])}
        style={{
          borderBottom: `2px solid ${getBg(colorScheme, '#f0f5ff', theme.colors.dark[5])}`,
          boxShadow: `0 2px 15px rgba(0, 52, 209, 0.1)`,
          position: 'sticky', top: 0, zIndex: 100,
        }}
      >
        <Container size="lg">
          <Flex justify="space-between" align="center" py="sm" direction={isMobile ? 'column' : 'row'} gap={isMobile ? 'md' : 'xs'}>
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              <Flex align="center" gap="md">
                <Box style={{ display: 'inline-block', height: '40px', width: 'auto', overflow: 'hidden' }}>
                  <Image src="/logo.jpg" alt="Logo" width={2040} height={952} style={{ height: '100%', width: 'auto' }} />
                </Box>
                <Box>
                  <Text size={isMobile ? 'lg' : 'xl'} fw={900} style={{ color: PRIMARY_COLOR, letterSpacing: '-0.5px' }}>Report</Text>
                  <Text size="xs" c={PRIMARY_DARK} fw={600} style={{ letterSpacing: '1px' }}>Missing Persons & Vehicles Registry</Text>
                </Box>
              </Flex>
            </Link>
            <Flex align="center" gap="lg">
              <Flex gap="xs">
                <Tooltip label="Dashboard" position="bottom">
                  <ActionIcon size="lg" radius="md" variant="light" color="blue" onClick={() => router.push('/')} style={{ border: `1px solid ${PRIMARY_COLOR}30` }}><IconDashboard size={20} /></ActionIcon>
                </Tooltip>
                <Tooltip label="Home" position="bottom">
                  <ActionIcon size="lg" radius="md" variant="light" color="blue" onClick={() => router.push('/')} style={{ border: `1px solid ${PRIMARY_COLOR}30` }}><IconHome size={20} /></ActionIcon>
                </Tooltip>
              </Flex>
              <Flex
                align="center"
                gap="sm"
                style={{
                  padding: '8px 16px',
                  background: getBg(colorScheme, '#f0f5ff', theme.colors.dark[6]),
                  borderRadius: '30px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onClick={() => setShowContactModal(true)}
              >
                <Avatar
                  size="sm"
                  radius="xl"
                  src={currentUser?.avatar}
                  style={{ background: PRIMARY_GRADIENT, border: `2px solid white` }}
                >
                  {currentUser?.firstName?.[0]}{currentUser?.lastName?.[0]}
                </Avatar>
                <Box>
                  <Text size="sm" fw={600} style={{ color: PRIMARY_DARK }}>{currentUser?.firstName} {currentUser?.lastName}</Text>
                  <Text size="xs" c="dimmed">Report #{currentUser?.registrations ? currentUser.registrations + 1 : 1}</Text>
                </Box>
              </Flex>
            </Flex>
          </Flex>
        </Container>
      </Box>

      <Container size="lg" py={isMobile ? 20 : 40}>
        <Paper
          radius="lg"
          p={isMobile ? 'md' : 'xl'}
          bg={getBg(colorScheme, 'white', theme.colors.dark[7])}
          style={{
            border: `2px solid ${getBg(colorScheme, '#f0f5ff', theme.colors.dark[5])}`,
            boxShadow: `0 8px 30px rgba(0, 52, 209, 0.08)`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box style={{ position: 'absolute', top: 0, right: 0, width: 100, height: 100, background: PRIMARY_GRADIENT, borderBottomLeftRadius: '100%', opacity: 0.05 }} />

          <Flex justify="space-between" align="center" mb="xl" wrap="wrap" gap="md">
            <Flex align="center" gap="md">
              <Box style={{ background: PRIMARY_GRADIENT, padding: '14px', borderRadius: '14px', color: 'white', boxShadow: `0 6px 20px ${PRIMARY_COLOR}40` }}>
                {regType === 'Person' && <IconUserPlus size={32} />}
                {regType === 'Vehicle' && <IconCar size={32} />}
                {regType === 'Special' && <IconAlertTriangle size={32} />}
              </Box>
              <Box>
                <Title order={2} style={{ color: PRIMARY_DARK, fontWeight: 800 }}>
                  Register Missing {regType === 'Person' ? 'Person' : regType === 'Vehicle' ? 'Vehicle' : 'Special Case'}
                </Title>
                <Text c="dimmed" size="sm">Complete all sections below. Required fields are marked with <Text span c={PRIMARY_COLOR} fw={700} mx={4}>*</Text></Text>
              </Box>
            </Flex>

            <Tabs
              value={regType}
              onChange={setRegType}
              variant="pills"
              radius="xl"
              style={{ minWidth: isMobile ? '100%' : 'auto' }}
            >
              <Tabs.List grow={isMobile} bg={getBg(colorScheme, '#f0f5ff', theme.colors.dark[6])}>
                <Tabs.Tab
                  value="Person"
                  leftSection={<IconUserPlus size={18} />}
                  style={{
                    background: regType === 'Person' ? PRIMARY_GRADIENT : 'transparent',
                    color: regType === 'Person' ? 'white' : PRIMARY_COLOR,
                    fontWeight: regType === 'Person' ? 700 : 500,
                    border: regType === 'Person' ? 'none' : `1px solid ${PRIMARY_COLOR}40`,
                  }}
                >
                  Missing Person
                </Tabs.Tab>
                <Tabs.Tab
                  value="Vehicle"
                  leftSection={<IconCar size={18} />}
                  style={{
                    background: regType === 'Vehicle' ? PRIMARY_GRADIENT : 'transparent',
                    color: regType === 'Vehicle' ? 'white' : PRIMARY_COLOR,
                    fontWeight: regType === 'Vehicle' ? 700 : 500,
                    border: regType === 'Vehicle' ? 'none' : `1px solid ${PRIMARY_COLOR}40`,
                  }}
                >
                  Missing Vehicle
                </Tabs.Tab>
                <Tabs.Tab
                  value="Special"
                  leftSection={<IconAlertTriangle size={18} />}
                  style={{
                    background: regType === 'Special' ? PRIMARY_GRADIENT : 'transparent',
                    color: regType === 'Special' ? 'white' : PRIMARY_COLOR,
                    fontWeight: regType === 'Special' ? 700 : 500,
                    border: regType === 'Special' ? 'none' : `1px solid ${PRIMARY_COLOR}40`,
                  }}
                >
                  Special Case
                </Tabs.Tab>
              </Tabs.List>
            </Tabs>
          </Flex>

          {/* STEPPER WITH GREEN CHECKMARK ICON */}
          <Stepper
            active={activeStep}
            onStepClick={handleStepClick}
            size={isMobile ? 'sm' : 'md'}
            mb="xl"
            styles={{
              step: { cursor: 'pointer' },
              stepIcon: {
                borderWidth: 3,
                backgroundColor: getBg(colorScheme, 'white', theme.colors.dark[7]),
              },
              stepCompletedIcon: {
                color: '#40c057',
              },
              stepCompleted: {
                borderColor: '#40c057',
                backgroundColor: getBg(colorScheme, 'white', theme.colors.dark[7]),
              },
            }}
            color={PRIMARY_COLOR}
          >
            {steps.map((step, index) => (
              <Stepper.Step
                key={index}
                label={!isMobile ? step.label : undefined}
                icon={step.icon}
                color={index <= activeStep ? PRIMARY_COLOR : 'gray'}
                completedIcon={completedSteps[index] ? <IconCheck size={16} color="#40c057" /> : undefined}
                allowStepClick={completedSteps[index] || index <= activeStep}
              />
            ))}
          </Stepper>

          <form onSubmit={handleSubmit}>
            <Stack gap="xl">
              {/* Step 0 - Type Selection */}
              <Box style={{ display: activeStep === 0 ? 'block' : 'none' }}>
                <Card withBorder radius="lg" padding="xl" bg={getBg(colorScheme, '#f8fbff', theme.colors.dark[6])} style={{ borderLeft: `4px solid ${PRIMARY_COLOR}`, position: 'relative' }}>
                  {completedSteps[0] && (
                    <Tooltip label="Step completed" position="left" withArrow>
                      <Box style={{ position: 'absolute', top: 16, right: 16, background: '#40c057', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 2px 8px rgba(64,192,87,0.3)', zIndex: 10 }}>
                        <IconCheck size={18} />
                      </Box>
                    </Tooltip>
                  )}
                  <Flex align="center" gap="md" mb="lg">
                    <Box style={gradientIconBox}><IconInfoCircle size={24} /></Box>
                    <Box>
                      <Title order={4} style={{ color: PRIMARY_DARK }}>Select Report Type</Title>
                      <Text c="dimmed" size="sm">Choose the type of report you want to submit</Text>
                    </Box>
                  </Flex>
                  <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
                    {[
                      { type: 'Person', icon: <IconUserPlus size={28} />, label: 'Missing Person', desc: 'Report a missing individual' },
                      { type: 'Vehicle', icon: <IconCar size={28} />, label: 'Missing Vehicle', desc: 'Report a stolen/missing vehicle' },
                      { type: 'Special', icon: <IconAlertTriangle size={28} />, label: 'Special Case', desc: 'Report mentally ill / criminal persons' }
                    ].map(item => (
                      <Card
                        key={item.type}
                        withBorder
                        padding="xl"
                        radius="md"
                        bg={getBg(colorScheme, 'white', theme.colors.dark[7])}
                        style={{
                          cursor: 'pointer',
                          borderColor: regType === item.type ? PRIMARY_COLOR : getBg(colorScheme, '#f0f5ff', theme.colors.dark[5]),
                          borderWidth: regType === item.type ? 3 : 1,
                          background: regType === item.type ? `${PRIMARY_COLOR}08` : getBg(colorScheme, 'white', theme.colors.dark[7]),
                          position: 'relative',
                        }}
                        onClick={() => setRegType(item.type)}
                      >
                        {regType === item.type && (
                          <Box style={{ position: 'absolute', top: 10, right: 10, background: PRIMARY_COLOR, color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>
                            SELECTED
                          </Box>
                        )}
                        <Flex align="center" gap="md">
                          <Box
                            style={{
                              background: regType === item.type ? PRIMARY_GRADIENT : getBg(colorScheme, '#f0f5ff', theme.colors.dark[6]),
                              padding: '16px',
                              borderRadius: '12px',
                              color: regType === item.type ? 'white' : PRIMARY_COLOR,
                            }}
                          >
                            {item.icon}
                          </Box>
                          <Box>
                            <Text fw={700} size="lg" style={{ color: PRIMARY_DARK }}>{item.label}</Text>
                            <Text size="sm" c="dimmed" mt={4}>{item.desc}</Text>
                          </Box>
                        </Flex>
                        <Divider my="md" color={getBg(colorScheme, '#f0f5ff', theme.colors.dark[5])} />
                        <Text size="xs" c="dimmed">
                          {item.type === 'Person' && '• Personal details\n• Physical description\n• Last known location'}
                          {item.type === 'Vehicle' && '• Vehicle details\n• License plate\n• Last known location'}
                          {item.type === 'Special' && '• Person details\n• Special category (mentally ill/criminal)\n• Required documentation\n• Last known location'}
                        </Text>
                      </Card>
                    ))}
                  </SimpleGrid>
                </Card>
              </Box>

              {/* Step 1 - Details (dynamically rendered) */}
              {activeStep === 1 && regType === 'Person' && (
                <PersonDetailsStep
                  formValues={formValues}
                  handleInputChange={handleInputChange}
                  imagePreview={imagePreview}
                  setImagePreview={setImagePreview}
                  handleImageUpload={handleImageUpload}
                  completed={completedSteps[1]}
                  colorScheme={colorScheme}
                  theme={theme}
                  PRIMARY_COLOR={PRIMARY_COLOR}
                  PRIMARY_GRADIENT={PRIMARY_GRADIENT}
                  PRIMARY_LIGHT={PRIMARY_LIGHT}
                  PRIMARY_DARK={PRIMARY_DARK}
                  getBg={getBg}
                  gradientIconBox={gradientIconBox}
                />
              )}

              {activeStep === 1 && regType === 'Vehicle' && (
                <VehicleDetailsStep
                  formValues={formValues}
                  handleInputChange={handleInputChange}
                  selectedBrand={selectedBrand}
                  setSelectedBrand={setSelectedBrand}
                  selectedModel={selectedModel}
                  setSelectedModel={setSelectedModel}
                  selectedSubmodel={selectedSubmodel}
                  setSelectedSubmodel={setSelectedSubmodel}
                  brands={brands}
                  models={models}
                  submodels={submodels}
                  ownershipDoc={ownershipDoc}
                  setOwnershipDoc={handleOwnershipDocChange}
                  ownershipDocError={ownershipDocError}
                  completed={completedSteps[1]}
                  colorScheme={colorScheme}
                  theme={theme}
                  PRIMARY_COLOR={PRIMARY_COLOR}
                  PRIMARY_GRADIENT={PRIMARY_GRADIENT}
                  PRIMARY_LIGHT={PRIMARY_LIGHT}
                  PRIMARY_DARK={PRIMARY_DARK}
                  getBg={getBg}
                  gradientIconBox={gradientIconBox}
                />
              )}

              {activeStep === 1 && regType === 'Special' && (
                <SpecialCaseDetailsStep
                  formValues={formValues}
                  handleInputChange={handleInputChange}
                  specialCategory={specialCategory}
                  setSpecialCategory={setSpecialCategory}
                  doctorReport={doctorReport}
                  setDoctorReport={setDoctorReport}
                  criminalRecord={criminalRecord}
                  setCriminalRecord={setCriminalRecord}
                  imagePreview={imagePreview}
                  setImagePreview={setImagePreview}
                  handleImageUpload={handleImageUpload}
                  completed={completedSteps[1]}
                  colorScheme={colorScheme}
                  theme={theme}
                  PRIMARY_COLOR={PRIMARY_COLOR}
                  PRIMARY_GRADIENT={PRIMARY_GRADIENT}
                  PRIMARY_LIGHT={PRIMARY_LIGHT}
                  PRIMARY_DARK={PRIMARY_DARK}
                  getBg={getBg}
                  gradientIconBox={gradientIconBox}
                />
              )}

              {/* Step 2 - Last Seen */}
              {activeStep === 2 && (
                <LastSeenStep
                  formValues={formValues}
                  handleInputChange={handleInputChange}
                  mapCenter={mapCenter}
                  setMapCenter={setMapCenter}
                  regType={regType}
                  completed={completedSteps[2]}
                  colorScheme={colorScheme}
                  theme={theme}
                  PRIMARY_COLOR={PRIMARY_COLOR}
                  PRIMARY_GRADIENT={PRIMARY_GRADIENT}
                  PRIMARY_LIGHT={PRIMARY_LIGHT}
                  PRIMARY_DARK={PRIMARY_DARK}
                  getBg={getBg}
                  gradientIconBox={gradientIconBox}
                  LocationPicker={LocationPicker}
                />
              )}

              {/* Step 3 - Contact Info */}
              {activeStep === 3 && (
                <ContactInfoStep
                  formValues={formValues}
                  handleInputChange={handleInputChange}
                  currentUser={currentUser}
                  completed={completedSteps[3]}
                  colorScheme={colorScheme}
                  theme={theme}
                  PRIMARY_COLOR={PRIMARY_COLOR}
                  PRIMARY_GRADIENT={PRIMARY_GRADIENT}
                  PRIMARY_LIGHT={PRIMARY_LIGHT}
                  PRIMARY_DARK={PRIMARY_DARK}
                  getBg={getBg}
                  gradientIconBox={gradientIconBox}
                />
              )}

              {/* Step 4 - Review */}
              {activeStep === 4 && (
                <ReviewSubmitStep
                  regType={regType}
                  formValues={formValues}
                  currentUser={currentUser}
                  isSubmitting={isSubmitting}
                  completed={completedSteps[4]}
                  colorScheme={colorScheme}
                  theme={theme}
                  PRIMARY_COLOR={PRIMARY_COLOR}
                  PRIMARY_GRADIENT={PRIMARY_GRADIENT}
                  PRIMARY_LIGHT={PRIMARY_LIGHT}
                  PRIMARY_DARK={PRIMARY_DARK}
                  getBg={getBg}
                  gradientIconBox={gradientIconBox}
                />
              )}

              {/* Navigation Buttons */}
              <Flex justify="space-between" mt="xl" gap="md" wrap="wrap">
                <Button
                  variant="light"
                  color="gray"
                  size="md"
                  radius="xl"
                  leftSection={<IconChevronLeft size={18} />}
                  onClick={() => setActiveStep(prev => Math.max(0, prev - 1))}
                  disabled={activeStep === 0 || isSubmitting}
                  style={{ padding: '12px 24px', border: `1px solid ${getBg(colorScheme, '#f0f5ff', theme.colors.dark[5])}`, fontWeight: 600 }}
                >
                  Previous Step
                </Button>
                <Flex gap="md" style={{ flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                  <Button
                    variant="outline"
                    color="gray"
                    size="md"
                    radius="xl"
                    leftSection={<IconRefresh size={16} />}
                    onClick={resetForm}
                    disabled={isSubmitting}
                    style={{ padding: '12px 24px', borderColor: getBg(colorScheme, '#f0f5ff', theme.colors.dark[5]), fontWeight: 600 }}
                  >
                    Reset Form
                  </Button>
                  {activeStep < steps.length - 1 && (
                    <Button
                      size="md"
                      radius="xl"
                      rightSection={<IconChevronRight size={18} />}
                      onClick={handleContinue}
                      disabled={isSubmitting}
                      style={{ padding: '12px 30px', background: PRIMARY_GRADIENT, border: 'none', fontWeight: 700 }}
                    >
                      Continue to {steps[activeStep + 1]?.label}
                    </Button>
                  )}
                </Flex>
              </Flex>

              <Divider my="md" color={getBg(colorScheme, '#f0f5ff', theme.colors.dark[5])} />
              <Text size="xs" c="dimmed" ta="center">
                <IconInfoCircle size={12} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                Need assistance? Contact support@findr.com | Your data is protected with 256-bit SSL encryption<br />
                <Text span size="xs" c={PRIMARY_COLOR} fw={600}>Report ID will be generated upon successful submission</Text>
              </Text>
            </Stack>
          </form>
        </Paper>
      </Container>

      {/* Contact Information Modal */}
      <Modal
        opened={showContactModal}
        onClose={() => setShowContactModal(false)}
        title={
          <Flex align="center" gap="sm">
            <IconShieldCheck size={20} color={PRIMARY_COLOR} />
            <Text style={{ color: PRIMARY_DARK, fontWeight: 700 }}>Your Contact & Security Settings</Text>
          </Flex>
        }
        size="md"
        radius="lg"
        centered
        styles={{
          header: { borderBottom: `2px solid ${getBg(colorScheme, '#f0f5ff', theme.colors.dark[5])}` },
          content: { border: `2px solid ${PRIMARY_COLOR}`, backgroundColor: getBg(colorScheme, 'white', theme.colors.dark[7]) },
        }}
      >
        <Stack gap="md">
          <Flex align="center" gap="md">
            <Avatar size="lg" radius="xl" src={currentUser?.avatar} style={{ background: PRIMARY_GRADIENT, border: `3px solid ${getBg(colorScheme, '#f0f5ff', theme.colors.dark[5])}` }}>
              {currentUser?.firstName?.[0]}{currentUser?.lastName?.[0]}
            </Avatar>
            <Box>
              <Text fw={700} size="lg" style={{ color: PRIMARY_DARK }}>{currentUser?.firstName} {currentUser?.lastName}</Text>
              <Text size="sm" c="dimmed">{currentUser?.role || 'Registered User'}</Text>
            </Box>
          </Flex>
          <Divider color={getBg(colorScheme, '#f0f5ff', theme.colors.dark[5])} />
          <SimpleGrid cols={2} spacing="md">
            <Box>
              <Text size="xs" c="dimmed" fw={600}>Email Address</Text>
              <Text fw={600} size="sm" style={{ color: PRIMARY_DARK }}>{currentUser?.email}</Text>
            </Box>
            <Box>
              <Text size="xs" c="dimmed" fw={600}>Phone Number</Text>
              <Text fw={600} size="sm" style={{ color: PRIMARY_DARK }}>{currentUser?.phone}</Text>
            </Box>
            <Box>
              <Text size="xs" c="dimmed" fw={600}>Total Reports</Text>
              <Badge color="blue" variant="light" size="sm" style={{ background: `${PRIMARY_COLOR}15`, color: PRIMARY_COLOR, fontWeight: 700 }}>
                {currentUser?.registrations || 0} submitted
              </Badge>
            </Box>
            <Box>
              <Text size="xs" c="dimmed" fw={600}>Account Status</Text>
              <Badge color={currentUser?.isActive ? 'green' : 'red'} variant="light" size="sm" style={{ fontWeight: 700 }}>
                {currentUser?.isActive ? '✓ Active' : '✗ Inactive'}
              </Badge>
            </Box>
          </SimpleGrid>
          <Alert icon={<IconLock size={16} color={PRIMARY_COLOR} />} title="Security Status" color="blue" variant="light" radius="md" style={{ borderColor: PRIMARY_LIGHT, backgroundColor: getBg(colorScheme, `${PRIMARY_COLOR}08`, theme.colors.dark[6]) }}>
            <Text size="xs">
              Your account is protected with:<br />
              • Two-factor authentication available<br />
              • End-to-end encrypted communications<br />
              • Regular security audits
            </Text>
          </Alert>
          <Button variant="light" color="blue" fullWidth mt="md" onClick={() => router.push('/profile')} rightSection={<IconExternalLink size={16} />} style={{ background: getBg(colorScheme, `${PRIMARY_COLOR}10`, theme.colors.dark[6]), border: `1px solid ${PRIMARY_COLOR}30`, fontWeight: 600 }}>
            Update Profile & Settings
          </Button>
        </Stack>
      </Modal>

      <MainFooter />
    </Box>
  );
}