import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendEventNotificationEmail } from "@/lib/email";
import { getUserFromRequest } from "@/lib/authMiddleware";

export async function POST(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        console.log({ user })
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { title, description, location, date } = body;

        if (!title || !date) {
            return NextResponse.json({ error: "Title and date are required" }, { status: 400 });
        }

        const { data: event, error } = await supabase
            .from("events")
            .insert([{ title, description, location, date, created_by: user.id }])
            .select()
            .single();

        if (error) throw error;

        // Notify all users via email
        await sendEventNotificationEmail(event);

        return NextResponse.json({ message: "Event created", event });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
    }
}