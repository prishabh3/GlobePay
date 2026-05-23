import api from '@/lib/api';
import { ApiResponse, Card } from '@/types';

export const cardService = {
  getCards: () => api.get<ApiResponse<Card[]>>('/api/v1/cards'),
  issueCard: (data: { cardholderName: string; currency?: string; spendingLimit?: number }) =>
    api.post<ApiResponse<Card>>('/api/v1/cards', data),
  freezeCard: (cardId: string) => api.post<ApiResponse<Card>>(`/api/v1/cards/${cardId}/freeze`),
  unfreezeCard: (cardId: string) => api.post<ApiResponse<Card>>(`/api/v1/cards/${cardId}/unfreeze`),
  cancelCard: (cardId: string) => api.delete(`/api/v1/cards/${cardId}`),
};
