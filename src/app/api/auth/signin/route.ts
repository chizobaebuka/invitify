import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { signinSchema } from "@/validations/authSchema";
import { generateToken, verifyPassword } from "@/lib/utils";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = signinSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
        }

        const { email, password } = parsed.data;

        const { data: user, error: fetchError } = await supabase
            .from("users")
            .select("*")
            .eq("email", email)
            .maybeSingle();

        if (fetchError || !user) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        const isValid = await verifyPassword(user.hashed_password, password);
        if (!isValid) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        if (!user.is_verified) {
            return NextResponse.json({ error: "Email not verified" }, { status: 403 });
        }

        const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role,
        });

        return NextResponse.json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                fullName: user.full_name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Error signing in:", error);
        return NextResponse.json({ error: "Signin failed" }, { status: 500 });
    }
}