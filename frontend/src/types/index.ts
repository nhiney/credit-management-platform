export type Role = 'USER' | 'ADMIN';
export type TransactionType = 'CREDIT_IN' | 'CREDIT_OUT';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED';
export type UserPackageStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

export interface User {
  id: string;
  email: string;
  role: Role;
  currentCredits: number;
  createdAt: string;
  userPackages?: UserPackage[];
}

export interface Feature {
  id: string;
  codeName: string;
  description: string | null;
  creditCost: number;
}

export interface Package {
  id: string;
  name: string;
  description: string | null;
  price: string;
  creditAmount: number;
  isActive: boolean;
  packageFeatures: { feature: Feature }[];
}

export interface UserPackage {
  id: string;
  status: UserPackageStatus;
  purchasedAt: string;
  package: Package;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  transactionType: TransactionType;
  status: TransactionStatus;
  description: string | null;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
  package?: { id: string; name: string } | null;
  feature?: { id: string; codeName: string } | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface AdminTransaction extends Transaction {
  user?: { id: string; email: string };
}

export interface GenerateImageResult {
  success: boolean;
  prompt: string;
  imageUrl: string;
  model: string;
  generatedAt: string;
}

export interface AutoPostResult {
  success: boolean;
  postId: string;
  content: string;
  scheduledAt: string;
  platforms: string[];
}

export interface AnalyzeDataResult {
  success: boolean;
  summary: string;
  insights: string[];
  sentiment: string;
  confidence: number;
  analyzedAt: string;
}
