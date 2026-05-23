import api from '@/lib/api';
import { ApiResponse, Transaction, PagedResponse } from '@/types';

export const transactionService = {
  transfer: (data: {
    idempotencyKey: string;
    fromWalletId: string;
    toWalletId: string;
    toUserId: string;
    amount: number;
    currency: string;
    description?: string;
  }) => api.post<ApiResponse<Transaction>>('/api/v1/transactions/transfer', data),

  getHistory: (page = 0, size = 20) =>
    api.get<ApiResponse<PagedResponse<Transaction>>>(`/api/v1/transactions/history?page=${page}&size=${size}`),

  getTransaction: (id: string) =>
    api.get<ApiResponse<Transaction>>(`/api/v1/transactions/${id}`),
};
