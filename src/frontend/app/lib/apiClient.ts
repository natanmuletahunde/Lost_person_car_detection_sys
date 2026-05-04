let isRefreshing = false;
let failedQueue: any[] = [];
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token);
  });
  failedQueue = [];
};

export const apiClient = async (url: string, options: RequestInit = {}) => {
  const getToken = () => localStorage.getItem('accessToken') || localStorage.getItem('token');
  const getRefreshToken = () => localStorage.getItem('refreshToken');

  const request = async (token: string | null) => {
    const headers = new Headers(options.headers);

    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (!(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    return fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });
  };

  let token = getToken();
  let response = await request(token);

  if (response.status === 401) {
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((t) => request(t));
    }

    isRefreshing = true;

    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const res = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ refreshToken }),
      });

      const data = await res.json();
      if (!res.ok || !data?.data) {
        throw new Error(data?.message || 'Failed to refresh token');
      }

      const newAccessToken = data.data.accessToken || data.data.token;
      const newRefreshToken = data.data.refreshToken;

      if (!newAccessToken) {
        throw new Error('Refresh endpoint did not return access token');
      }

      localStorage.setItem('accessToken', newAccessToken);
      localStorage.setItem('token', newAccessToken);
      if (newRefreshToken) {
        localStorage.setItem('refreshToken', newRefreshToken);
      }

      processQueue(null, newAccessToken);
      isRefreshing = false;

      return request(newAccessToken);
    } catch (err) {
      processQueue(err, null);
      isRefreshing = false;

      localStorage.removeItem('accessToken');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('currentUser');
      window.location.href = '/authentication/login';
      throw err;
    }
  }

  return response;
};