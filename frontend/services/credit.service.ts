import api from '@/lib/api';
import { ApiResponse, CreditScore } from '@/types';

export const creditService = {
  getScore: () => api.get<ApiResponse<CreditScore>>('/api/v1/credit/score'),
  assess: (data: {
    employmentStatus: string;
    annualIncome: number;
    educationLevel?: string;
    visaType?: string;
    university?: string;
  }) => api.post<ApiResponse<CreditScore>>('/api/v1/credit/assess', data),
};
