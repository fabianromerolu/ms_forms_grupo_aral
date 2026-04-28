// src/types/auth-request.type.ts
export interface AuthRequest {
  user?: {
    id: string;
    role: string;
    regional?: string | null;
  };
}
