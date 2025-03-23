import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import argon2 from "argon2";
import jwt from "jsonwebtoken";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const hashPassword = async (password: string) => {
  return await argon2.hash(password);
};

export const verifyPassword = async (hash: string, plain: string) => {
  return await argon2.verify(hash, plain);
};

export const generateOtp = (length = 6): string => {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

export const generateOtpExpiry = (minutes = 10): string => {
  const now = new Date();
  const expiry = new Date(now.getTime() + minutes * 60 * 1000);
  return expiry.toISOString().replace("T", " ").replace("Z", ""); 
};

interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

export const generateToken = (payload: JwtPayload) => {
  const secret = process.env.JWT_SECRET!;
  const expiresIn = "3h";

  return jwt.sign(payload, secret, { expiresIn });
};

export function signJwt(userId: string): string {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: "7d" });
}

export function verifyJwt(token: string): { id: string } | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
  } catch (error) {
    console.error("Error verifying JWT:", error);
    return null;
  }
}