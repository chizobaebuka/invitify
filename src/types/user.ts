export type UserRole = "user" | "admin";

export interface User {
    id: string;
    full_name: string;
    email: string;
    hashed_password: string;
    phone?: string;
    role: UserRole;
    is_verified: boolean;
    otp_code?: string;
    otp_expires_at?: string;
    created_at: string;
    updated_at: string;
}