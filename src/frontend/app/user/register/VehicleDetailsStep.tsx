'use client';

import {
  Box, Title, Text, TextInput, Select, Textarea, SimpleGrid,
  Card, FileInput, Flex, Badge, Tooltip, ActionIcon, Alert
} from '@mantine/core';
import {
  IconCar, IconCheck, IconInfoCircle, IconFileDescription,
  IconUpload, IconPhoto, IconX
} from '@tabler/icons-react';
import Image from 'next/image';
import { colorOptions, regionOptions } from './constants';

export const VehicleDetailsStep = ({
  formValues,
  handleInputChange,
  selectedBrand,
  setSelectedBrand,
  selectedModel,
  setSelectedModel,
  selectedSubmodel,
  setSelectedSubmodel,
  brands,
  models,
  submodels,
  ownershipDoc,
  setOwnershipDoc,
  ownershipDocError,
  vehicleImages,
  setVehicleImages,
  completed,
  colorScheme,
  theme,
  PRIMARY_COLOR,
  PRIMARY_GRADIENT,
  PRIMARY_LIGHT,
  PRIMARY_DARK,
  getBg,
  gradientIconBox
}) => {
  const handleImageUpload = (files) => {
    if (!files || files.length === 0) return;
    const newImages = Array.from(files).map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setVehicleImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (indexToRemove) => {
    setVehicleImages(prev => {
      URL.revokeObjectURL(prev[indexToRemove].preview);
      return prev.filter((_, idx) => idx !== indexToRemove);
    });
  };

  return (
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

      {/* License Plate Card */}
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

      {/* Ownership Document Card */}
      <Card withBorder radius="lg" padding="xl" mb="lg" bg={getBg(colorScheme, 'white', theme.colors.dark[7])} style={{ borderColor: PRIMARY_LIGHT, borderWidth: 2 }}>
        <Flex align="center" gap="md" mb="md">
          <Box style={{ background: PRIMARY_GRADIENT, padding: '8px', borderRadius: '8px', color: 'white' }}><IconFileDescription size={20} /></Box>
          <Box>
            <Title order={5} style={{ color: PRIMARY_DARK }}>Ownership Documentation (Optional)</Title>
            <Text c="dimmed" size="sm">Upload proof of ownership (e.g., title, registration)</Text>
          </Box>
        </Flex>
        <FileInput
          name="ownershipDoc"
          placeholder="Choose files..."
          accept="image/jpeg,image/png,image/webp,application/pdf"
          multiple
          onChange={setOwnershipDoc}
          value={ownershipDoc || []}
          radius="md"
          clearable
          leftSection={<IconUpload size={16} color={PRIMARY_COLOR} />}
          description="Accepted formats: JPG, PNG, WebP, PDF (max 10MB each, up to 10 files)"
          variant="filled"
          error={ownershipDocError}
        />
      </Card>

      {/* MULTI‑IMAGE UPLOAD FOR VEHICLE */}
      <Card withBorder radius="lg" padding="xl" bg={getBg(colorScheme, 'white', theme.colors.dark[7])} style={{ borderStyle: 'dashed', borderColor: PRIMARY_LIGHT, borderWidth: 2, transition: 'all 0.2s' }}>
        <FileInput
          label={<Text fw={600} size="sm">Vehicle Photos</Text>}
          description="Upload clear images from multiple angles (front, back, sides, interior, etc.)"
          accept="image/jpeg,image/png,image/webp"
          multiple
          leftSection={<IconPhoto size={16} />}
          onChange={handleImageUpload}
          radius="md"
          variant="filled"
        />

        {vehicleImages.length === 0 && (
          <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light" mt="md" radius="md">
            <Text size="sm">Adding multiple photos greatly improves the chances of identifying the vehicle.</Text>
          </Alert>
        )}

        {vehicleImages.length > 0 && (
          <Box mt="lg">
            <Flex justify="space-between" align="center" mb="sm">
              <Text size="sm" fw={600} c={PRIMARY_DARK}>Vehicle Images ({vehicleImages.length})</Text>
              <Badge color="blue" variant="light" size="sm">{vehicleImages.length} / Unlimited</Badge>
            </Flex>
            <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm">
              {vehicleImages.map((img, idx) => (
                <Box key={idx} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: `2px solid ${PRIMARY_LIGHT}`, aspectRatio: '1/1' }}>
                  <Image src={img.preview} alt={`Vehicle preview ${idx + 1}`} fill style={{ objectFit: 'cover' }} />
                  <ActionIcon color="red" variant="filled" size="md" radius="xl" style={{ position: 'absolute', top: 8, right: 8, zIndex: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }} onClick={() => removeImage(idx)}>
                    <IconX size={16} />
                  </ActionIcon>
                </Box>
              ))}
            </SimpleGrid>
            <Text size="xs" c="dimmed" mt="sm" ta="center">Click the upload button to add more images • Click ✗ to remove</Text>
          </Box>
        )}
      </Card>
    </Card>
  );
};