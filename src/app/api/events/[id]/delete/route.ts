import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/authMiddleware";
import { sendEventEmail } from "@/lib/email";

type RSVPWithUser = {
    user_id: string;
    users: {
        email: string;
    }[];
};

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const { id } = params;
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch event
    const { data: event, error: fetchError } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();

    if (!event || fetchError || event.created_by !== user.id) {
        return NextResponse.json({ error: "Permission denied or event not found" }, { status: 403 });
    }

    // Get RSVP’d users' emails before deleting
    const { data: rsvps } = await supabase
        .from("rsvps")
        .select("user_id, users(email)")
        .eq("event_id", id);

    const emails = ((rsvps || []) as RSVPWithUser[])
        .flatMap((r) => r.users.map(user => user.email))
        .filter(Boolean);
    console.log({ emails })

    // Delete event
    const { error: deleteError } = await supabase.from("events").delete().eq("id", id);
    if (deleteError) return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });

    // Send cancellation email
    if (emails.length > 0) {
        await sendEventEmail({
            event,
            recipients: emails,
            type: "cancel",
            updatedBy: user.full_name || "Event Organizer",
        });
    }

    return NextResponse.json({ message: "Event deleted" });
}