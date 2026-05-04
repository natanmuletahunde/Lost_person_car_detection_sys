import { apiClient } from './apiClient';

export const API_ROOT =
  (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1').replace(/\/api\/v1\/?$/, '') ||
  'http://localhost:5000';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data: T;
  meta?: { page: number; limit: number; total: number; pages: number };
};

export async function adminFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await apiClient(`${API_BASE_URL}${path}`, init);
  const json = (await res.json()) as ApiEnvelope<T> & { message?: string; success?: boolean };
  if (!res.ok || json.success === false) {
    throw new Error(json.message || res.statusText || 'Request failed');
  }
  return json.data as T;
}

export async function adminDelete(path: string) {
  const res = await apiClient(`${API_BASE_URL}${path}`, { method: 'DELETE' });
  const json = (await res.json()) as { success?: boolean; message?: string };
  if (!res.ok || json.success === false) {
    throw new Error(json.message || res.statusText || 'Request failed');
  }
}

export async function adminFetchRaw(path: string, init: RequestInit = {}) {
  const res = await apiClient(`${API_BASE_URL}${path}`, init);
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.message || res.statusText || 'Request failed');
  }
  return json;
}

/** Paginated list endpoints return `{ data: T[], meta }` at top level (sighting controller). */
export async function adminFetchPaginatedList<T>(
  path: string,
  init: RequestInit = {}
): Promise<{ data: T[]; meta: ApiEnvelope<T[]>['meta'] }> {
  const res = await apiClient(`${API_BASE_URL}${path}`, init);
  const json = (await res.json()) as {
    success: boolean;
    message?: string;
    data: T[];
    meta?: ApiEnvelope<unknown>['meta'];
  };
  if (!res.ok || json.success === false) {
    throw new Error(json.message || res.statusText || 'Request failed');
  }
  return { data: json.data || [], meta: json.meta };
}

export function uploadUrl(path: string) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API_ROOT}${path.startsWith('/') ? path : `/${path}`}`;
}
