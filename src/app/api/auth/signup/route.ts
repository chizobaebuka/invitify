// src/app/api/auth/signup/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { signupSchema } from "@/validations/authSchema";
import { generateOtp, generateOtpExpiry, hashPassword } from "@/lib/utils";
import { sendOtpEmail } from "@/lib/email";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsed = signupSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.errors },
                { status: 400 }
            );
        }

        const { fullName, email, password, phone, role } = parsed.data;

        // Check if email already exists
        const { data: existingUser } = await supabase
            .from("users")
            .select("id")
            .eq("email", email)
            .single();

        if (existingUser) {
            return NextResponse.json(
                { error: "Email already in use" },
                { status: 409 }
            );
        }

        const hashedPassword = await hashPassword(password);
        const otp = generateOtp();
        const otpExipry = generateOtpExpiry(20)

        // Insert user into DB
        const { data: insertedUser, error: insertError } = await supabase
            .from("users")
            .insert({
                full_name: fullName,
                email,
                hashed_password: hashedPassword,
                phone,
                role,
                is_verified: false,
                otp_code: otp,
                otp_expires_at: otpExipry
            })
            .select("*") // 👈 fetch the inserted user immediately
            .single();


        if (insertError) {
            return NextResponse.json(
                { error: insertError.message },
                { status: 500 }
            );
        }

        await sendOtpEmail(email, otp);

        return NextResponse.json(
            {
                message: "User registered successfully",
                user: {
                    id: insertedUser.id,
                    full_name: insertedUser.full_name,
                    email: insertedUser.email,
                    phone: insertedUser.phone,
                    role: insertedUser.role,
                    is_verified: insertedUser.is_verified,
                    created_at: insertedUser.created_at
                }
            },
            { status: 201 }
        );
    } catch (err) {
        console.error("Signup error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}