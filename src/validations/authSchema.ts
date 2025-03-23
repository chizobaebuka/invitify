import { z } from "zod";

export const signupSchema = z.object({
    fullName: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    phone: z.string().optional(),
    role: z.enum(["user", "admin"]).default("user"),
});

export const signinSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export const changePasswordSchema = z.object({
    email: z.string().email(),
    oldPassword: z.string().min(6),
    newPassword: z.string().min(6),
});

export const verifyEmailSchema = z.object({
    email: z.string().email(),
    otp_code: z.string().length(6),
});