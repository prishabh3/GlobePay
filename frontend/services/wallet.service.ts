import api from '@/lib/api';
import { ApiResponse, Wallet } from '@/types';

export const walletService = {
  getWallets: () => api.get<ApiResponse<Wallet[]>>('/api/v1/wallets'),
  createWallet: (currency: string) => api.post<ApiResponse<Wallet>>('/api/v1/wallets', { currency }),
  convertCurrency: (fromCurrency: string, toCurrency: string, amount: number) =>
    api.post('/api/v1/wallets/convert', { fromCurrency, toCurrency, amount }),
};
