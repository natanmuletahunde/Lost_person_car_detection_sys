'use client';

import {
  Box, Title, Text, TextInput, Select, NumberInput,
  Textarea, SimpleGrid, Card, Button, FileInput, Stack,
  Flex, Badge, Alert, Tooltip, Loader, Checkbox,
  Avatar
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconUserPlus, IconCar, IconAlertTriangle, IconInfoCircle,
  IconCamera, IconRefresh, IconFileDescription, IconUpload,
  IconPhoto, IconMap, IconMapPin, IconCalendar, IconClock,
  IconMessageCircle, IconUser, IconMail, IconPhone, IconWorld,
  IconBrandTelegram, IconLock, IconShieldCheck, IconEyeOff,
  IconCheck, IconArrowRight
} from '@tabler/icons-react';
import Image from 'next/image';
import { colorOptions, regionOptions } from './constants';

// Person Details Step
export const PersonDetailsStep = ({
  formValues, handleInputChange, imagePreview, setImagePreview,
  handleImageUpload, completed, colorScheme, theme, PRIMARY_COLOR, PRIMARY_GRADIENT,
  PRIMARY_LIGHT, PRIMARY_DARK, getBg, gradientIconBox
}) => (
  <Card withBorder radius="lg" padding="xl" bg={getBg(colorScheme, '#f8fbff', theme.colors.dark[6])} style={{ borderLeft: `4px solid ${PRIMARY_COLOR}`, position: 'relative' }}>
    {completed && (
      <Tooltip label="Step completed" position="left" withArrow>
        <Box style={{ position: 'absolute', top: 16, right: 16, background: '#40c057', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 2px 8px rgba(64,192,87,0.3)', zIndex: 10 }}>
          <IconCheck size={18} />
        </Box>
      </Tooltip>
    )}
    <Flex align="center" gap="md" mb="lg">
      <Box style={gradientIconBox}><IconUserPlus size={24} /></Box>
      <Box>
        <Title order={4} style={{ color: PRIMARY_DARK }}>Personal Information</Title>
        <Text c="dimmed" size="sm">Provide details about the missing person</Text>
      </Box>
    </Flex>
    <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mb="lg">
      <TextInput
        name="firstName"
        label={<Text fw={600} size="sm">First name <Text span c={PRIMARY_COLOR}>*</Text></Text>}
        placeholder="Enter first name"
        radius="md"
        variant="filled"
        value={formValues.firstName}
        onChange={(e) => handleInputChange('firstName', e.target.value)}
      />
      <TextInput
        name="middleName"
        label={<Text fw={600} size="sm">Middle name</Text>}
        placeholder="Enter middle name"
        radius="md"
        variant="filled"
        value={formValues.middleName}
        onChange={(e) => handleInputChange('middleName', e.target.value)}
      />
      <TextInput
        name="lastName"
        label={<Text fw={600} size="sm">Last name <Text span c={PRIMARY_COLOR}>*</Text></Text>}
        placeholder="Enter last name"
        radius="md"
        variant="filled"
        value={formValues.lastName}
        onChange={(e) => handleInputChange('lastName', e.target.value)}
      />
    </SimpleGrid>
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md" mb="lg">
      <Select
        name="gender"
        label={<Text fw={600} size="sm">Gender <Text span c={PRIMARY_COLOR}>*</Text></Text>}
        data={['Male', 'Female', 'Other']}
        radius="md"
        variant="filled"
        value={formValues.gender}
        onChange={(value) => handleInputChange('gender', value)}
      />
      <NumberInput
        name="age"
        label={<Text fw={600} size="sm">Age <Text span c={PRIMARY_COLOR}>*</Text></Text>}
        placeholder="Enter age"
        radius="md"
        min={0}
        variant="filled"
        value={formValues.age}
        onChange={(value) => handleInputChange('age', value)}
      />
      <NumberInput
        name="height"
        label={<Text fw={600} size="sm">Height (cm)</Text>}
        placeholder="Height in cm"
        radius="md"
        min={0}
        variant="filled"
        value={formValues.height}
        onChange={(value) => handleInputChange('height', value)}
      />
      <NumberInput
        name="weight"
        label={<Text fw={600} size="sm">Weight (kg)</Text>}
        placeholder="Weight in kg"
        radius="md"
        min={0}
        variant="filled"
        value={formValues.weight}
        onChange={(value) => handleInputChange('weight', value)}
      />
    </SimpleGrid>
    <Textarea
      name="description"
      label={<Text fw={600} size="sm">Additional Description</Text>}
      placeholder="Add any distinguishing features, clothing description, last seen with, medical conditions, etc."
      minRows={4}
      radius="md"
      mb="lg"
      variant="filled"
      value={formValues.description}
      onChange={(e) => handleInputChange('description', e.target.value)}
    />
    <Select
      name="specialCase"
      label={<Text fw={600} size="sm">Special Case (if applicable)</Text>}
      placeholder="Select if the person has special circumstances"
      data={[
        { value: 'none', label: 'None' },
        { value: 'mentally-ill', label: 'Mentally Ill' },
        { value: 'criminal', label: 'Criminal Background' }
      ]}
      radius="md"
      clearable
      mb="lg"
      variant="filled"
      value={formValues.specialCase}
      onChange={(value) => handleInputChange('specialCase', value)}
    />
    <Card
      withBorder
      radius="lg"
      padding="xl"
      bg={getBg(colorScheme, 'white', theme.colors.dark[7])}
      style={{ borderStyle: 'dashed', borderColor: PRIMARY_LIGHT, cursor: 'pointer', borderWidth: 2 }}
      onClick={() => document.getElementById('person-image-upload')?.click()}
    >
      <input type="file" id="person-image-upload" style={{ display: 'none' }} accept="image/*" onChange={handleImageUpload} />
      <Flex direction="column" align="center" gap="md">
        {imagePreview ? (
          <>
            <Box style={{ position: 'relative', width: 120, height: 120 }}>
              <Image src={imagePreview} alt="Preview" fill style={{ borderRadius: '12px', objectFit: 'cover', border: `3px solid ${PRIMARY_COLOR}` }} />
            </Box>
            <Flex gap="sm">
              <Button size="sm" variant="light" color="blue" onClick={(e) => { e.stopPropagation(); document.getElementById('person-image-upload')?.click(); }} leftSection={<IconRefresh size={14} />}>Change</Button>
              <Button size="sm" variant="light" color="red" onClick={(e) => { e.stopPropagation(); setImagePreview(null); }}>Remove</Button>
            </Flex>
          </>
        ) : (
          <>
            <Box style={{ background: PRIMARY_GRADIENT, padding: '20px', borderRadius: '50%', color: 'white', marginBottom: '8px' }}><IconCamera size={40} /></Box>
            <Text fw={700} size="lg" style={{ color: PRIMARY_DARK }}>Upload Person's Photo</Text>
            <Text c="dimmed" size="sm" ta="center">Click or drag & drop to upload a clear recent photo</Text>
            <Text size="xs" c={PRIMARY_COLOR} fw={600} mt="xs">Recommended: Front-facing, good lighting, recent photo</Text>
            <Badge color="blue" variant="light" size="sm" mt="xs">Max 5MB • JPG, PNG, WebP</Badge>
          </>
        )}
      </Flex>
    </Card>
  </Card>
);

// Vehicle Details Step
export const VehicleDetailsStep = ({
  formValues, handleInputChange, selectedBrand, setSelectedBrand, selectedModel, setSelectedModel,
  selectedSubmodel, setSelectedSubmodel, brands, models, submodels, ownershipDoc, setOwnershipDoc,
  ownershipDocError, completed, colorScheme, theme, PRIMARY_COLOR, PRIMARY_GRADIENT, PRIMARY_LIGHT,
  PRIMARY_DARK, getBg, gradientIconBox
}) => (
  <Card withBorder radius="lg" padding="xl" bg={getBg(colorScheme, '#f8fbff', theme.colors.dark[6])} style={{ borderLeft: `4px solid ${PRIMARY_COLOR}`, position: 'relative' }}>
    {completed && (
      <Tooltip label="Step completed" position="left" withArrow>
        <Box style={{ position: 'absolute', top: 16, right: 16, background: '#40c057', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 2px 8px rgba(64,192,87,0.3)', zIndex: 10 }}>
          <IconCheck size={18} />
        </Box>
      </Tooltip>
    )}
    <Flex align="center" gap="md" mb="lg">
      <Box style={gradientIconBox}><IconCar size={24} /></Box>
      <Box>
        <Title order={4} style={{ color: PRIMARY_DARK }}>Vehicle Information</Title>
        <Text c="dimmed" size="sm">Provide detailed information about the vehicle</Text>
      </Box>
    </Flex>
    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mb="lg">
      <Select
        name="brand"
        label={<Text fw={600} size="sm">Brand <Text span c={PRIMARY_COLOR}>*</Text></Text>}
        placeholder="Select vehicle brand"
        data={brands}
        value={selectedBrand}
        onChange={setSelectedBrand}
        radius="md"
        searchable
        clearable
        leftSection={<IconCar size={16} color={PRIMARY_COLOR} />}
        variant="filled"
      />
      <Select
        name="model"
        label={<Text fw={600} size="sm">Model <Text span c={PRIMARY_COLOR}>*</Text></Text>}
        placeholder="Select vehicle model"
        data={models}
        value={selectedModel}
        onChange={setSelectedModel}
        radius="md"
        disabled={!selectedBrand}
        searchable
        clearable
        variant="filled"
      />
      <Select
        name="submodel"
        label={<Text fw={600} size="sm">Sub Model</Text>}
        placeholder="Select sub model"
        data={submodels}
        value={selectedSubmodel}
        onChange={setSelectedSubmodel}
        radius="md"
        disabled={!selectedModel}
        searchable
        clearable
        variant="filled"
      />
      <Select
        name="color"
        label={<Text fw={600} size="sm">Color <Text span c={PRIMARY_COLOR}>*</Text></Text>}
        placeholder="Select vehicle color"
        data={colorOptions}
        radius="md"
        searchable
        variant="filled"
        value={formValues.color}
        onChange={(value) => handleInputChange('color', value)}
      />
    </SimpleGrid>
    <Textarea
      name="vehicleDescription"
      label={<Text fw={600} size="sm">Additional Vehicle Description</Text>}
      placeholder="Add additional information about the vehicle (damages, modifications, special features, stickers, dents, unique characteristics, etc.)"
      radius="md"
      minRows={4}
      mb="lg"
      variant="filled"
      value={formValues.vehicleDescription}
      onChange={(e) => handleInputChange('vehicleDescription', e.target.value)}
    />
    <Select
      name="specialCase"
      label={<Text fw={600} size="sm">Special Case (if applicable)</Text>}
      placeholder="Select if the vehicle is linked to a person with special circumstances"
      data={[
        { value: 'none', label: 'None' },
        { value: 'mentally-ill', label: 'Mentally Ill Owner/Driver' },
        { value: 'criminal', label: 'Criminal Background Owner/Driver' }
      ]}
      radius="md"
      clearable
      mb="lg"
      variant="filled"
      value={formValues.specialCase}
      onChange={(value) => handleInputChange('specialCase', value)}
    />
    <Card withBorder radius="lg" padding="xl" mb="lg" bg={getBg(colorScheme, 'white', theme.colors.dark[7])} style={{ borderColor: PRIMARY_COLOR, borderWidth: 2 }}>
      <Flex align="center" gap="md" mb="lg">
        <Box style={{ background: PRIMARY_GRADIENT, padding: '8px', borderRadius: '8px', color: 'white' }}><IconInfoCircle size={20} /></Box>
        <Box>
          <Title order={5} style={{ color: PRIMARY_DARK }}>License Plate Information</Title>
          <Text c="dimmed" size="sm">Ethiopian license plate format details</Text>
        </Box>
      </Flex>
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mb="md">
        <Select
          name="plateType"
          label={<Text fw={600} size="sm">Plate Type <Text span c={PRIMARY_COLOR}>*</Text></Text>}
          data={['National', 'Diplomatic', 'Government', 'Police', 'Military', 'Temporary']}
          radius="md"
          placeholder="Select type"
          variant="filled"
          value={formValues.plateType}
          onChange={(value) => handleInputChange('plateType', value)}
        />
        <Select
          name="region"
          label={<Text fw={600} size="sm">Region <Text span c={PRIMARY_COLOR}>*</Text></Text>}
          data={regionOptions}
          radius="md"
          placeholder="Select region"
          searchable
          variant="filled"
          value={formValues.region}
          onChange={(value) => handleInputChange('region', value)}
        />
        <Select
          name="code"
          label={<Text fw={600} size="sm">Code <Text span c={PRIMARY_COLOR}>*</Text></Text>}
          data={Array.from({ length: 10 }, (_, i) => (i + 1).toString())}
          radius="md"
          placeholder="Select code"
          variant="filled"
          value={formValues.code}
          onChange={(value) => handleInputChange('code', value)}
        />
      </SimpleGrid>
      <TextInput
        name="plateNumber"
        label={<Text fw={600} size="sm">Plate Number <Text span c={PRIMARY_COLOR}>*</Text></Text>}
        placeholder="Enter plate number (e.g., AA-12345)"
        radius="md"
        description="Format: RegionCode-Number (e.g., AA-12345 for Addis Ababa)"
        variant="filled"
        value={formValues.plateNumber}
        onChange={(e) => handleInputChange('plateNumber', e.target.value)}
        styles={{
          input: { fontFamily: 'monospace', fontSize: '1.1em', fontWeight: 700, letterSpacing: '1px', color: PRIMARY_DARK },
          description: { color: PRIMARY_COLOR, fontWeight: 500 }
        }}
      />
    </Card>
    <Card withBorder radius="lg" padding="xl" mb="lg" bg={getBg(colorScheme, 'white', theme.colors.dark[7])} style={{ borderColor: PRIMARY_LIGHT, borderWidth: 2 }}>
      <Flex align="center" gap="md" mb="md">
        <Box style={{ background: PRIMARY_GRADIENT, padding: '8px', borderRadius: '8px', color: 'white' }}>
          <IconFileDescription size={20} />
        </Box>
        <Box>
          <Title order={5} style={{ color: PRIMARY_DARK }}>Ownership Documentation (Optional)</Title>
          <Text c="dimmed" size="sm">Upload proof of ownership (e.g., title, registration)</Text>
        </Box>
      </Flex>
      <FileInput
        name="ownershipDoc"
        placeholder="Choose file..."
        accept="image/jpeg,image/png,image/webp,application/pdf"
        onChange={setOwnershipDoc}
        value={ownershipDoc}
        radius="md"
        clearable
        leftSection={<IconUpload size={16} color={PRIMARY_COLOR} />}
        description="Accepted formats: JPG, PNG, WebP, PDF (max 10MB)"
        variant="filled"
        error={ownershipDocError}
      />
    </Card>
    <Card withBorder radius="lg" padding="xl" bg={getBg(colorScheme, 'white', theme.colors.dark[7])} style={{ borderStyle: 'dashed', borderColor: PRIMARY_LIGHT, borderWidth: 2 }}>
      <Flex direction="column" align="center" gap="md">
        <Box style={{ background: PRIMARY_GRADIENT, padding: '20px', borderRadius: '50%', color: 'white' }}><IconPhoto size={40} /></Box>
        <Box ta="center">
          <Text fw={700} size="lg" style={{ color: PRIMARY_DARK }} mb="xs">Vehicle Images</Text>
          <Text c="dimmed" size="sm">Upload clear images from multiple angles for better identification</Text>
        </Box>
        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md" w="100%">
          {['Front', 'Back', 'Left Side', 'Right Side'].map((angle, idx) => (
            <Card key={idx} withBorder padding="lg" radius="md" bg={getBg(colorScheme, 'white', theme.colors.dark[7])} style={{ cursor: 'pointer', borderColor: getBg(colorScheme, '#f0f5ff', theme.colors.dark[5]) }}>
              <Flex direction="column" align="center" gap="xs">
                <Box style={{ background: getBg(colorScheme, '#f0f5ff', theme.colors.dark[6]), padding: '12px', borderRadius: '10px', color: PRIMARY_COLOR }}><IconCamera size={24} /></Box>
                <Text size="sm" fw={600} style={{ color: PRIMARY_DARK }}>{angle} View</Text>
                <Text size="xs" c="dimmed">Click to upload</Text>
              </Flex>
            </Card>
          ))}
        </SimpleGrid>
        <Badge color="blue" variant="light" size="sm" mt="sm">Up to 10 images allowed • Max 5MB each</Badge>
      </Flex>
    </Card>
  </Card>
);

// Special Case Details Step
export const SpecialCaseDetailsStep = ({
  formValues, handleInputChange, specialCategory, setSpecialCategory, doctorReport, setDoctorReport,
  criminalRecord, setCriminalRecord, imagePreview, setImagePreview, handleImageUpload, completed,
  colorScheme, theme, PRIMARY_COLOR, PRIMARY_GRADIENT, PRIMARY_LIGHT, PRIMARY_DARK, getBg, gradientIconBox
}) => (
  <Card withBorder radius="lg" padding="xl" bg={getBg(colorScheme, '#f8fbff', theme.colors.dark[6])} style={{ borderLeft: `4px solid ${PRIMARY_COLOR}`, position: 'relative' }}>
    {completed && (
      <Tooltip label="Step completed" position="left" withArrow>
        <Box style={{ position: 'absolute', top: 16, right: 16, background: '#40c057', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 2px 8px rgba(64,192,87,0.3)', zIndex: 10 }}>
          <IconCheck size={18} />
        </Box>
      </Tooltip>
    )}
    <Flex align="center" gap="md" mb="lg">
      <Box style={gradientIconBox}><IconAlertTriangle size={24} /></Box>
      <Box>
        <Title order={4} style={{ color: PRIMARY_DARK }}>Special Case Information</Title>
        <Text c="dimmed" size="sm">Provide details about the person with special circumstances</Text>
      </Box>
    </Flex>
    <Select
      name="specialCategory"
      label={<Text fw={600} size="sm">Special Category <Text span c={PRIMARY_COLOR}>*</Text></Text>}
      placeholder="Select the category"
      data={[
        { value: 'mentally-ill', label: 'Mentally Ill' },
        { value: 'criminal', label: 'Criminal Background' }
      ]}
      radius="md"
      value={specialCategory}
      onChange={setSpecialCategory}
      mb="lg"
      variant="filled"
    />
    {specialCategory === 'mentally-ill' && (
      <Card withBorder radius="lg" padding="xl" mb="lg" bg={getBg(colorScheme, 'white', theme.colors.dark[7])} style={{ borderColor: PRIMARY_LIGHT, borderWidth: 2 }}>
        <Flex align="center" gap="md" mb="md">
          <Box style={{ background: PRIMARY_GRADIENT, padding: '8px', borderRadius: '8px', color: 'white' }}>
            <IconFileDescription size={20} />
          </Box>
          <Box>
            <Title order={5} style={{ color: PRIMARY_DARK }}>Doctor's Report <Text span c={PRIMARY_COLOR}>*</Text></Title>
            <Text c="dimmed" size="sm">Upload a medical report or documentation</Text>
          </Box>
        </Flex>
        <FileInput
          name="doctorReport"
          placeholder="Choose file..."
          accept="image/*,application/pdf"
          onChange={setDoctorReport}
          value={doctorReport}
          radius="md"
          clearable
          leftSection={<IconUpload size={16} color={PRIMARY_COLOR} />}
          description="Accepted formats: JPG, PNG, PDF (max 10MB)"
          variant="filled"
        />
      </Card>
    )}
    {specialCategory === 'criminal' && (
      <Card withBorder radius="lg" padding="xl" mb="lg" bg={getBg(colorScheme, 'white', theme.colors.dark[7])} style={{ borderColor: PRIMARY_LIGHT, borderWidth: 2 }}>
        <Flex align="center" gap="md" mb="md">
          <Box style={{ background: PRIMARY_GRADIENT, padding: '8px', borderRadius: '8px', color: 'white' }}>
            <IconFileDescription size={20} />
          </Box>
          <Box>
            <Title order={5} style={{ color: PRIMARY_DARK }}>Arrest Warrant / Criminal Record <Text span c={PRIMARY_COLOR}>*</Text></Title>
            <Text c="dimmed" size="sm">Upload official documentation</Text>
          </Box>
        </Flex>
        <FileInput
          name="criminalRecord"
          placeholder="Choose file..."
          accept="image/*,application/pdf"
          onChange={setCriminalRecord}
          value={criminalRecord}
          radius="md"
          clearable
          leftSection={<IconUpload size={16} color={PRIMARY_COLOR} />}
          description="Accepted formats: JPG, PNG, PDF (max 10MB)"
          variant="filled"
        />
      </Card>
    )}
    <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mb="lg">
      <TextInput
        name="firstName"
        label={<Text fw={600} size="sm">First name <Text span c={PRIMARY_COLOR}>*</Text></Text>}
        placeholder="Enter first name"
        radius="md"
        variant="filled"
        value={formValues.firstName}
        onChange={(e) => handleInputChange('firstName', e.target.value)}
      />
      <TextInput
        name="middleName"
        label={<Text fw={600} size="sm">Middle name</Text>}
        placeholder="Enter middle name"
        radius="md"
        variant="filled"
        value={formValues.middleName}
        onChange={(e) => handleInputChange('middleName', e.target.value)}
      />
      <TextInput
        name="lastName"
        label={<Text fw={600} size="sm">Last name <Text span c={PRIMARY_COLOR}>*</Text></Text>}
        placeholder="Enter last name"
        radius="md"
        variant="filled"
        value={formValues.lastName}
        onChange={(e) => handleInputChange('lastName', e.target.value)}
      />
    </SimpleGrid>
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md" mb="lg">
      <Select
        name="gender"
        label={<Text fw={600} size="sm">Gender <Text span c={PRIMARY_COLOR}>*</Text></Text>}
        data={['Male', 'Female', 'Other']}
        radius="md"
        variant="filled"
        value={formValues.gender}
        onChange={(value) => handleInputChange('gender', value)}
      />
      <NumberInput
        name="age"
        label={<Text fw={600} size="sm">Age <Text span c={PRIMARY_COLOR}>*</Text></Text>}
        placeholder="Enter age"
        radius="md"
        min={0}
        variant="filled"
        value={formValues.age}
        onChange={(value) => handleInputChange('age', value)}
      />
      <NumberInput
        name="height"
        label={<Text fw={600} size="sm">Height (cm)</Text>}
        placeholder="Height in cm"
        radius="md"
        min={0}
        variant="filled"
        value={formValues.height}
        onChange={(value) => handleInputChange('height', value)}
      />
      <NumberInput
        name="weight"
        label={<Text fw={600} size="sm">Weight (kg)</Text>}
        placeholder="Weight in kg"
        radius="md"
        min={0}
        variant="filled"
        value={formValues.weight}
        onChange={(value) => handleInputChange('weight', value)}
      />
    </SimpleGrid>
    <Textarea
      name="description"
      label={<Text fw={600} size="sm">Additional Description</Text>}
      placeholder="Add any distinguishing features, clothing description, last seen with, medical conditions, etc."
      minRows={4}
      radius="md"
      mb="lg"
      variant="filled"
      value={formValues.description}
      onChange={(e) => handleInputChange('description', e.target.value)}
    />
    <Card
      withBorder
      radius="lg"
      padding="xl"
      bg={getBg(colorScheme, 'white', theme.colors.dark[7])}
      style={{ borderStyle: 'dashed', borderColor: PRIMARY_LIGHT, cursor: 'pointer', borderWidth: 2 }}
      onClick={() => document.getElementById('special-image-upload')?.click()}
    >
      <input type="file" id="special-image-upload" style={{ display: 'none' }} accept="image/*" onChange={handleImageUpload} />
      <Flex direction="column" align="center" gap="md">
        {imagePreview ? (
          <>
            <Box style={{ position: 'relative', width: 120, height: 120 }}>
              <Image src={imagePreview} alt="Preview" fill style={{ borderRadius: '12px', objectFit: 'cover', border: `3px solid ${PRIMARY_COLOR}` }} />
            </Box>
            <Flex gap="sm">
              <Button size="sm" variant="light" color="blue" onClick={(e) => { e.stopPropagation(); document.getElementById('special-image-upload')?.click(); }} leftSection={<IconRefresh size={14} />}>Change</Button>
              <Button size="sm" variant="light" color="red" onClick={(e) => { e.stopPropagation(); setImagePreview(null); }}>Remove</Button>
            </Flex>
          </>
        ) : (
          <>
            <Box style={{ background: PRIMARY_GRADIENT, padding: '20px', borderRadius: '50%', color: 'white', marginBottom: '8px' }}><IconCamera size={40} /></Box>
            <Text fw={700} size="lg" style={{ color: PRIMARY_DARK }}>Upload Person's Photo</Text>
            <Text c="dimmed" size="sm" ta="center">Click or drag & drop to upload a clear recent photo</Text>
            <Text size="xs" c={PRIMARY_COLOR} fw={600} mt="xs">Recommended: Front-facing, good lighting, recent photo</Text>
            <Badge color="blue" variant="light" size="sm" mt="xs">Max 5MB • JPG, PNG, WebP</Badge>
          </>
        )}
      </Flex>
    </Card>
  </Card>
);

// Last Seen Step
export const LastSeenStep = ({
  formValues, handleInputChange, mapCenter, setMapCenter, regType, completed,
  colorScheme, theme, PRIMARY_COLOR, PRIMARY_GRADIENT, PRIMARY_LIGHT, PRIMARY_DARK, getBg, gradientIconBox,
  LocationPicker
}) => (
  <Card withBorder radius="lg" padding="xl" bg={getBg(colorScheme, '#f8fbff', theme.colors.dark[6])} style={{ borderLeft: `4px solid ${PRIMARY_COLOR}`, position: 'relative' }}>
    {completed && (
      <Tooltip label="Step completed" position="left" withArrow>
        <Box style={{ position: 'absolute', top: 16, right: 16, background: '#40c057', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 2px 8px rgba(64,192,87,0.3)', zIndex: 10 }}>
          <IconCheck size={18} />
        </Box>
      </Tooltip>
    )}
    <Flex align="center" gap="md" mb="lg">
      <Box style={gradientIconBox}><IconMap size={24} /></Box>
      <Box>
        <Title order={4} style={{ color: PRIMARY_DARK }}>Last Known Information</Title>
        <Text c="dimmed" size="sm">Where and when was the {regType.toLowerCase()} last seen?</Text>
      </Box>
    </Flex>
    <TextInput
      name="location"
      label={<Text fw={600} size="sm">Last Seen Location <Text span c={PRIMARY_COLOR}>*</Text></Text>}
      placeholder="Enter city, specific address, or landmark"
      leftSection={<IconMapPin size={18} color={PRIMARY_COLOR} />}
      radius="md"
      mb="lg"
      variant="filled"
      value={formValues.location}
      onChange={(e) => handleInputChange('location', e.target.value)}
    />
    <Card withBorder radius="lg" padding={0} mb="lg" style={{ overflow: 'hidden' }}>
      <LocationPicker
        onLocationSelect={(lat, lng, address) => {
          handleInputChange('location', address);
          handleInputChange('latitude', lat.toString());
          handleInputChange('longitude', lng.toString());
          setMapCenter([lat, lng]);
        }}
        initialPosition={mapCenter}
      />
    </Card>
    <Button
      size="xs"
      variant="light"
      leftSection={<IconMapPin size={14} />}
      onClick={() => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const { latitude, longitude } = pos.coords;
              setMapCenter([latitude, longitude]);
            },
            (err) => {
              notifications.show({ title: 'Location Error', message: err.message, color: 'red' });
            }
          );
        } else {
          notifications.show({
              title: 'Geolocation not supported', color: 'yellow',
              message: undefined
          });
        }
      }}
      mb="md"
    >
      Use my current location
    </Button>
    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
      <TextInput
        name="lastSeenDate"
        label={<Text fw={600} size="sm">Last Seen Date <Text span c={PRIMARY_COLOR}>*</Text></Text>}
        placeholder="YYYY-MM-DD"
        radius="md"
        type="date"
        max={new Date().toISOString().split('T')[0]}
        leftSection={<IconCalendar size={18} color={PRIMARY_COLOR} />}
        variant="filled"
        value={formValues.lastSeenDate}
        onChange={(e) => handleInputChange('lastSeenDate', e.target.value)}
      />
      <TextInput
        name="lastSeenTime"
        label={<Text fw={600} size="sm">Approximate Time</Text>}
        placeholder="HH:MM (24-hour format)"
        radius="md"
        type="time"
        leftSection={<IconClock size={18} color={PRIMARY_COLOR} />}
        variant="filled"
        value={formValues.lastSeenTime}
        onChange={(e) => handleInputChange('lastSeenTime', e.target.value)}
      />
    </SimpleGrid>
    <Alert
      icon={<IconInfoCircle size={18} color={PRIMARY_COLOR} />}
      title="Accuracy Matters"
      color="blue"
      variant="light"
      radius="md"
      mt="lg"
      style={{
        borderColor: PRIMARY_LIGHT,
        backgroundColor: getBg(colorScheme, `${PRIMARY_COLOR}08`, theme.colors.dark[6]),
      }}
    >
      <Text size="sm">The more accurate your location and time information, the better chance we have of finding the missing {regType.toLowerCase()}.</Text>
    </Alert>
  </Card>
);

// Contact Info Step
export const ContactInfoStep = ({
  formValues, handleInputChange, currentUser, completed,
  colorScheme, theme, PRIMARY_COLOR, PRIMARY_GRADIENT, PRIMARY_LIGHT, PRIMARY_DARK, getBg, gradientIconBox
}) => (
  <Card withBorder radius="lg" padding="xl" bg={getBg(colorScheme, '#f8fbff', theme.colors.dark[6])} style={{ borderLeft: `4px solid ${PRIMARY_COLOR}`, position: 'relative' }}>
    {completed && (
      <Tooltip label="Step completed" position="left" withArrow>
        <Box style={{ position: 'absolute', top: 16, right: 16, background: '#40c057', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 2px 8px rgba(64,192,87,0.3)', zIndex: 10 }}>
          <IconCheck size={18} />
        </Box>
      </Tooltip>
    )}
    <Flex align="center" gap="md" mb="lg">
      <Box style={gradientIconBox}><IconMessageCircle size={24} /></Box>
      <Box>
        <Title order={4} style={{ color: PRIMARY_DARK }}>Contact Information</Title>
        <Text c="dimmed" size="sm">How can people contact you with information?</Text>
      </Box>
    </Flex>
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md" mb="lg">
      <Card withBorder padding="lg" radius="md" bg={getBg(colorScheme, 'white', theme.colors.dark[7])} style={{ borderColor: PRIMARY_LIGHT }}>
        <Flex align="center" gap="md">
          <Avatar color={PRIMARY_COLOR} radius="xl" style={{ background: PRIMARY_GRADIENT }}><IconUser size={20} /></Avatar>
          <Box>
            <Text size="xs" c="dimmed" fw={600}>Name</Text>
            <Text fw={700} style={{ color: PRIMARY_DARK }}>{currentUser?.firstName} {currentUser?.lastName}</Text>
          </Box>
        </Flex>
      </Card>
      <Card withBorder padding="lg" radius="md" bg={getBg(colorScheme, 'white', theme.colors.dark[7])} style={{ borderColor: PRIMARY_LIGHT }}>
        <Flex align="center" gap="md">
          <Avatar color="green" radius="xl" style={{ background: 'linear-gradient(135deg, #00b894 0%, #00a085 100%)' }}><IconMail size={20} /></Avatar>
          <Box>
            <Text size="xs" c="dimmed" fw={600}>Email</Text>
            <Text fw={700} style={{ color: PRIMARY_DARK }}>{currentUser?.email}</Text>
          </Box>
        </Flex>
      </Card>
      <Card withBorder padding="lg" radius="md" bg={getBg(colorScheme, 'white', theme.colors.dark[7])} style={{ borderColor: PRIMARY_LIGHT }}>
        <Flex align="center" gap="md">
          <Avatar color="red" radius="xl" style={{ background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)' }}><IconPhone size={20} /></Avatar>
          <Box>
            <Text size="xs" c="dimmed" fw={600}>Phone</Text>
            <Text fw={700} style={{ color: PRIMARY_DARK }}>{currentUser?.phone}</Text>
          </Box>
        </Flex>
      </Card>
      <Card withBorder padding="lg" radius="md" bg={getBg(colorScheme, 'white', theme.colors.dark[7])} style={{ borderColor: PRIMARY_LIGHT }}>
        <Flex align="center" gap="md">
          <Avatar color="grape" radius="xl" style={{ background: 'linear-gradient(135deg, #cc66ff 0%, #9933ff 100%)' }}><IconWorld size={20} /></Avatar>
          <Box>
            <Text size="xs" c="dimmed" fw={600}>Role</Text>
            <Badge color="blue" variant="light" size="sm" style={{ background: `${PRIMARY_COLOR}15`, color: PRIMARY_COLOR, fontWeight: 700, border: `1px solid ${PRIMARY_COLOR}30` }}>
              {currentUser?.role || 'User'}
            </Badge>
          </Box>
        </Flex>
      </Card>
    </SimpleGrid>
    <Card withBorder padding="lg" radius="lg" mb="md" bg={getBg(colorScheme, 'linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%)', `linear-gradient(135deg, ${theme.colors.dark[5]} 0%, ${theme.colors.dark[7]} 100%)`)} style={{ borderColor: '#0088cc', borderWidth: 2 }}>
      <Flex align="center" gap="md" mb="md">
        <IconBrandTelegram size={28} color="#0088cc" />
        <Box>
          <Text fw={700} size="lg" style={{ color: '#0088cc' }}>Telegram Contact (Optional)</Text>
          <Text size="sm" c="dimmed">Add your Telegram username for faster, secure communication</Text>
        </Box>
      </Flex>
      <TextInput
        name="telegramUsername"
        placeholder="username (without @ symbol)"
        radius="md"
        leftSection={<Text c="#0088cc" fw={700}>@</Text>}
        description="People with information can contact you quickly via Telegram"
        variant="filled"
        value={formValues.telegramUsername}
        onChange={(e) => handleInputChange('telegramUsername', e.target.value)}
        styles={{
          root: { marginBottom: 8 },
          input: { borderColor: '#0088cc' },
          description: { color: '#0088cc', fontWeight: 500 }
        }}
      />
      <Text size="xs" c="dimmed" mt="xs">
        • Telegram provides end-to-end encryption for privacy<br />
        • Faster than email for urgent communications<br />
        • You can share photos and location easily
      </Text>
    </Card>
    <Textarea
      name="additionalContactInfo"
      label={<Text fw={600} size="sm">Additional Contact Methods</Text>}
      placeholder="Any other ways people can contact you (e.g., other social media profiles, alternative phone numbers, WhatsApp, etc.)"
      description="Optional: Add any other contact methods or special instructions"
      minRows={3}
      radius="md"
      mb="lg"
      variant="filled"
      value={formValues.additionalContactInfo}
      onChange={(e) => handleInputChange('additionalContactInfo', e.target.value)}
    />
    <Alert
      icon={<IconLock size={20} color={PRIMARY_COLOR} />}
      title="Your Privacy & Security"
      color="blue"
      variant="light"
      radius="md"
      style={{ borderColor: PRIMARY_COLOR, background: getBg(colorScheme, `${PRIMARY_COLOR}08`, theme.colors.dark[6]) }}
    >
      <Stack gap="xs">
        <Text size="sm"><IconShieldCheck size={16} style={{ marginRight: 8, verticalAlign: 'middle', color: PRIMARY_COLOR }} /> Your contact information is protected with end-to-end encryption</Text>
        <Text size="sm"><IconEyeOff size={16} style={{ marginRight: 8, verticalAlign: 'middle', color: PRIMARY_COLOR }} /> Only verified users with relevant information can see your contact details</Text>
        <Text size="sm"><IconInfoCircle size={16} style={{ marginRight: 8, verticalAlign: 'middle', color: PRIMARY_COLOR }} /> We never share your personal data with third parties or advertisers</Text>
      </Stack>
    </Alert>
  </Card>
);

// Review & Submit Step
export const ReviewSubmitStep = ({
  regType, formValues, currentUser, isSubmitting, completed,
  colorScheme, theme, PRIMARY_COLOR, PRIMARY_GRADIENT, PRIMARY_LIGHT, PRIMARY_DARK, getBg, gradientIconBox
}) => (
  <Card withBorder radius="lg" padding="xl" bg={getBg(colorScheme, '#f8fbff', theme.colors.dark[6])} style={{ borderLeft: `4px solid ${PRIMARY_COLOR}`, position: 'relative' }}>
    {completed && (
      <Tooltip label="Step completed" position="left" withArrow>
        <Box style={{ position: 'absolute', top: 16, right: 16, background: '#40c057', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 2px 8px rgba(64,192,87,0.3)', zIndex: 10 }}>
          <IconCheck size={18} />
        </Box>
      </Tooltip>
    )}
    <Flex align="center" gap="md" mb="lg">
      <Box style={gradientIconBox}><IconCheck size={24} /></Box>
      <Box>
        <Title order={4} style={{ color: PRIMARY_DARK }}>Review & Submit Your Report</Title>
        <Text c="dimmed" size="sm">Please review all information before final submission</Text>
      </Box>
    </Flex>
    <Text size="sm" c="dimmed" mb="xl" ta="center">Youre almost done! Take a moment to verify all details are correct.</Text>
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg" mb="xl">
      <Card withBorder padding="lg" radius="md" bg={getBg(colorScheme, 'white', theme.colors.dark[7])} style={{ borderColor: PRIMARY_LIGHT }}>
        <Text size="sm" c="dimmed" mb="xs">Report Type</Text>
        <Badge size="lg" style={{ background: PRIMARY_GRADIENT, color: 'white', fontWeight: 700, padding: '8px 16px' }} leftSection={regType === 'Person' ? <IconUserPlus size={16} /> : regType === 'Vehicle' ? <IconCar size={16} /> : <IconAlertTriangle size={16} />}>
          Missing {regType === 'Special' ? 'Special Case' : regType}
        </Badge>
      </Card>
      <Card withBorder padding="lg" radius="md" bg={getBg(colorScheme, 'white', theme.colors.dark[7])} style={{ borderColor: PRIMARY_LIGHT }}>
        <Text size="sm" c="dimmed" mb="xs">Reporter</Text>
        <Text fw={700} style={{ color: PRIMARY_DARK }}>{currentUser?.firstName} {currentUser?.lastName}</Text>
        <Text size="xs" c="dimmed">{currentUser?.email}</Text>
      </Card>
      <Card withBorder padding="lg" radius="md" bg={getBg(colorScheme, 'white', theme.colors.dark[7])} style={{ borderColor: PRIMARY_LIGHT }}>
        <Text size="sm" c="dimmed" mb="xs">Report Status</Text>
        <Badge color="green" variant="light" size="lg" style={{ background: getBg(colorScheme, '#d4edda', theme.colors.dark[5]), color: getBg(colorScheme, '#155724', theme.colors.green[3]), fontWeight: 700 }}>
          Ready to Submit
        </Badge>
      </Card>
    </SimpleGrid>
    <Card withBorder padding="lg" radius="md" mb="xl" bg={getBg(colorScheme, 'white', theme.colors.dark[7])} style={{ borderColor: '#40c057', borderWidth: 2, boxShadow: '0 4px 20px rgba(64, 192, 87, 0.1)' }}>
      <Flex align="center" gap="md">
        <IconCheck color="#40c057" size={24} />
        <Box style={{ flex: 1 }}>
          <Text fw={700} style={{ color: getBg(colorScheme, '#155724', theme.colors.green[3]) }}>Final Confirmation</Text>
          <Text size="sm" c="dimmed">I confirm that all information provided is accurate to the best of my knowledge</Text>
        </Box>
        <Checkbox size="lg" color="green" defaultChecked styles={{ input: { borderColor: '#40c057', backgroundColor: getBg(colorScheme, 'white', theme.colors.dark[7]), ':checked': { backgroundColor: '#40c057', borderColor: '#40c057' } } }} />
      </Flex>
    </Card>
    <Button
      type="submit"
      size="lg"
      radius="xl"
      loading={isSubmitting}
      disabled={isSubmitting}
      fullWidth
      style={{
        background: isSubmitting ? PRIMARY_COLOR : PRIMARY_GRADIENT,
        border: 'none',
        boxShadow: `0 8px 30px ${PRIMARY_COLOR}40`,
        transition: 'all 0.3s ease',
        height: '60px',
        fontSize: '18px',
        fontWeight: 800,
        letterSpacing: '0.5px',
      }}
      rightSection={!isSubmitting && (
        <Box style={{ background: 'rgba(255, 255, 255, 0.2)', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconArrowRight size={22} />
        </Box>
      )}
    >
      {isSubmitting ? (
        <Flex align="center" justify="center" gap="sm">
          <Loader size="sm" color="white" />
          <span>Submitting Your Report...</span>
        </Flex>
      ) : (
        <Flex align="center" justify="center" gap="sm">
          <IconShieldCheck size={22} />
          <span>SUBMIT REPORT NOW</span>
        </Flex>
      )}
    </Button>
    <Text size="xs" c="dimmed" ta="center" mt="md">
      <IconLock size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
      Your submission is secure and encrypted
    </Text>
  </Card>
);