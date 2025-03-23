// src/app/api/auth/verify-otp/route.ts

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyEmailSchema } from "@/validations/authSchema";
import { sendVerifiedEmail } from "@/lib/email";

export const parseDbTimestampAsUtc = (timestampStr: string): number => {
    return new Date(`${timestampStr} UTC`).getTime();
};

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = verifyEmailSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
        }

        const { email, otp_code } = parsed.data;

        // Fetch user matching email and OTP
        const { data: user, error: fetchError } = await supabase
            .from("users")
            .select("*")
            .eq("email", email)
            .eq("otp_code", otp_code)
            .maybeSingle();

        if (fetchError || !user) {
            return NextResponse.json({ error: "Invalid OTP or email" }, { status: 400 });
        }

        // Check OTP expiry
        const now = Date.now(); // current timestamp in ms
        const otpExpiry = parseDbTimestampAsUtc(user.otp_expires_at); // <- FIXED HERE
        const expired = now >= otpExpiry;

        console.log({
            otp_expires_at: user.otp_expires_at,
            now: new Date(now),
            expired
        });

        if (expired) {
            return NextResponse.json({ error: "OTP expired" }, { status: 400 });
        }

        // Update user: mark verified and clear OTP
        const { error: updateError } = await supabase
            .from("users")
            .update({
                is_verified: true,
                otp_code: null,
                otp_expires_at: null,
                updated_at: new Date().toISOString().replace("T", " ").replace("Z", "")
            })
            .eq("email", email);

        if (updateError) {
            return NextResponse.json({ error: "Failed to update verification status" }, { status: 500 });
        }

        // Optionally send confirmation email
        await sendVerifiedEmail(email, user.full_name || "User");

        return NextResponse.json({ message: "Email verified successfully" }, { status: 200 });

    } catch (error) {
        console.error("Error verifying OTP:", error);
        return NextResponse.json({ error: "Verification failed" }, { status: 500 });
    }
}