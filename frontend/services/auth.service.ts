import api from '@/lib/api';
import { ApiResponse, AuthResponse } from '@/types';

export const authService = {
  register: (data: { email: string; password: string; firstName: string; lastName: string }) =>
    api.post<ApiResponse<AuthResponse>>('/api/v1/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<AuthResponse>>('/api/v1/auth/login', data),

  logout: (refreshToken: string) =>
    api.post('/api/v1/auth/logout', { refreshToken }),
};
