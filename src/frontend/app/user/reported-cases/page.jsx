/* eslint-disable react/jsx-no-undef */
'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Title,
  Text,
  Paper,
  Table,
  Group,
  Button,
  Badge,
  Flex,
  Avatar,
  Select,
  TextInput,
  Card,
  SimpleGrid,
  Stack,
  Divider,
  ActionIcon,
  Menu,
  Modal,
  Tabs,
  Loader,
  Alert,
  Pagination,
  NumberInput,
  Chip,
  Grid,
  SegmentedControl,
  Progress,
  useMantineTheme,
  Tooltip,
  Image as MantineImage,
  CopyButton,
  Textarea,
  useMantineColorScheme,
  Skeleton
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconSearch,
  IconFilter,
  IconDownload,
  IconEye,
  IconEdit,
  IconTrash,
  IconRefresh,
  IconAlertCircle,
  IconCheck,
  IconX,
  IconClock,
  IconMapPin,
  IconCar,
  IconUser,
  IconPhone,
  IconMail,
  IconCalendar,
  IconSortAscending,
  IconSortDescending,
  IconChevronRight,
  IconCopy,
  IconChartBar,
  IconList,
  IconLayoutGrid,
  IconExternalLink,
  IconBell,
  IconMessageCircle,
  IconStar,
  IconSettings,
  IconPrinter,
  IconShare,
  IconLock,
  IconLockOpen,
  IconUserPlus,
  IconDeviceFloppy,
  IconUserCheck,
  IconCarCrash,
  IconMapPinPlus,
  IconInfoCircle
} from '@tabler/icons-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MainFooter from '../../components/MainFooter';
import { useMediaQuery } from '@mantine/hooks';

// API URLs
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';
const MY_MISSING_PERSONS_API = `${API_BASE_URL}/missing-persons/my-reports`;
const MY_MISSING_VEHICLES_API = `${API_BASE_URL}/missing-vehicles/my-reports`;
const MISSING_PERSONS_API = `${API_BASE_URL}/missing-persons`;
const MISSING_VEHICLES_API = `${API_BASE_URL}/missing-vehicles`;

// Primary Colors
const PRIMARY_COLOR = '#0034D1';
const PRIMARY_LIGHT = '#4d79ff';
const PRIMARY_DARK = '#0029a8';
const PRIMARY_GRADIENT = `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, #0066ff 100%)`;
const PRIMARY_GRADIENT_HOVER = `linear-gradient(135deg, ${PRIMARY_DARK} 0%, #0052d4 100%)`;

// Helper for dynamic backgrounds
const getBg = (colorScheme, light, dark) => (colorScheme === 'dark' ? dark : light);

const normalizeStatus = (status) => (status || 'active').toString().toLowerCase();
const toBackendStatus = (status) => {
  const normalized = normalizeStatus(status);
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  const baseUrl = API_BASE_URL.replace('/api/v1', '');
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

// Status options
const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status', color: 'gray' },
  { value: 'active', label: 'Active', color: 'blue' },
  { value: 'investigation', label: 'Investigation', color: 'orange' },
  { value: 'resolved', label: 'Resolved', color: 'green' },
  { value: 'closed', label: 'Closed', color: 'red' },
  { value: 'pending', label: 'Pending', color: 'yellow' }
];

// Type options
const TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'Person', label: 'Missing Person' },
  { value: 'Vehicle', label: 'Missing Vehicle' }
];

// Priority options
const PRIORITY_OPTIONS = [
  { value: 'all', label: 'All Priorities' },
  { value: 'high', label: 'High Priority', color: 'red' },
  { value: 'medium', label: 'Medium Priority', color: 'yellow' },
  { value: 'low', label: 'Low Priority', color: 'green' }
];

// Notification helper
const showNotification = (title, message, type = 'info', icon = null) => {
  let color = 'blue';
  let defaultIcon = <IconCheck size={16} />;
  
  switch (type) {
    case 'success':
      color = 'green';
      defaultIcon = <IconCheck size={16} />;
      break;
    case 'error':
      color = 'red';
      defaultIcon = <IconX size={16} />;
      break;
    case 'warning':
      color = 'yellow';
      defaultIcon = <IconAlertCircle size={16} />;
      break;
    case 'info':
    default:
      color = 'blue';
      defaultIcon = <IconInfoCircle size={16} />;
  }
  
  notifications.show({
    title,
    message,
    color,
    icon: icon || defaultIcon,
    position: 'top-right',
    autoClose: 3000,
    withBorder: true,
    radius: 'md',
  });
};

