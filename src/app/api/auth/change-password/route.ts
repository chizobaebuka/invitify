import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { changePasswordSchema } from "@/validations/authSchema";
import { hashPassword, verifyPassword } from "@/lib/utils";
import { sendPasswordChangeEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = changePasswordSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error }, { status: 400 });
        }

        const { email, oldPassword, newPassword } = parsed.data;

        const { data: user } = await supabase
            .from("users")
            .select("*")
            .eq("email", email)
            .maybeSingle();

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const isOldPasswordCorrect = await verifyPassword(user.hashed_password, oldPassword);
        if (!isOldPasswordCorrect) {
            return NextResponse.json({ error: "Incorrect old password" }, { status: 400 });
        }

        const newHashedPassword = await hashPassword(newPassword);

        const { error } = await supabase
            .from("users")
            .update({ hashed_password: newHashedPassword })
            .eq("email", email);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        await sendPasswordChangeEmail(email, newPassword);

        return NextResponse.json({ message: "Password changed successfully" });
    } catch (error) {
        console.log(`Error changing password... ${error}`)
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}