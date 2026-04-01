export interface AuthResponse {
  token: string;
  user: {
    id: number;
    login: string;
    role?: string; // optional if you want
  };
}
