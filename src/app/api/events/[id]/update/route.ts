import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/authMiddleware";
import { sendEventEmail } from "@/lib/email";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const { id } = params;
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { title, description, location, date } = body;

    const { data: existing, error: fetchError } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();

    if (!existing || fetchError) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (existing.created_by !== user.id) {
        return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const { data: updatedEvent, error } = await supabase
        .from("events")
        .update({
            title,
            description,
            location,
            date,
            updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

    if (error) throw error;

    // 🔍 Identify updated fields
    const updatedFields: string[] = [];
    if (existing.title !== title) updatedFields.push("title");
    if (existing.description !== description) updatedFields.push("description");
    if (existing.location !== location) updatedFields.push("location");
    if (existing.date !== date) updatedFields.push("date");

    // 📩 Get RSVP'd users' emails
    const { data: rsvps } = await supabase
        .from("rsvps")
        .select("user_id, users(email)")
        .eq("event_id", id);

    // Type assertion to help TypeScript understand the structure
    type RsvpUser = { users: { email: string } | { email: string }[] | null };
    
    const emails = ((rsvps as RsvpUser[]) || [])
        .map((r) => {
            // Handle the case where users is an array
            if (r.users && Array.isArray(r.users)) {
                return r.users.length > 0 ? r.users[0].email : null;
            }
            // Handle the case where users might be a single object
            return r.users ? (r.users as { email: string }).email : null;
        })
        .filter((e): e is string => Boolean(e));

    // 📬 Send update notification email
    if (emails.length > 0 && updatedFields.length > 0) {
        await sendEventEmail({
            event: updatedEvent,
            recipients: emails,
            type: "update",
            updatedFields,
            updatedBy: user.full_name || "Event Organizer",
        });
    }

    return NextResponse.json({ message: "Event updated", event: updatedEvent });
}