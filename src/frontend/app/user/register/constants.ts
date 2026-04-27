// JSON Server URLs
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
export const MISSING_PERSONS_API = `${API_BASE_URL}/missingPersons`;
export const MISSING_VEHICLES_API = `${API_BASE_URL}/missingVehicles`;
export const USERS_API = `${API_BASE_URL}/users`;

// Theme constants
export const PRIMARY_COLOR = '#0034D1';
export const PRIMARY_LIGHT = '#4d79ff';
export const PRIMARY_DARK = '#0029a8';
export const PRIMARY_GRADIENT = `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, #0066ff 100%)`;

// Dropdown options
export const colorOptions = [
  'White', 'Black', 'Silver', 'Gray', 'Red', 'Blue', 'Green', 'Yellow',
  'Orange', 'Brown', 'Gold', 'Beige', 'Maroon', 'Purple', 'Pink'
];

export const regionOptions = [
  'Addis Ababa', 'Afar', 'Amhara', 'Benishangul-Gumuz', 'Dire Dawa',
  'Gambela', 'Harari', 'Oromia', 'Sidama', 'Somali',
  'Southern Nations, Nationalities, and Peoples', 'South West Ethiopia',
  'Tigray'
];