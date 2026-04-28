export interface AuthRequest {
    user?: {
        id: string;
        role: string;
        regional?: string | null;
    };
}
