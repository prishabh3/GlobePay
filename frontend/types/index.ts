export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  statusCode: number;
  timestamp: string;
}

export interface PagedResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
}

export interface AuthResponse {
  userId: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}

export interface UserProfile {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  nationality?: string;
  city?: string;
  country?: string;
  kycStatus: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  currency: string;
  balance: number;
  status: 'ACTIVE' | 'FROZEN' | 'CLOSED';
  createdAt: string;
}

export interface Transaction {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromWalletId: string;
  toWalletId: string;
  amount: number;
  currency: string;
  type: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  description?: string;
  createdAt: string;
}

export interface KycDocument {
  id: string;
  documentType: string;
  documentNumber: string;
  documentUrl: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  createdAt: string;
}

export interface KycStatus {
  userId: string;
  overallStatus: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';
  documents: KycDocument[];
  message: string;
}

export interface Card {
  id: string;
  userId: string;
  maskedNumber: string;
  cardholderName: string;
  expiryDate: string;
  cardType: string;
  currency: string;
  status: 'ACTIVE' | 'FROZEN' | 'CANCELLED';
  spendingLimit?: number;
  createdAt: string;
}

export interface CreditScore {
  userId: string;
  creditScore: number;
  creditLimit: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  scoreBreakdown: string;
  assessedAt: string;
}
