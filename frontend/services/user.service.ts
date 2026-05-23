import api from '@/lib/api';
import { ApiResponse, UserProfile, KycStatus, KycDocument, PagedResponse } from '@/types';

export const userService = {
  getProfile: () => api.get<ApiResponse<UserProfile>>('/api/v1/users/me'),
  updateProfile: (data: Partial<UserProfile>) => api.put<ApiResponse<UserProfile>>('/api/v1/users/me', data),
  getKycStatus: () => api.get<ApiResponse<KycStatus>>('/api/v1/kyc/status'),
  uploadDocument: (data: { documentType: string; documentNumber: string; documentUrl: string; expiryDate?: string }) =>
    api.post<ApiResponse<KycDocument>>('/api/v1/kyc/documents', data),
  getAdminUsers: (page = 0, size = 20) =>
    api.get<ApiResponse<PagedResponse<UserProfile>>>(`/api/v1/admin/kyc/users?page=${page}&size=${size}`),
  getPendingKyc: (page = 0, size = 20) =>
    api.get<ApiResponse<PagedResponse<UserProfile>>>(`/api/v1/admin/kyc/pending?page=${page}&size=${size}`),
  reviewKyc: (userId: string, approved: boolean, notes?: string) =>
    api.put(`/api/v1/admin/kyc/${userId}/review`, { approved, notes }),
};