export default function ReportedCasesPage() {
  const router = useRouter();
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);
  
  // State
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState([]);
  const [filteredCases, setFilteredCases] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  
  // Modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [caseToView, setCaseToView] = useState(null);
  const [caseToEdit, setCaseToEdit] = useState(null);
  const [caseToAlert, setCaseToAlert] = useState(null);
  const [alertMessage, setAlertMessage] = useState('');
  const [editForm, setEditForm] = useState({});
  
  // Async action states
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sendingAlert, setSendingAlert] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    resolved: 0,
    pending: 0,
    persons: 0,
    vehicles: 0
  });

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    status: 'all',
    priority: 'all',
    startDate: '',
    endDate: ''
  });

  // Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // Sort
  const [sortBy, setSortBy] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');

  const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken') || localStorage.getItem('token');
  };

  const getAuthHeaders = (includeJson = false) => {
    const token = getAuthToken();
    const headers = {};
    if (includeJson) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  };

  // Placeholder for future backend audit logging integration.
  const createActionLog = async () => {};

  const formatUserInfo = (user) => {
    if (!user) return 'Unknown';
    
    if (typeof user === 'object') {
      const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      if (name) return name;
      if (user.email) return user.email;
      if (user.userId) return user.userId;
      return 'Unknown';
    }
    
    return user;
  };

  // Helper to safely extract data array from response
  const extractDataArray = (responseData) => {
    if (Array.isArray(responseData)) return responseData;
    if (responseData && Array.isArray(responseData.data)) return responseData.data;
    return [];
  };

  // Fetch cases
  const fetchData = async (showLoadingNotification = false) => {
    try {
      if (showLoadingNotification) setRefreshing(true);
      
      const userData = localStorage.getItem('currentUser');
      if (!userData) {
        router.push('/authentication/login');
        return;
      }
      const user = JSON.parse(userData);
      setCurrentUser(user);

      const requestHeaders = getAuthHeaders();
      
      const [personsResponse, vehiclesResponse] = await Promise.all([
        fetch(MY_MISSING_PERSONS_API, { headers: requestHeaders, cache: 'no-store' }),
        fetch(MY_MISSING_VEHICLES_API, { headers: requestHeaders, cache: 'no-store' })
      ]);

      if (!personsResponse.ok || !vehiclesResponse.ok) {
        if (personsResponse.status === 401 || vehiclesResponse.status === 401) {
          router.push('/authentication/login');
          return;
        }
        throw new Error('Failed to fetch your reported cases');
      }

      const personsResult = await personsResponse.json();
      const vehiclesResult = await vehiclesResponse.json();
      
      const personsData = extractDataArray(personsResult);
      const vehiclesData = extractDataArray(vehiclesResult);

      const allCases = [
        ...personsData.map(item => ({
          id: item._id || item.id,
          caseId: item.caseId || `PERSON-${item._id || item.id}`,
          type: 'Person',
          displayName: `${item.firstName || ''} ${item.lastName || ''}`.trim(),
          firstName: item.firstName,
          lastName: item.lastName,
          age: item.age,
          gender: item.gender,
          height: item.height,
          weight: item.weight,
          description: item.description,
          location: item.location,
          lastSeen: item.lastSeen,
          lastSeenDate: item.lastSeenDate,
          lastSeenTime: item.lastSeenTime,
          contactName: item.contactName,
          contactPhone: item.contactPhone,
          contactEmail: item.contactEmail,
          telegramUsername: item.telegramUsername,
          status: normalizeStatus(item.status),
          priority: item.priority || 'medium',
          reportDate: item.reportDate || new Date().toISOString(),
          lastUpdated: item.lastUpdated || item.reportDate || new Date().toISOString(),
          reportedBy: item.reportedBy,
          icon: <IconUser size={16} />,
          category: 'person',
          image: item.images?.[0] ? getImageUrl(item.images[0]) : null
        })),
        ...vehiclesData.map(item => ({
          id: item._id || item.id,
          caseId: item.caseId || `VEHICLE-${item._id || item.id}`,
          type: 'Vehicle',
          displayName: `${item.brand || ''} ${item.model || ''}`.trim(),
          brand: item.brand,
          model: item.model,
          submodel: item.submodel,
          color: item.color,
          plateType: item.plateType,
          region: item.region,
          code: item.code,
          plateNumber: item.plateNumber,
          vehicleDescription: item.vehicleDescription,
          location: item.location,
          lastSeen: item.lastSeen,
          lastSeenDate: item.lastSeenDate,
          lastSeenTime: item.lastSeenTime,
          contactName: item.contactName,
          contactPhone: item.contactPhone,
          contactEmail: item.contactEmail,
          telegramUsername: item.telegramUsername,
          status: normalizeStatus(item.status),
          priority: item.priority || 'medium',
          reportDate: item.reportDate || new Date().toISOString(),
          lastUpdated: item.lastUpdated || item.reportDate || new Date().toISOString(),
          reportedBy: item.reportedBy,
          icon: <IconCar size={16} />,
          category: 'vehicle',
          image: item.imagePreview ? getImageUrl(item.imagePreview) : null
        }))
      ];

      setCases(allCases);
      setFilteredCases(allCases);
      
      const statsData = {
        total: allCases.length,
        active: allCases.filter(c => c.status === 'active').length,
        resolved: allCases.filter(c => c.status === 'resolved').length,
        pending: allCases.filter(c => c.status === 'pending').length,
        persons: allCases.filter(c => c.type === 'Person').length,
        vehicles: allCases.filter(c => c.type === 'Vehicle').length
      };
      setStats(statsData);
      
      if (showLoadingNotification) {
        showNotification(
          'Data Refreshed',
          `Successfully loaded ${allCases.length} cases`,
          'success'
        );
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      if (showLoadingNotification) {
        showNotification(
          'Error Loading Data',
          'Failed to load cases. Please try again.',
          'error'
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtering logic
  useEffect(() => {
    let result = [...cases];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(caseItem =>
        caseItem.displayName?.toLowerCase().includes(searchLower) ||
        caseItem.caseId?.toLowerCase().includes(searchLower) ||
        caseItem.location?.toLowerCase().includes(searchLower) ||
        caseItem.plateNumber?.toLowerCase().includes(searchLower) ||
        caseItem.firstName?.toLowerCase().includes(searchLower) ||
        caseItem.lastName?.toLowerCase().includes(searchLower) ||
        caseItem.brand?.toLowerCase().includes(searchLower) ||
        caseItem.model?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.type !== 'all') {
      result = result.filter(caseItem => caseItem.type === filters.type);
    }

    if (filters.status !== 'all') {
      result = result.filter(caseItem => caseItem.status === filters.status);
    }

    if (filters.priority !== 'all') {
      result = result.filter(caseItem => caseItem.priority === filters.priority);
    }

    if (filters.startDate || filters.endDate) {
      result = result.filter(caseItem => {
        const caseDate = new Date(caseItem.reportDate);
        
        if (filters.startDate && filters.endDate) {
          const startDate = new Date(filters.startDate);
          const endDate = new Date(filters.endDate);
          return caseDate >= startDate && caseDate <= endDate;
        } else if (filters.startDate) {
          const startDate = new Date(filters.startDate);
          return caseDate >= startDate;
        } else if (filters.endDate) {
          const endDate = new Date(filters.endDate);
          return caseDate <= endDate;
        }
        return true;
      });
    }

    result.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.reportDate);
          bValue = new Date(b.reportDate);
          break;
        case 'name':
          aValue = a.displayName?.toLowerCase();
          bValue = b.displayName?.toLowerCase();
          break;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority] || 0;
          bValue = priorityOrder[b.priority] || 0;
          break;
        default:
          aValue = a[sortBy];
          bValue = b[sortBy];
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredCases(result);
    setPage(1);
  }, [filters, cases, sortBy, sortDirection]);

  const totalPages = Math.ceil(filteredCases.length / itemsPerPage);
  const paginatedCases = filteredCases.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const getStatusColor = (status) => {
    const statusOption = STATUS_OPTIONS.find(s => s.value === status);
    return statusOption?.color || 'gray';
  };

  const getPriorityColor = (priority) => {
    const priorityOption = PRIORITY_OPTIONS.find(p => p.value === priority);
    return priorityOption?.color || 'gray';
  };

  // 🔹 DELETE with log
  const handleDeleteCase = async (caseId, type) => {
    setDeleting(true);
    try {
      const endpoint = type === 'Person' ? MISSING_PERSONS_API : MISSING_VEHICLES_API;
      const response = await fetch(`${endpoint}/${caseId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(true),
        body: JSON.stringify({
          status: 'Closed',
          lastUpdated: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setCases(prev => prev.map(c => (
          c.id === caseId ? { ...c, status: 'closed', lastUpdated: new Date().toISOString() } : c
        )));
        setDeleteModalOpen(false);
        setSelectedCase(null);
        
        showNotification(
          'Case Closed',
          'Case has been marked as closed.',
          'success'
        );
        createActionLog('case_delete', { caseId, reportType: type });
      } else {
        throw new Error('Failed to delete case');
      }
    } catch (error) {
      console.error('Error deleting case:', error);
      showNotification(
        'Deletion Failed',
        'Failed to delete case. Please try again.',
        'error'
      );
    } finally {
      setDeleting(false);
    }
  };

  // 🔹 EXPORT with log
  const handleExportData = () => {
    setExporting(true);
    try {
      const csvContent = [
        ['Case ID', 'Type', 'Name/Model', 'Status', 'Priority', 'Location', 'Report Date', 'Last Updated'],
        ...filteredCases.map(c => [
          c.caseId,
          c.type,
          c.displayName,
          c.status,
          c.priority,
          c.location,
          new Date(c.reportDate).toLocaleDateString(),
          new Date(c.lastUpdated).toLocaleDateString()
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reported-cases-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      
      showNotification(
        'Export Successful',
        `Exported ${filteredCases.length} cases to CSV file.`,
        'success'
      );
      createActionLog('data_export', { count: filteredCases.length });
    } catch (error) {
      console.error('Error exporting data:', error);
      showNotification(
        'Export Failed',
        'Failed to export data. Please try again.',
        'error'
      );
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      type: 'all',
      status: 'all',
      priority: 'all',
      startDate: '',
      endDate: ''
    });
    
    showNotification(
      'Filters Cleared',
      'All filters have been reset.',
      'info'
    );
  };

  // 🔹 VIEW with log
  const handleViewClick = (caseItem) => {
    setCaseToView(caseItem);
    setViewModalOpen(true);
    createActionLog('case_view', { caseId: caseItem.caseId, reportType: caseItem.type });
  };

  const handleEditClick = (caseItem) => {
    setCaseToEdit(caseItem);
    
    const formData = {
      type: caseItem.type,
      status: caseItem.status,
      priority: caseItem.priority,
      location: caseItem.location,
      description: caseItem.description || caseItem.vehicleDescription || '',
      lastSeenDate: caseItem.lastSeenDate || '',
      lastSeenTime: caseItem.lastSeenTime || '',
      contactName: caseItem.contactName || '',
      contactPhone: caseItem.contactPhone || '',
      contactEmail: caseItem.contactEmail || '',
      telegramUsername: caseItem.telegramUsername || '',
      firstName: caseItem.firstName || '',
      lastName: caseItem.lastName || '',
      age: caseItem.age || '',
      gender: caseItem.gender || '',
      height: caseItem.height || '',
      weight: caseItem.weight || '',
      brand: caseItem.brand || '',
      model: caseItem.model || '',
      submodel: caseItem.submodel || '',
      color: caseItem.color || '',
      plateType: caseItem.plateType || '',
      region: caseItem.region || '',
      code: caseItem.code || '',
      plateNumber: caseItem.plateNumber || '',
      vehicleDescription: caseItem.vehicleDescription || '',
    };
    
    setEditForm(formData);
    setEditModalOpen(true);
  };

  const handleAlertClick = (caseItem) => {
    setCaseToAlert(caseItem);
    setAlertMessage('');
    setAlertModalOpen(true);
  };

  // 🔹 ALERT with log
  const handleSendAlert = async () => {
    if (!alertMessage.trim()) {
      showNotification('Alert Message Required', 'Please enter an alert message.', 'warning');
      return;
    }
    setSendingAlert(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      showNotification(
        'Alert Sent',
        `Alert sent for ${caseToAlert?.displayName}`,
        'warning'
      );
      setAlertModalOpen(false);
      createActionLog('case_alert', { caseId: caseToAlert?.caseId, reportType: caseToAlert?.type, messageLength: alertMessage.length });
    } catch (error) {
      showNotification('Alert Failed', 'Could not send alert.', 'error');
    } finally {
      setSendingAlert(false);
    }
  };

  // 🔹 SHARE with log
  const handleShare = (caseItem) => {
    const shareData = {
      title: `Missing ${caseItem.type} - ${caseItem.displayName}`,
      text: `Case ID: ${caseItem.caseId}. Last seen: ${caseItem.location || 'Unknown location'} on ${caseItem.lastSeenDate || 'Unknown date'}.`,
      url: window.location.href,
    };
    if (navigator.share) {
      navigator.share(shareData).catch(() => {
        navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}`);
        showNotification('Share', 'Case info copied to clipboard', 'info');
      });
    } else {
      navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}`);
      showNotification('Share', 'Case info copied to clipboard', 'info');
    }
    createActionLog('case_share', { caseId: caseItem.caseId, reportType: caseItem.type });
  };

  // 🔹 EDIT SAVE with log
  const handleSaveEdit = async () => {
    if (!isEditFormValid()) {
      showNotification('Validation Error', 'Please fill all required fields.', 'warning');
      return;
    }
    setSaving(true);
    try {
      const endpoint = caseToEdit.type === 'Person' 
        ? `${MISSING_PERSONS_API}/${caseToEdit.id}`
        : `${MISSING_VEHICLES_API}/${caseToEdit.id}`;
      
      const updateData = {
        ...editForm,
        lastUpdated: new Date().toISOString(),
      };
      delete updateData.type;
      
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: getAuthHeaders(true),
        body: JSON.stringify({
          ...updateData,
          status: updateData.status ? toBackendStatus(updateData.status) : undefined,
        }),
      });
      
      if (response.ok) {
        setCases(prev => prev.map(c => 
          c.id === caseToEdit.id 
            ? { 
                ...c, 
                ...updateData, 
                displayName: caseToEdit.type === 'Person' 
                  ? `${updateData.firstName} ${updateData.lastName}` 
                  : `${updateData.brand} ${updateData.model}`,
                lastUpdated: new Date().toISOString()
              }
            : c
        ));
        
        setEditModalOpen(false);
        setCaseToEdit(null);
        
        showNotification('Case Updated', 'Case has been successfully updated.', 'success');
        createActionLog('case_edit', { caseId: caseToEdit.caseId, reportType: caseToEdit.type });
      } else {
        throw new Error('Failed to update case');
      }
    } catch (error) {
      console.error('Error updating case:', error);
      showNotification('Update Failed', 'Failed to update case. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEditFormChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const isEditFormValid = () => {
    if (!caseToEdit) return false;
    if (caseToEdit.type === 'Person') {
      return editForm.firstName?.trim() && editForm.lastName?.trim();
    } else {
      return editForm.brand?.trim() && editForm.model?.trim() && editForm.plateNumber?.trim();
    }
  };

  // Loading state
  if (loading) {
    return (
      <Box style={{ 
        minHeight: '100vh',
        background: isMobile 
          ? getBg(colorScheme, '#f0f5ff', theme.colors.dark[7])
          : colorScheme === 'dark'
            ? `radial-gradient(circle at 10% 20%, rgba(0, 52, 209, 0.3) 0%, ${theme.colors.dark[7]} 100%)`
            : `radial-gradient(circle at 10% 20%, rgba(0, 52, 209, 0.05) 0%, #ffffff 100%)`,
      }}>
        <Container size="lg" py={40}>
          <Skeleton height={80} radius="md" mb={40} />
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
            {Array(6).fill(0).map((_, i) => (
              <Skeleton key={i} height={200} radius="lg" />
            ))}
          </SimpleGrid>
        </Container>
      </Box>
    );
  }

  return (
    <Box style={{ 
      minHeight: '100vh',
      background: isMobile 
        ? getBg(colorScheme, '#f0f5ff', theme.colors.dark[7])
        : colorScheme === 'dark'
          ? `radial-gradient(circle at 10% 20%, rgba(0, 52, 209, 0.3) 0%, ${theme.colors.dark[7]} 100%)`
          : `radial-gradient(circle at 10% 20%, rgba(0, 52, 209, 0.05) 0%, #ffffff 100%)`,
      position: 'relative'
    }}>
      {/* Header */}
      <Box
        style={{
          backgroundColor: getBg(colorScheme, 'white', theme.colors.dark[7]),
          borderBottom: `2px solid ${getBg(colorScheme, '#f0f5ff', theme.colors.dark[5])}`,
          boxShadow: `0 2px 15px rgba(0, 52, 209, 0.1)`,
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <Container size="lg">
          <Flex 
            justify="space-between" 
            align="center" 
            py="sm"
            direction={isMobile ? 'column' : 'row'}
            gap={isMobile ? 'md' : 'xs'}
          >
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              <Flex align="center" gap="md">
                <Box style={{ display: 'inline-block', height: '40px', width: 'auto', overflow: 'hidden' }}>
                  <Image src="/logo.jpg" alt="Logo" width={2040} height={952} style={{ height: '100%', width: 'auto' }} />
                </Box>
                <Box>
                  <Text size={isMobile ? "lg" : "xl"} fw={900} style={{ color: PRIMARY_COLOR, letterSpacing: '-0.5px' }}>
                    FindR
                  </Text>
                  <Text size="xs" c={PRIMARY_DARK} fw={600} style={{ letterSpacing: '1px' }}>
                    Reported Cases Dashboard
                  </Text>
                </Box>
              </Flex>
            </Link>

            <Flex align="center" gap="lg">
              <Button
                variant="light"
                color="blue"
                leftSection={<IconChevronRight size={16} />}
                component={Link}
                href="/"
                size="sm"
              >
                Back to Dashboard
              </Button>
              
              {currentUser && (
                <Flex 
                  align="center" 
                  gap="sm" 
                  style={{ 
                    padding: '8px 16px',
                    background: getBg(colorScheme, '#f0f5ff', theme.colors.dark[6]),
                    borderRadius: '30px',
                  }}
                >
                  <Avatar
                    size="sm"
                    radius="xl"
                    src={currentUser?.avatar}
                    style={{ 
                      background: PRIMARY_GRADIENT,
                      border: `2px solid ${getBg(colorScheme, 'white', theme.colors.dark[7])}`,
                    }}
                  >
                    {currentUser?.firstName?.[0]}{currentUser?.lastName?.[0]}
                  </Avatar>
                  <Box>
                    <Text size="sm" fw={600} style={{ color: PRIMARY_DARK }}>
                      {currentUser?.firstName} {currentUser?.lastName}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {currentUser?.role}
                    </Text>
                  </Box>
                </Flex>
              )}
            </Flex>
          </Flex>
        </Container>
      </Box>

      {/* Main Content */}
      <Container size="lg" py={isMobile ? 20 : 40}>
        {/* Page Header */}
        <Box mb={40}>
          <Flex justify="space-between" align="center" mb="md" wrap="wrap" gap="md">
            <Box>
              <Title order={1} style={{ color: PRIMARY_DARK, fontWeight: 800 }}>
                My Reported Cases
              </Title>
              <Text c="dimmed" size="sm">
                Track and manage all your reported missing persons and vehicles
              </Text>
            </Box>
            <Button
              color="blue"
              leftSection={<IconRefresh size={18} />}
              onClick={() => fetchData(true)}
              loading={refreshing}
              variant="light"
              size="sm"
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </Flex>

          {/* Stats Cards */}
          <SimpleGrid cols={{ base: 2, sm: 3, lg: 6 }} spacing="md" mb={40}>
            {[
              { label: 'Total Cases', value: stats.total, color: PRIMARY_COLOR, icon: <IconList size={20} color="white" />, gradient: PRIMARY_GRADIENT },
              { label: 'Resolved', value: stats.resolved, color: '#2f9e44', icon: <IconCheck size={20} color="white" />, gradient: 'linear-gradient(135deg, #2f9e44 0%, #37b24d 100%)' },
              { label: 'Active', value: stats.active, color: '#1971c2', icon: <IconAlertCircle size={20} color="white" />, gradient: 'linear-gradient(135deg, #1971c2 0%, #1c7ed6 100%)' },
              { label: 'Pending', value: stats.pending, color: '#e67700', icon: <IconClock size={20} color="white" />, gradient: 'linear-gradient(135deg, #e67700 0%, #f08c00 100%)' },
              { label: 'Persons', value: stats.persons, color: '#ae3ec9', icon: <IconUser size={20} color="white" />, gradient: 'linear-gradient(135deg, #ae3ec9 0%, #be4bdb 100%)' },
              { label: 'Vehicles', value: stats.vehicles, color: '#f59f00', icon: <IconCar size={20} color="white" />, gradient: 'linear-gradient(135deg, #f59f00 0%, #fab005 100%)' },
            ].map(stat => (
              <Card
                key={stat.label}
                padding="md"
                radius="lg"
                withBorder
                bg={getBg(colorScheme, 'white', theme.colors.dark[7])}
                style={{ borderTop: `4px solid ${stat.color}`, transition: 'transform 0.2s', ':hover': { transform: 'translateY(-2px)' } }}
              >
                <Flex align="center" gap="md">
                  <Box style={{ background: stat.gradient, padding: 8, borderRadius: 8 }}>
                    {stat.icon}
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed">{stat.label}</Text>
                    <Title order={2} style={{ color: stat.color }}>{stat.value}</Title>
                  </Box>
                </Flex>
              </Card>
            ))}
          </SimpleGrid>
        </Box>

        {/* Filters Section */}
        <Card
          padding="lg"
          radius="lg"
          withBorder
          mb={40}
          bg={getBg(colorScheme, '#f8fbff', theme.colors.dark[6])}
        >
          <Flex justify="space-between" align="center" mb="md" wrap="wrap" gap="md">
            <Title order={3} size="h4" style={{ color: PRIMARY_DARK }}>
              Filter & Search Cases
            </Title>
            <Group gap="sm">
              <SegmentedControl
                value={viewMode}
                onChange={(value) => {
                  setViewMode(value);
                  showNotification('View Mode Changed', `Switched to ${value} view`, 'info');
                }}
                data={[
                  { value: 'list', label: <IconList size={16} /> },
                  { value: 'grid', label: <IconLayoutGrid size={16} /> }
                ]}
                size="sm"
              />
              <Button
                variant="light"
                color="gray"
                size="sm"
                onClick={clearFilters}
                leftSection={<IconX size={14} />}
              >
                Clear Filters
              </Button>
            </Group>
          </Flex>

          <Grid gutter="md">
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <TextInput
                placeholder="Search cases..."
                leftSection={<IconSearch size={16} />}
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                radius="md"
                styles={{
                  input: {
                    backgroundColor: getBg(colorScheme, 'white', theme.colors.dark[6]),
                    color: getBg(colorScheme, 'black', theme.colors.gray[3]),
                    borderColor: getBg(colorScheme, '#e5e7eb', theme.colors.dark[5]),
                  }
                }}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 3, md: 2 }}>
              <Select
                placeholder="Type"
                data={TYPE_OPTIONS}
                value={filters.type}
                onChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
                radius="md"
                styles={{
                  input: {
                    backgroundColor: getBg(colorScheme, 'white', theme.colors.dark[6]),
                    color: getBg(colorScheme, 'black', theme.colors.gray[3]),
                    borderColor: getBg(colorScheme, '#e5e7eb', theme.colors.dark[5]),
                  },
                  dropdown: {
                    backgroundColor: getBg(colorScheme, 'white', theme.colors.dark[7]),
                    borderColor: getBg(colorScheme, '#e5e7eb', theme.colors.dark[5]),
                  },
                  item: {
                    color: getBg(colorScheme, 'black', theme.colors.gray[3]),
                    '&[data-hovered]': {
                      backgroundColor: getBg(colorScheme, '#f1f5f9', theme.colors.dark[5]),
                    },
                  },
                }}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 3, md: 2 }}>
              <Select
                placeholder="Status"
                data={STATUS_OPTIONS}
                value={filters.status}
                onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                radius="md"
                styles={{
                  input: {
                    backgroundColor: getBg(colorScheme, 'white', theme.colors.dark[6]),
                    color: getBg(colorScheme, 'black', theme.colors.gray[3]),
                    borderColor: getBg(colorScheme, '#e5e7eb', theme.colors.dark[5]),
                  },
                  dropdown: {
                    backgroundColor: getBg(colorScheme, 'white', theme.colors.dark[7]),
                    borderColor: getBg(colorScheme, '#e5e7eb', theme.colors.dark[5]),
                  },
                  item: {
                    color: getBg(colorScheme, 'black', theme.colors.gray[3]),
                    '&[data-hovered]': {
                      backgroundColor: getBg(colorScheme, '#f1f5f9', theme.colors.dark[5]),
                    },
                  },
                }}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 3, md: 2 }}>
              <Select
                placeholder="Priority"
                data={PRIORITY_OPTIONS}
                value={filters.priority}
                onChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}
                radius="md"
                styles={{
                  input: {
                    backgroundColor: getBg(colorScheme, 'white', theme.colors.dark[6]),
                    color: getBg(colorScheme, 'black', theme.colors.gray[3]),
                    borderColor: getBg(colorScheme, '#e5e7eb', theme.colors.dark[5]),
                  },
                  dropdown: {
                    backgroundColor: getBg(colorScheme, 'white', theme.colors.dark[7]),
                    borderColor: getBg(colorScheme, '#e5e7eb', theme.colors.dark[5]),
                  },
                  item: {
                    color: getBg(colorScheme, 'black', theme.colors.gray[3]),
                    '&[data-hovered]': {
                      backgroundColor: getBg(colorScheme, '#f1f5f9', theme.colors.dark[5]),
                    },
                  },
                }}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 3, md: 3 }}>
              <TextInput
                type="date"
                placeholder="Start date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                radius="md"
                leftSection={<IconCalendar size={16} />}
                styles={{
                  input: {
                    backgroundColor: getBg(colorScheme, 'white', theme.colors.dark[6]),
                    color: getBg(colorScheme, 'black', theme.colors.gray[3]),
                    borderColor: getBg(colorScheme, '#e5e7eb', theme.colors.dark[5]),
                  }
                }}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 3, md: 2 }}>
              <TextInput
                type="date"
                placeholder="End date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                radius="md"
                leftSection={<IconCalendar size={16} />}
                styles={{
                  input: {
                    backgroundColor: getBg(colorScheme, 'white', theme.colors.dark[6]),
                    color: getBg(colorScheme, 'black', theme.colors.gray[3]),
                    borderColor: getBg(colorScheme, '#e5e7eb', theme.colors.dark[5]),
                  }
                }}
              />
            </Grid.Col>
          </Grid>

          {/* Sort Options */}
          <Flex justify="space-between" align="center" mt="md" wrap="wrap" gap="sm">
            <Group gap="xs">
              <Text size="sm" c="dimmed">Sort by:</Text>
              <Chip.Group value={sortBy} onChange={setSortBy}>
                <Group gap="xs">
                  <Chip value="date" size="xs" radius="sm">Date</Chip>
                  <Chip value="name" size="xs" radius="sm">Name</Chip>
                  <Chip value="priority" size="xs" radius="sm">Priority</Chip>
                </Group>
              </Chip.Group>
              <ActionIcon
                variant="light"
                color="blue"
                size="sm"
                onClick={() => {
                  setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                  showNotification('Sort Direction Changed', `Sorting in ${sortDirection === 'asc' ? 'descending' : 'ascending'} order`, 'info');
                }}
              >
                {sortDirection === 'asc' ? <IconSortAscending size={16} /> : <IconSortDescending size={16} />}
              </ActionIcon>
            </Group>
            
            <Group gap="sm">
              <Text size="sm" c="dimmed">
                Showing {filteredCases.length} of {cases.length} cases
              </Text>
              <Button
                variant="light"
                color="blue"
                size="sm"
                leftSection={<IconDownload size={14} />}
                onClick={handleExportData}
                loading={exporting}
              >
                {exporting ? 'Exporting...' : 'Export'}
              </Button>
            </Group>
          </Flex>
        </Card>

        {/* Cases Display */}
        {viewMode === 'list' ? (
          <Paper
            radius="lg"
            withBorder
            bg={getBg(colorScheme, 'white', theme.colors.dark[7])}
            overflow="hidden"
          >
            <Table highlightOnHover verticalSpacing="md" horizontalSpacing="md">
              <Table.Thead style={{ background: getBg(colorScheme, '#f0f5ff', theme.colors.dark[6]) }}>
                <Table.Tr>
                  <Table.Th>Case ID</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Details</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Priority</Table.Th>
                  <Table.Th>Location</Table.Th>
                  <Table.Th>Date</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {paginatedCases.map((caseItem) => (
                  <Table.Tr key={caseItem.id}>
                    <Table.Td>
                      <Group gap="xs">
                        {caseItem.image ? (
                          <Avatar src={caseItem.image} alt={caseItem.displayName} size="sm" radius="xl" />
                        ) : (
                          caseItem.icon
                        )}
                        <Box>
                          <Text fw={600} size="sm">{caseItem.caseId}</Text>
                          <CopyButton value={caseItem.caseId}>
                            {({ copied, copy }) => (
                              <ActionIcon
                                size="xs"
                                variant="subtle"
                                onClick={() => {
                                  copy();
                                  showNotification('Copied!', 'Case ID copied to clipboard', 'success');
                                }}
                                style={{ marginTop: 2 }}
                              >
                                <IconCopy size={12} />
                              </ActionIcon>
                            )}
                          </CopyButton>
                        </Box>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={caseItem.type === 'Person' ? 'grape' : 'orange'}
                        variant="light"
                        size="sm"
                      >
                        {caseItem.type}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Box style={{ maxWidth: 200 }}>
                        <Text fw={600} size="sm" truncate>
                          {caseItem.displayName}
                        </Text>
                        {caseItem.type === 'Vehicle' && caseItem.plateNumber && (
                          <Text size="xs" c="dimmed" truncate>
                            Plate: {caseItem.plateNumber}
                          </Text>
                        )}
                        {caseItem.type === 'Person' && caseItem.age && (
                          <Text size="xs" c="dimmed">
                            Age: {caseItem.age}
                          </Text>
                        )}
                      </Box>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={getStatusColor(caseItem.status)}
                        variant="light"
                        size="sm"
                      >
                        {caseItem.status?.charAt(0).toUpperCase() + caseItem.status?.slice(1)}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={getPriorityColor(caseItem.priority)}
                        variant="light"
                        size="sm"
                      >
                        {caseItem.priority?.charAt(0).toUpperCase() + caseItem.priority?.slice(1)}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        <IconMapPin size={12} />
                        <Text size="sm" truncate style={{ maxWidth: 100 }}>
                          {caseItem.location || 'Not specified'}
                        </Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Box>
                        <Text size="xs" fw={600}>
                          {new Date(caseItem.reportDate).toLocaleDateString()}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {new Date(caseItem.reportDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </Box>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4} wrap="nowrap">
                        <Tooltip label="View Details" position="left">
                          <ActionIcon
                            variant="subtle"
                            color="blue"
                            size="sm"
                            onClick={() => handleViewClick(caseItem)}
                          >
                            <IconEye size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Edit" position="left">
                          <ActionIcon
                            variant="subtle"
                            color="green"
                            size="sm"
                            onClick={() => handleEditClick(caseItem)}
                          >
                            <IconEdit size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Send Alert" position="left">
                          <ActionIcon
                            variant="subtle"
                            color="orange"
                            size="sm"
                            onClick={() => handleAlertClick(caseItem)}
                          >
                            <IconBell size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Share" position="left">
                          <ActionIcon
                            variant="subtle"
                            color="blue"
                            size="sm"
                            onClick={() => handleShare(caseItem)}
                          >
                            <IconShare size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Delete" position="left">
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            size="sm"
                            onClick={() => {
                              setSelectedCase(caseItem);
                              setDeleteModalOpen(true);
                            }}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>

            {filteredCases.length === 0 && (
              <Box py={40} style={{ textAlign: 'center' }}>
                <IconAlertCircle size={48} color={PRIMARY_LIGHT} style={{ marginBottom: 16 }} />
                <Text size="lg" fw={600} style={{ color: PRIMARY_DARK }} mb={8}>
                  No cases found
                </Text>
                <Text c="dimmed" mb={20}>
                  You haven&apos;t reported any cases yet. Click below to report a new case.
                </Text>
                <Button
                  color="blue"
                  leftSection={<IconUserPlus size={16} />}
                  component={Link}
                  href="/user/register"
                >
                  Report New Case
                </Button>
              </Box>
            )}
          </Paper>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
            {paginatedCases.map((caseItem) => (
              <Card
                key={caseItem.id}
                padding="lg"
                radius="lg"
                withBorder
                bg={getBg(colorScheme, 'white', theme.colors.dark[7])}
                style={{
                  borderTop: `4px solid ${
                    caseItem.type === 'Person' ? '#ae3ec9' : '#f59f00'
                  }`,
                  transition: 'all 0.3s ease',
                  ':hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 12px 30px rgba(0, 52, 209, 0.15)`,
                  }
                }}
              >
                <Flex justify="space-between" align="start" mb="md">
                  <Group wrap="nowrap" align="start">
                    {caseItem.image ? (
                      <Avatar src={caseItem.image} alt={caseItem.displayName} size="lg" radius="md" />
                    ) : (
                      <Avatar size="lg" radius="md" color={caseItem.type === 'Person' ? 'grape' : 'orange'}>
                        {caseItem.icon}
                      </Avatar>
                    )}
                    <Box>
                      <Badge
                        color={caseItem.type === 'Person' ? 'grape' : 'orange'}
                        variant="light"
                        size="sm"
                        mb={4}
                      >
                        {caseItem.type}
                      </Badge>
                      <Text fw={700} size="lg" style={{ color: PRIMARY_DARK }}>
                        {caseItem.displayName}
                      </Text>
                      <Text size="sm" c="dimmed">
                        {caseItem.caseId}
                      </Text>
                    </Box>
                  </Group>
                  <Menu position="bottom-end">
                    <Menu.Target>
                      <ActionIcon variant="subtle" color="gray">
                        <IconSettings size={16} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown bg={getBg(colorScheme, 'white', theme.colors.dark[7])}>
                      <Menu.Item 
                        leftSection={<IconEye size={14} />}
                        onClick={() => handleViewClick(caseItem)}
                      >
                        View Details
                      </Menu.Item>
                      <Menu.Item 
                        leftSection={<IconEdit size={14} />}
                        onClick={() => handleEditClick(caseItem)}
                      >
                        Edit
                      </Menu.Item>
                      <Menu.Item 
                        leftSection={<IconBell size={14} />}
                        onClick={() => handleAlertClick(caseItem)}
                      >
                        Send Alert
                      </Menu.Item>
                      <Menu.Item 
                        leftSection={<IconShare size={14} />}
                        onClick={() => handleShare(caseItem)}
                      >
                        Share
                      </Menu.Item>
                      <Menu.Item 
                        leftSection={<IconTrash size={14} />} 
                        color="red"
                        onClick={() => {
                          setSelectedCase(caseItem);
                          setDeleteModalOpen(true);
                        }}
                      >
                        Delete
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Flex>

                <Stack gap="xs" mb="md">
                  <Flex justify="space-between">
                    <Text size="sm" c="dimmed">Status</Text>
                    <Badge
                      color={getStatusColor(caseItem.status)}
                      variant="light"
                      size="xs"
                    >
                      {caseItem.status || 'active'}
                    </Badge>
                  </Flex>
                  <Flex justify="space-between">
                    <Text size="sm" c="dimmed">Priority</Text>
                    <Badge
                      color={getPriorityColor(caseItem.priority)}
                      variant="light"
                      size="xs"
                    >
                      {caseItem.priority || 'medium'}
                    </Badge>
                  </Flex>
                  <Flex justify="space-between">
                    <Text size="sm" c="dimmed">Location</Text>
                    <Text size="sm" fw={500}>{caseItem.location || 'Not specified'}</Text>
                  </Flex>
                  <Flex justify="space-between">
                    <Text size="sm" c="dimmed">Reported</Text>
                    <Text size="sm" fw={500}>
                      {new Date(caseItem.reportDate).toLocaleDateString()}
                    </Text>
                  </Flex>
                </Stack>

                <Divider my="md" color={getBg(colorScheme, theme.colors.gray[2], theme.colors.dark[5])} />

                <Group justify="space-between">
                  <Button
                    variant="light"
                    color="blue"
                    size="sm"
                    leftSection={<IconEye size={14} />}
                    onClick={() => handleViewClick(caseItem)}
                  >
                    View
                  </Button>
                  <Group gap={4}>
                    <Tooltip label="Send Alert">
                      <ActionIcon 
                        variant="subtle" 
                        color="orange"
                        onClick={() => handleAlertClick(caseItem)}
                      >
                        <IconBell size={16} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Share">
                      <ActionIcon 
                        variant="subtle" 
                        color="blue"
                        onClick={() => handleShare(caseItem)}
                      >
                        <IconShare size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Group>
              </Card>
            ))}
          </SimpleGrid>
        )}

        {/* Pagination */}
        {filteredCases.length > 0 && (
          <Flex justify="center" mt={40}>
            <Pagination
              value={page}
              onChange={setPage}
              total={totalPages}
              radius="md"
              size={isMobile ? "sm" : "md"}
              withEdges
            />
          </Flex>
        )}

        {/* Quick Actions */}
        <Card
          padding="lg"
          radius="lg"
          withBorder
          mt={40}
          bg={getBg(colorScheme, '#f8fbff', theme.colors.dark[6])}
        >
          <Flex justify="space-between" align="center" wrap="wrap" gap="md">
            <Box>
              <Title order={4} style={{ color: PRIMARY_DARK }} mb={4}>
                Quick Actions
              </Title>
              <Text size="sm" c="dimmed">
                Manage your reported cases efficiently
              </Text>
            </Box>
            <Group gap="sm">
              <Button
                variant="light"
                color="blue"
                leftSection={<IconUserPlus size={16} />}
                component={Link}
                href="/user/register"
              >
                Report New Case
              </Button>
              <Button
                variant="light"
                color="green"
                leftSection={<IconPrinter size={16} />}
                onClick={() => {
                  window.print();
                  showNotification('Printing Report', 'Opening print dialog...', 'info');
                }}
              >
                Print Report
              </Button>
            </Group>
          </Flex>
        </Card>
      </Container>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title={
          <Flex align="center" gap="sm">
            <IconAlertCircle size={20} color="red" />
            <Text fw={700}>Confirm Deletion</Text>
          </Flex>
        }
        radius="lg"
        centered
        styles={{
          header: { backgroundColor: getBg(colorScheme, 'white', theme.colors.dark[7]) },
          body: { backgroundColor: getBg(colorScheme, 'white', theme.colors.dark[7]) },
          title: { color: getBg(colorScheme, 'black', theme.colors.gray[3]) },
        }}
      >
        <Stack>
          <Text>
            Are you sure you want to delete case{' '}
            <Text span fw={700} style={{ color: PRIMARY_DARK }}>
              {selectedCase?.caseId}
            </Text>
            ? This action cannot be undone.
          </Text>
          
          <Flex gap="sm" justify="flex-end" mt="md">
            <Button
              variant="light"
              color="gray"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              color="red"
              leftSection={<IconTrash size={16} />}
              onClick={() => handleDeleteCase(selectedCase?.id, selectedCase?.type)}
              loading={deleting}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete Case'}
            </Button>
          </Flex>
        </Stack>
      </Modal>

      {/* Alert Modal */}
      <Modal
        opened={alertModalOpen}
        onClose={() => setAlertModalOpen(false)}
        title={`Send Alert for ${caseToAlert?.displayName}`}
        radius="lg"
        centered
        size="md"
        styles={{
          header: { backgroundColor: getBg(colorScheme, 'white', theme.colors.dark[7]) },
          body: { backgroundColor: getBg(colorScheme, 'white', theme.colors.dark[7]) },
        }}
      >
        <Stack>
          <Textarea
            label="Alert Message"
            placeholder="Enter details about the alert..."
            value={alertMessage}
            onChange={(e) => setAlertMessage(e.target.value)}
            minRows={4}
            autosize
            required
          />
          <Flex gap="sm" justify="flex-end" mt="md">
            <Button variant="light" onClick={() => setAlertModalOpen(false)} disabled={sendingAlert}>
              Cancel
            </Button>
            <Button
              color="orange"
              onClick={handleSendAlert}
              loading={sendingAlert}
              disabled={!alertMessage.trim()}
            >
              {sendingAlert ? 'Sending...' : 'Send Alert'}
            </Button>
          </Flex>
        </Stack>
      </Modal>

      {/* View Case Modal - Full Content */}
      <Modal
        opened={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setCaseToView(null);
        }}
        title={
          <Flex align="center" gap="sm">
            <IconEye size={20} color={PRIMARY_COLOR} />
            <Text fw={700} style={{ color: PRIMARY_DARK }}>
              View Case: {caseToView?.caseId}
            </Text>
          </Flex>
        }
        radius="lg"
        size="xl"
        centered
        padding="lg"
        styles={{
          header: { backgroundColor: getBg(colorScheme, 'white', theme.colors.dark[7]) },
          body: { backgroundColor: getBg(colorScheme, 'white', theme.colors.dark[7]) },
          title: { color: getBg(colorScheme, 'black', theme.colors.gray[3]) },
        }}
      >
        {caseToView && (
          <Box>
            <Flex justify="space-between" align="center" mb="lg">
              <Badge
                color={caseToView.type === 'Person' ? 'grape' : 'orange'}
                variant="filled"
                size="lg"
                leftSection={caseToView.type === 'Person' ? <IconUser size={14} /> : <IconCar size={14} />}
              >
                {caseToView.type}
              </Badge>
              <Text size="sm" c="dimmed">
                Last updated: {new Date(caseToView.lastUpdated || caseToView.reportDate).toLocaleDateString()}
              </Text>
            </Flex>

            <Tabs defaultValue="basic" variant="outline" radius="md">
              <Tabs.List grow mb="md">
                <Tabs.Tab value="basic" leftSection={<IconInfoCircle size={14} />}>
                  Basic Info
                </Tabs.Tab>
                <Tabs.Tab 
                  value={caseToView.type === 'Person' ? 'person' : 'vehicle'} 
                  leftSection={caseToView.type === 'Person' ? <IconUserCheck size={14} /> : <IconCarCrash size={14} />}
                >
                  {caseToView.type === 'Person' ? 'Person Details' : 'Vehicle Details'}
                </Tabs.Tab>
                <Tabs.Tab value="location" leftSection={<IconMapPinPlus size={14} />}>
                  Location & Contact
                </Tabs.Tab>
              </Tabs.List>

              {/* Basic Info Tab */}
              <Tabs.Panel value="basic">
                <Stack gap="md">
                  <Grid gutter="md">
                    <Grid.Col span={6}>
                      <Box>
                        <Text size="sm" c="dimmed" mb={4}>Status</Text>
                        <Badge
                          color={getStatusColor(caseToView.status)}
                          variant="light"
                          size="sm"
                        >
                          {caseToView.status?.charAt(0).toUpperCase() + caseToView.status?.slice(1) || 'Active'}
                        </Badge>
                      </Box>
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Box>
                        <Text size="sm" c="dimmed" mb={4}>Priority</Text>
                        <Badge
                          color={getPriorityColor(caseToView.priority)}
                          variant="light"
                          size="sm"
                        >
                          {caseToView.priority?.charAt(0).toUpperCase() + caseToView.priority?.slice(1) || 'Medium'}
                        </Badge>
                      </Box>
                    </Grid.Col>
                  </Grid>
                  <Divider color={getBg(colorScheme, theme.colors.gray[2], theme.colors.dark[5])} />
                  <Box>
                    <Text size="sm" c="dimmed" mb={4}>Description</Text>
                    <Text size="sm" fw={500}>
                      {caseToView.description || caseToView.vehicleDescription || 'No description provided'}
                    </Text>
                  </Box>
                  <Box>
                    <Text size="sm" c="dimmed" mb={4}>Report Date</Text>
                    <Text size="sm" fw={500}>
                      {new Date(caseToView.reportDate).toLocaleString()}
                    </Text>
                  </Box>
                </Stack>
              </Tabs.Panel>

              {/* Person/Vehicle Details Tab */}
              <Tabs.Panel value={caseToView.type === 'Person' ? 'person' : 'vehicle'}>
                {caseToView.type === 'Person' ? (
                  <Stack gap="md">
                    <Grid gutter="md">
                      <Grid.Col span={6}>
                        <Box><Text size="sm" c="dimmed" mb={4}>First Name</Text><Text size="sm" fw={500}>{caseToView.firstName || 'N/A'}</Text></Box>
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <Box><Text size="sm" c="dimmed" mb={4}>Last Name</Text><Text size="sm" fw={500}>{caseToView.lastName || 'N/A'}</Text></Box>
                      </Grid.Col>
                    </Grid>
                    <Grid gutter="md">
                      <Grid.Col span={4}><Box><Text size="sm" c="dimmed" mb={4}>Age</Text><Text size="sm" fw={500}>{caseToView.age || 'N/A'}</Text></Box></Grid.Col>
                      <Grid.Col span={4}><Box><Text size="sm" c="dimmed" mb={4}>Gender</Text><Text size="sm" fw={500}>{caseToView.gender || 'N/A'}</Text></Box></Grid.Col>
                      <Grid.Col span={4}><Box><Text size="sm" c="dimmed" mb={4}>Height</Text><Text size="sm" fw={500}>{caseToView.height || 'N/A'}</Text></Box></Grid.Col>
                    </Grid>
                    <Box><Text size="sm" c="dimmed" mb={4}>Weight</Text><Text size="sm" fw={500}>{caseToView.weight || 'N/A'}</Text></Box>
                  </Stack>
                ) : (
                  <Stack gap="md">
                    <Grid gutter="md">
                      <Grid.Col span={6}><Box><Text size="sm" c="dimmed" mb={4}>Brand</Text><Text size="sm" fw={500}>{caseToView.brand || 'N/A'}</Text></Box></Grid.Col>
                      <Grid.Col span={6}><Box><Text size="sm" c="dimmed" mb={4}>Model</Text><Text size="sm" fw={500}>{caseToView.model || 'N/A'}</Text></Box></Grid.Col>
                    </Grid>
                    <Grid gutter="md">
                      <Grid.Col span={4}><Box><Text size="sm" c="dimmed" mb={4}>Color</Text><Text size="sm" fw={500}>{caseToView.color || 'N/A'}</Text></Box></Grid.Col>
                      <Grid.Col span={4}><Box><Text size="sm" c="dimmed" mb={4}>Submodel</Text><Text size="sm" fw={500}>{caseToView.submodel || 'N/A'}</Text></Box></Grid.Col>
                      <Grid.Col span={4}><Box><Text size="sm" c="dimmed" mb={4}>Plate Type</Text><Text size="sm" fw={500}>{caseToView.plateType || 'N/A'}</Text></Box></Grid.Col>
                    </Grid>
                    <Box><Text size="sm" c="dimmed" mb={4}>License Plate</Text><Text size="sm" fw={500}>{caseToView.plateNumber || 'N/A'}</Text></Box>
                    {caseToView.region && caseToView.code && (
                      <Box><Text size="sm" c="dimmed" mb={4}>Region & Code</Text><Text size="sm" fw={500}>{caseToView.region} - {caseToView.code}</Text></Box>
                    )}
                  </Stack>
                )}
              </Tabs.Panel>

              {/* Location & Contact Tab */}
              <Tabs.Panel value="location">
                <Stack gap="md">
                  <Box>
                    <Text size="sm" c="dimmed" mb={4}>Location</Text>
                    <Flex align="center" gap={4}>
                      <IconMapPin size={16} color={PRIMARY_COLOR} />
                      <Text size="sm" fw={500}>{caseToView.location || 'Not specified'}</Text>
                    </Flex>
                  </Box>
                  <Box><Text size="sm" c="dimmed" mb={4}>Last Seen Date</Text><Text size="sm" fw={500}>{caseToView.lastSeenDate || 'Not specified'}</Text></Box>
                  <Box><Text size="sm" c="dimmed" mb={4}>Last Seen Time</Text><Text size="sm" fw={500}>{caseToView.lastSeenTime || 'Not specified'}</Text></Box>
                  <Divider color={getBg(colorScheme, theme.colors.gray[2], theme.colors.dark[5])} />
                  <Box><Text size="sm" c="dimmed" mb={4}>Contact Name</Text><Text size="sm" fw={500}>{caseToView.contactName || 'N/A'}</Text></Box>
                  <Box><Text size="sm" c="dimmed" mb={4}>Contact Phone</Text><Text size="sm" fw={500}>{caseToView.contactPhone || 'N/A'}</Text></Box>
                  <Box><Text size="sm" c="dimmed" mb={4}>Contact Email</Text><Text size="sm" fw={500}>{caseToView.contactEmail || 'N/A'}</Text></Box>
                  {caseToView.telegramUsername && (
                    <Box><Text size="sm" c="dimmed" mb={4}>Telegram Username</Text><Text size="sm" fw={500}>@{caseToView.telegramUsername}</Text></Box>
                  )}
                </Stack>
              </Tabs.Panel>
            </Tabs>

            <Flex gap="sm" justify="flex-end" mt="lg">
              <Button
                variant="light"
                color="blue"
                onClick={() => {
                  setViewModalOpen(false);
                  handleEditClick(caseToView);
                }}
                leftSection={<IconEdit size={16} />}
              >
                Edit Case
              </Button>
              <Button
                variant="light"
                color="gray"
                onClick={() => setViewModalOpen(false)}
              >
                Close
              </Button>
            </Flex>

            <Paper
              withBorder
              p="md"
              mt="md"
              radius="md"
              style={{ background: getBg(colorScheme, '#f0f5ff', theme.colors.dark[6]) }}
            >
              <Flex gap="xs" align="center" mb="xs">
                <IconInfoCircle size={16} color={PRIMARY_COLOR} />
                <Text size="sm" fw={600}>Case Information</Text>
              </Flex>
              <Grid gutter="xs">
                <Grid.Col span={6}>
                  <Text size="xs" c="dimmed">Case ID</Text>
                  <Text size="sm" fw={500}>{caseToView.caseId}</Text>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Text size="xs" c="dimmed">Report Date</Text>
                  <Text size="sm" fw={500}>
                    {new Date(caseToView.reportDate).toLocaleDateString()}
                  </Text>
                </Grid.Col>
                <Grid.Col span={12}>
                  <Text size="xs" c="dimmed">Created By</Text>
                  <Text size="sm" fw={500}>
                    {formatUserInfo(caseToView.reportedBy)}
                  </Text>
                </Grid.Col>
              </Grid>
            </Paper>
          </Box>
        )}
      </Modal>

      {/* Edit Case Modal - Full Content */}
      <Modal
        opened={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setCaseToEdit(null);
        }}
        title={
          <Flex align="center" gap="sm">
            <IconEdit size={20} color={PRIMARY_COLOR} />
            <Text fw={700} style={{ color: PRIMARY_DARK }}>
              Edit Case: {caseToEdit?.caseId}
            </Text>
          </Flex>
        }
        radius="lg"
        size="xl"
        centered
        padding="lg"
        styles={{
          header: { backgroundColor: getBg(colorScheme, 'white', theme.colors.dark[7]) },
          body: { backgroundColor: getBg(colorScheme, 'white', theme.colors.dark[7]) },
          title: { color: getBg(colorScheme, 'black', theme.colors.gray[3]) },
        }}
      >
        {caseToEdit && (
          <Box>
            <Flex justify="space-between" align="center" mb="lg">
              <Badge
                color={caseToEdit.type === 'Person' ? 'grape' : 'orange'}
                variant="filled"
                size="lg"
                leftSection={caseToEdit.type === 'Person' ? <IconUser size={14} /> : <IconCar size={14} />}
              >
                {caseToEdit.type}
              </Badge>
              <Text size="sm" c="dimmed">
                Last updated: {new Date(caseToEdit.lastUpdated || caseToEdit.reportDate).toLocaleDateString()}
              </Text>
            </Flex>

            <Tabs defaultValue="basic" variant="outline" radius="md">
              <Tabs.List grow mb="md">
                <Tabs.Tab value="basic" leftSection={<IconInfoCircle size={14} />}>
                  Basic Info
                </Tabs.Tab>
                <Tabs.Tab 
                  value={caseToEdit.type === 'Person' ? 'person' : 'vehicle'} 
                  leftSection={caseToEdit.type === 'Person' ? <IconUserCheck size={14} /> : <IconCarCrash size={14} />}
                >
                  {caseToEdit.type === 'Person' ? 'Person Details' : 'Vehicle Details'}
                </Tabs.Tab>
                <Tabs.Tab value="location" leftSection={<IconMapPinPlus size={14} />}>
                  Location & Contact
                </Tabs.Tab>
              </Tabs.List>

              {/* Basic Info Tab (editable) */}
              <Tabs.Panel value="basic">
                <Stack gap="md">
                  <Grid gutter="md">
                    <Grid.Col span={6}>
                      <Select
                        label="Status"
                        value={editForm.status}
                        onChange={(value) => handleEditFormChange('status', value)}
                        data={[
                          { value: 'active', label: 'Active' },
                          { value: 'investigation', label: 'Under Investigation' },
                          { value: 'resolved', label: 'Resolved' },
                          { value: 'closed', label: 'Closed' },
                          { value: 'pending', label: 'Pending' }
                        ]}
                        required
                        radius="md"
                        styles={{
                          input: {
                            backgroundColor: getBg(colorScheme, 'white', theme.colors.dark[6]),
                            color: getBg(colorScheme, 'black', theme.colors.gray[3]),
                            borderColor: getBg(colorScheme, '#e5e7eb', theme.colors.dark[5]),
                          },
                          dropdown: {
                            backgroundColor: getBg(colorScheme, 'white', theme.colors.dark[7]),
                            borderColor: getBg(colorScheme, '#e5e7eb', theme.colors.dark[5]),
                          },
                          item: {
                            color: getBg(colorScheme, 'black', theme.colors.gray[3]),
                            '&[data-hovered]': {
                              backgroundColor: getBg(colorScheme, '#f1f5f9', theme.colors.dark[5]),
                            },
                          },
                        }}
                      />
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <Select
                        label="Priority"
                        value={editForm.priority}
                        onChange={(value) => handleEditFormChange('priority', value)}
                        data={[
                          { value: 'high', label: 'High Priority' },
                          { value: 'medium', label: 'Medium Priority' },
                          { value: 'low', label: 'Low Priority' }
                        ]}
                        required
                        radius="md"
                        styles={{
                          input: {
                            backgroundColor: getBg(colorScheme, 'white', theme.colors.dark[6]),
                            color: getBg(colorScheme, 'black', theme.colors.gray[3]),
                            borderColor: getBg(colorScheme, '#e5e7eb', theme.colors.dark[5]),
                          },
                          dropdown: {
                            backgroundColor: getBg(colorScheme, 'white', theme.colors.dark[7]),
                            borderColor: getBg(colorScheme, '#e5e7eb', theme.colors.dark[5]),
                          },
                          item: {
                            color: getBg(colorScheme, 'black', theme.colors.gray[3]),
                            '&[data-hovered]': {
                              backgroundColor: getBg(colorScheme, '#f1f5f9', theme.colors.dark[5]),
                            },
                          },
                        }}
                      />
                    </Grid.Col>
                  </Grid>

                  <Textarea
                    label="Description"
                    placeholder="Enter case description"
                    value={editForm.description || editForm.vehicleDescription || ''}
                    onChange={(e) => handleEditFormChange(caseToEdit.type === 'Person' ? 'description' : 'vehicleDescription', e.target.value)}
                    radius="md"
                    multiline
                    minRows={2}
                    styles={{
                      input: {
                        backgroundColor: getBg(colorScheme, 'white', theme.colors.dark[6]),
                        color: getBg(colorScheme, 'black', theme.colors.gray[3]),
                        borderColor: getBg(colorScheme, '#e5e7eb', theme.colors.dark[5]),
                      },
                      label: { color: getBg(colorScheme, 'black', theme.colors.gray[3]) },
                    }}
                  />
                </Stack>
              </Tabs.Panel>

              {/* Person/Vehicle Details Tab (editable) */}
              <Tabs.Panel value={caseToEdit.type === 'Person' ? 'person' : 'vehicle'}>
                {caseToEdit.type === 'Person' ? (
                  <Stack gap="md">
                    <Grid gutter="md">
                      <Grid.Col span={6}>
                        <TextInput
                          label="First Name"
                          value={editForm.firstName}
                          onChange={(e) => handleEditFormChange('firstName', e.target.value)}
                          radius="md"
                          required
                          styles={{
                            input: {
                              backgroundColor: getBg(colorScheme, 'white', theme.colors.dark[6]),
                              color: getBg(colorScheme, 'black', theme.colors.gray[3]),
                              borderColor: getBg(colorScheme, '#e5e7eb', theme.colors.dark[5]),
                            },
                            label: { color: getBg(colorScheme, 'black', theme.colors.gray[3]) },
                          }}
                        />
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <TextInput
                          label="Last Name"
                          value={editForm.lastName}
                          onChange={(e) => handleEditFormChange('lastName', e.target.value)}
                          radius="md"
                          required
                          styles={{
                            input: {
                              backgroundColor: getBg(colorScheme, 'white', theme.colors.dark[6]),
                              color: getBg(colorScheme, 'black', theme.colors.gray[3]),
                              borderColor: getBg(colorScheme, '#e5e7eb', theme.colors.dark[5]),
                            },
                            label: { color: getBg(colorScheme, 'black', theme.colors.gray[3]) },
                          }}
                        />
                      </Grid.Col>
                    </Grid>

                    <Grid gutter="md">
                      <Grid.Col span={4}>
                        <NumberInput
                          label="Age"
                          value={editForm.age}
                          onChange={(value) => handleEditFormChange('age', value)}
                          radius="md"
                          min={0}
                          max={120}
                          styles={{
                            input: {
                              backgroundColor: getBg(colorScheme, 'white', theme.colors.dark[6]),
                              color: getBg(colorScheme, 'black', theme.colors.gray[3]),
                              borderColor: getBg(colorScheme, '#e5e7eb', theme.colors.dark[5]),
                            },
                            label: { color: getBg(colorScheme, 'black', theme.colors.gray[3]) },
                          }}
                        />
                      </Grid.Col>
                      <Grid.Col span={4}>
                        <Select
                          label="Gender"
                          value={editForm.gender}
                          onChange={(value) => handleEditFormChange('gender', value)}
                          data={[
                            { value: 'Male', label: 'Male' },
                            { value: 'Female', label: 'Female' },
                            { value: 'Other', label: 'Other' }
                          ]}
                          radius="md"
                          styles={{
                            input: {
                              backgroundColor: getBg(colorScheme, 'white', theme.colors.dark[6]),
                              color: getBg(colorScheme, 'black', theme.colors.gray[3]),
                              borderColor: getBg(colorScheme, '#e5e7eb', theme.colors.dark[5]),
                            },
                            dropdown: {
                              backgroundColor: getBg(colorScheme, 'white', theme.colors.dark[7]),
                              borderColor: getBg(colorScheme, '#e5e7eb', theme.colors.dark[5]),
                            },
                            item: {
                              color: getBg(colorScheme, 'black', theme.colors.gray[3]),
                              '&[data-hovered]': {
                                backgroundColor: getBg(colorScheme, '#f1f5f9', theme.colors.dark[5]),
                              },
                            },
                            label: { color: getBg(colorScheme, 'black', theme.colors.gray[3]) },
                          }}
                        />
                      </Grid.Col>
                      <Grid.Col span={4}>
                        <NumberInput
                          label="Height (cm)"
                          value={editForm.height}
                          onChange={(value) => handleEditFormChange('height', value)}
                          radius="md"
                          min={0}
                          styles={{
                            input: {
                              backgroundColor: getBg(colorScheme, 'white', theme.colors.dark[6]),
                              color: getBg(colorScheme, 'black', theme.colors.gray[3]),
                              borderColor: getBg(colorScheme, '#e5e7eb', theme.colors.dark[5]),
                            },
                            label: { color: getBg(colorScheme, 'black', theme.colors.gray[3]) },
                          }}
                        />
                      </Grid.Col>
                    </Grid>

                    <NumberInput
                      label="Weight (kg)"
                      value={editForm.weight}
                      onChange={(value) => handleEditFormChange('weight', value)}
                      radius="md"
                      min={0}
                      styles={{
                        input: {
                          backgroundColor: getBg(colorScheme, 'white', theme.colors.dark[6]),
                          color: getBg(colorScheme, 'black', theme.colors.gray[3]),
                          borderColor: getBg(colorScheme, '#e5e7eb', theme.colors.dark[5]),
                        },
                        label: { color: getBg(colorScheme, 'black', theme.colors.gray[3]) },
                      }}
                    />
                  </Stack>
                ) : (
                  <Stack gap="md">
                    <Grid gutter="md">
                      <Grid.Col span={6}>
                        <TextInput
                          label="Brand"
                          value={editForm.brand}
                          onChange={(e) => handleEditFormChange('brand', e.target.value)}
                          radius="md"
                          required
                          styles={{
                            input: {
                              backgroundColor: getBg(colorScheme, 'white', theme.colors.dark[6]),
                              color: getBg(colorScheme, 'black', theme.colors.gray[3]),
                              borderColor: getBg(colorScheme, '#e5e7eb', theme.colors.dark[5]),
                            },
                            label: { color: getBg(colorScheme, 'black', theme.colors.gray[3]) },
                          }}
                        />
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <TextInput
                          label="Model"
                          value={editForm.model}
                          onChange={(e) => handleEditFormChange('model', e.target.value)}
                          radius="md"
                          required
                          styles={{
                            input: {
                              backgroundColor: getBg(colorScheme, 'white', theme.colors.dark[6]),
                              color: getBg(colorScheme, 'black', theme.colors.gray[3]),
                              borderColor: getBg(colorScheme, '#e5e7eb', theme.colors.dark[5]),
                            },
                            label: { color: getBg(colorScheme, 'black', theme.colors.gray[3]) },
                          }}
                        />
                      </Grid.Col>
                    </Grid>

                    <Grid gutter="md">
                      <Grid.Col span={4}>
                        <TextInput
                          label="Color"
                          value={editForm.color}
                          onChange={(e) => handleEditFormChange('color', e.target.value)}
                          radius="md"
                          styles={{
                            input: {
                              backgroundColor: getBg(colorScheme, 'white', theme.colors.dark[6]),
                              color: getBg(colorScheme, 'black', theme.colors.gray[3]),
                              borderColor: getBg(colorScheme, '#e5e7eb', theme.colors.dark[5]),
                            },
                            label: { color: getBg(colorScheme, 'black', theme.colors.gray[3]) },
                          }}
                        />
                      </Grid.Col>
                      <Grid.Col span={4}>
                        <TextInput
                          label="Submodel"
                          value={editForm.submodel}
                          onChange={(e) => handleEditFormChange('submodel', e.target.value)}
                          radius="md"
                          styles={{
                            input: {
                              backgroundColor: getBg(colorScheme, 'white', theme.colors.dark[6]),
                              color: getBg(colorScheme, 'black', theme.colors.gray[3]),
                              borderColor: getBg(colorScheme, '#e5e7eb', theme.colors.dark[5]),
                            },
                            label: { color: getBg(colorScheme, 'black', theme.colors.gray[3]) },
                          }}
                        />
                      </Grid.Col>
                      <Grid.Col span={4}>
                        <Select
                          label="Plate Type"
                          value={editForm.plateType}
                          onChange={(value) => handleEditFormChange('plateType', value)}
                          data={['National', 'Diplomatic', 'Government', 'Police', 'Military', 'Temporary']}
                          radius="md"
                          styles={{
                            input: {
                              backgroundColor: getBg(colorScheme, 'white', theme.colors.dark[6]),
                              color: getBg(colorScheme, 'black', theme.colors.gray[3]),
                              borderColor: getBg(colorScheme, '#e5e7eb', theme.colors.dark[5]),
                            },
                            dropdown: {
                              backgroundColor: getBg(colorScheme, 'white', theme.colors.dark[7]),
                              borderColor: getBg(colorScheme, '#e5e7eb', theme.colors.dark[5]),
                            },
                            item: {
                              color: getBg(colorScheme, 'black', theme.colors.gray[3]),
                              '&[data-hovered]': {
                                backgroundColor: getBg(colorScheme, '#f1f5f9', theme.colors.dark[5]),
                              },
                            },
                            label: { color: getBg(colorScheme, 'black', theme.colors.gray[3]) },
                          }}
                        />
                      </Grid.Col>
                    </Grid>

                    <Grid gutter="md">
                      <Grid.Col span={6}>
                        <Select
                          label="Region"
                          value={editForm.region}
                          onChange={(value) => handleEditFormChange('region', value)}
                          data={[
                            'Addis Ababa', 'Afar', 'Amhara', 'Benishangul-Gumuz', 'Dire Dawa',
                            'Gambela', 'Harari', 'Oromia', 'Sidama', 'Somali', 
                            'Southern Nations, Nationalities, and Peoples', 'South West Ethiopia',
                            'Tigray'
                          ]}
                          searchable
                          radius="md"
                          styles={{
                            input: {
                              backgroundColor: getBg(colorScheme, 'white', theme.colors.dark[6]),
                              color: getBg(colorScheme, 'black', theme.colors.gray[3]),
                              borderColor: getBg(colorScheme, '#e5e7eb', theme.colors.dark[5]),
                            },
                            dropdown: {
                              backgroundColor: getBg(colorScheme, 'white', theme.colors.dark[7]),
                              borderColor: getBg(colorScheme, '#e5e7eb', theme.colors.dark[5]),
                            },
                            item: {
                              color: getBg(colorScheme, 'black', theme.colors.gray[3]),
                              '&[data-hovered]': {
                                backgroundColor: getBg(colorScheme, '#f1f5f9', theme.colors.dark[5]),
                              },
                            },
                            label: { color: getBg(colorScheme, 'black', theme.colors.gray[3]) },
                          }}
                        />
                      </Grid.Col>
                      <Grid.Col span={3}>
                        <Select
                          label="Code"
                          value={editForm.code}
                          onChange={(value) => handleEditFormChange('code', value)}
                          data={Array.from({ length: 10 }, (_, i) => (i + 1).toString())}
                          radius="md"
                          styles={{
                            input: {
                              backgroundColor: getBg(colorScheme, 'white', theme.colors.dark[6]),
                              color: getBg(colorScheme, 'black', theme.colors.gray[3]),
                              borderColor: getBg(colorScheme, '#e5e7eb', theme.colors.dark[5]),
                            },
                            dropdown: {
                              backgroundColor: getBg(colorScheme, 'white', theme.colors.dark[7]),
                              borderColor: getBg(colorScheme, '#e5e7eb', theme.colors.dark[5]),
                            },
                            item: {
                              color: getBg(colorScheme, 'black', theme.colors.gray[3]),
                              '&[data-hovered]': {
                                backgroundColor: getBg(colorScheme, '#f1f5f9', theme.colors.dark[5]),
                              },
                            },
                            label: { color: getBg(colorScheme, 'black', theme.colors.gray[3]) },
                          }}
                        />
                      </Grid.Col>
                      <Grid.Col span={3}>
                        <TextInput
                          label="Plate Number"
                          value={editForm.plateNumber}
                          onChange={(e) => handleEditFormChange('plateNumber', e.target.value)}
                          radius="md"
                          placeholder="12345"
                          styles={{
                            input: {
                              backgroundColor: getBg(colorScheme, 'white', theme.colors.dark[6]),
                              color: getBg(colorScheme, 'black', theme.colors.gray[3]),
                              borderColor: getBg(colorScheme, '#e5e7eb', theme.colors.dark[5]),
                            },
                            label: { color: getBg(colorScheme, 'black', theme.colors.gray[3]) },
                          }}
                        />
                      </Grid.Col>
                    </Grid>
                  </Stack>
                )}
              </Tabs.Panel>

              {/* Location & Contact Tab (editable) */}
              <Tabs.Panel value="location">
                <Stack gap="md">
                  <TextInput
                    label="Location"
                    placeholder="Enter location where last seen"
                    value={editForm.location}
                    onChange={(e) => handleEditFormChange('location', e.target.value)}
                    radius="md"
                    required
                    leftSection={<IconMapPin size={16} />}
                    styles={{
                      input: {
                        backgroundColor: getBg(colorScheme, 'white', theme.colors.dark[6]),
                        color: getBg(colorScheme, 'black', theme.colors.gray[3]),
                        borderColor: getBg(colorScheme, '#e5e7eb', theme.colors.dark[5]),
                      },
                      label: { color: getBg(colorScheme, 'black', theme.colors.gray[3]) },
                    }}
                  />
                  <Grid gutter="md">
                    <Grid.Col span={6}>
                      <TextInput
                        label="Last Seen Date"
                        type="date"
                        value={editForm.lastSeenDate}
                        onChange={(e) => handleEditFormChange('lastSeenDate', e.target.value)}
                        radius="md"
                        styles={{
                          input: {
                            backgroundColor: getBg(colorScheme, 'white', theme.colors.dark[6]),
                            color: getBg(colorScheme, 'black', theme.colors.gray[3]),
                            borderColor: getBg(colorScheme, '#e5e7eb', theme.colors.dark[5]),
                          },
                          label: { color: getBg(colorScheme, 'black', theme.colors.gray[3]) },
                        }}
                      />
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <TextInput
                        label="Last Seen Time"
                        type="time"
                        value={editForm.lastSeenTime}
                        onChange={(e) => handleEditFormChange('lastSeenTime', e.target.value)}
                        radius="md"
                        styles={{
                          input: {
                            backgroundColor: getBg(colorScheme, 'white', theme.colors.dark[6]),
                            color: getBg(colorScheme, 'black', theme.colors.gray[3]),
                            borderColor: getBg(colorScheme, '#e5e7eb', theme.colors.dark[5]),
                          },
                          label: { color: getBg(colorScheme, 'black', theme.colors.gray[3]) },
                        }}
                      />
                    </Grid.Col>
                  </Grid>
                  <Divider color={getBg(colorScheme, theme.colors.gray[2], theme.colors.dark[5])} />
                  <Grid gutter="md">
                    <Grid.Col span={6}>
                      <TextInput
                        label="Contact Name"
                        value={editForm.contactName}
                        onChange={(e) => handleEditFormChange('contactName', e.target.value)}
                        radius="md"
                        styles={{
                          input: {
                            backgroundColor: getBg(colorScheme, 'white', theme.colors.dark[6]),
                            color: getBg(colorScheme, 'black', theme.colors.gray[3]),
                            borderColor: getBg(colorScheme, '#e5e7eb', theme.colors.dark[5]),
                          },
                          label: { color: getBg(colorScheme, 'black', theme.colors.gray[3]) },
                        }}
                      />
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <TextInput
                        label="Contact Phone"
                        value={editForm.contactPhone}
                        onChange={(e) => handleEditFormChange('contactPhone', e.target.value)}
                        radius="md"
                        styles={{
                          input: {
                            backgroundColor: getBg(colorScheme, 'white', theme.colors.dark[6]),
                            color: getBg(colorScheme, 'black', theme.colors.gray[3]),
                            borderColor: getBg(colorScheme, '#e5e7eb', theme.colors.dark[5]),
                          },
                          label: { color: getBg(colorScheme, 'black', theme.colors.gray[3]) },
                        }}
                      />
                    </Grid.Col>
                    <Grid.Col span={12}>
                      <TextInput
                        label="Contact Email"
                        type="email"
                        value={editForm.contactEmail}
                        onChange={(e) => handleEditFormChange('contactEmail', e.target.value)}
                        radius="md"
                        styles={{
                          input: {
                            backgroundColor: getBg(colorScheme, 'white', theme.colors.dark[6]),
                            color: getBg(colorScheme, 'black', theme.colors.gray[3]),
                            borderColor: getBg(colorScheme, '#e5e7eb', theme.colors.dark[5]),
                          },
                          label: { color: getBg(colorScheme, 'black', theme.colors.gray[3]) },
                        }}
                      />
                    </Grid.Col>
                    <Grid.Col span={12}>
                      <TextInput
                        label="Telegram Username"
                        placeholder="username (without @ symbol)"
                        value={editForm.telegramUsername}
                        onChange={(e) => handleEditFormChange('telegramUsername', e.target.value)}
                        radius="md"
                        leftSection={<Text c="#0088cc" fw={700}>@</Text>}
                        styles={{
                          input: {
                            backgroundColor: getBg(colorScheme, 'white', theme.colors.dark[6]),
                            color: getBg(colorScheme, 'black', theme.colors.gray[3]),
                            borderColor: getBg(colorScheme, '#e5e7eb', theme.colors.dark[5]),
                          },
                          label: { color: getBg(colorScheme, 'black', theme.colors.gray[3]) },
                        }}
                      />
                    </Grid.Col>
                  </Grid>
                </Stack>
              </Tabs.Panel>
            </Tabs>

            <Flex gap="sm" justify="flex-end" mt="lg">
              <Button
                variant="light"
                color="gray"
                onClick={() => {
                  setEditModalOpen(false);
                  setCaseToEdit(null);
                }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                color="blue"
                leftSection={<IconDeviceFloppy size={16} />}
                onClick={handleSaveEdit}
                loading={saving}
                disabled={!isEditFormValid() || saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Flex>

            <Paper
              withBorder
              p="md"
              mt="md"
              radius="md"
              style={{ background: getBg(colorScheme, '#f0f5ff', theme.colors.dark[6]) }}
            >
              <Flex gap="xs" align="center" mb="xs">
                <IconInfoCircle size={16} color={PRIMARY_COLOR} />
                <Text size="sm" fw={600}>Case Information</Text>
              </Flex>
              <Grid gutter="xs">
                <Grid.Col span={6}>
                  <Text size="xs" c="dimmed">Case ID</Text>
                  <Text size="sm" fw={500}>{caseToEdit.caseId}</Text>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Text size="xs" c="dimmed">Report Date</Text>
                  <Text size="sm" fw={500}>
                    {new Date(caseToEdit.reportDate).toLocaleDateString()}
                  </Text>
                </Grid.Col>
                <Grid.Col span={12}>
                  <Text size="xs" c="dimmed">Created By</Text>
                  <Text size="sm" fw={500}>
                    {formatUserInfo(caseToEdit.reportedBy)}
                  </Text>
                </Grid.Col>
              </Grid>
            </Paper>
          </Box>
        )}
      </Modal>

      <MainFooter />
    </Box>
  );
}