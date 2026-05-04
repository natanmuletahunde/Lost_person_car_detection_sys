// src/frontend/app/lib/missingPerson.api.ts
import { apiClient } from './apiClient';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

const MISSING_PERSONS_URL = `${API_BASE_URL}/missing-persons`;
const MISSING_VEHICLES_URL = `${API_BASE_URL}/missing-vehicles`;

/**
 * Unified function to create Missing Person, Vehicle or Special Case Report
 */
export const createReport = async ({
  type,
  data,
  images = [],
  ownershipDocument,
  doctorReport,
  criminalRecord,
}: {
  type: 'Person' | 'Vehicle' | 'Special';
  data: Record<string, any>;
  images: File[];
  ownershipDocument?: File | null;
  doctorReport?: File | null;
  criminalRecord?: File | null;
}) => {
  const url = type === 'Vehicle' ? MISSING_VEHICLES_URL : MISSING_PERSONS_URL;

  const formData = new FormData();

  // Append all data fields
  Object.entries(data).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      // FormData cannot carry nested objects directly.
      if (typeof value === 'object' && !(value instanceof File)) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value as any);
      }
    }
  });

  // Append images. UI stores images as either File or { file, preview }.
  images.forEach((image: any) => {
    const actualFile = image instanceof File ? image : image?.file;
    if (actualFile instanceof File) {
      formData.append('images', actualFile);
    }
  });

  // Append additional documents
  if (ownershipDocument) formData.append('ownershipDocument', ownershipDocument);
  if (doctorReport) formData.append('doctorReport', doctorReport);
  if (criminalRecord) formData.append('criminalRecord', criminalRecord);

  const response = await apiClient(url, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to submit ${type} report`);
  }

  return response.json();
};

/**
 * Get All Missing Persons
 */
export const getMissingPersons = async () => {
  const response = await fetch(MISSING_PERSONS_URL);

  if (!response.ok) {
    throw new Error('Failed to fetch missing persons');
  }
  return response.json();
};

/**
 * Get Single Missing Person by ID
 */
export const getMissingPersonById = async (id: string) => {
  const response = await fetch(`${MISSING_PERSONS_URL}/${id}`);

  if (!response.ok) {
    throw new Error('Failed to fetch missing person details');
  }
  return response.json();
};

/**
 * Update Missing Person
 */
export const updateMissingPerson = async (id: string, data: Record<string, any>) => {
  const response = await apiClient(`${MISSING_PERSONS_URL}/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update record');
  }

  return response.json();
};