import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/authMiddleware";
import { sendEventEmail } from "@/lib/email"; // or sendRsvpConfirmationEmail

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const user = await getUserFromRequest(req);
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const eventId = params.id;

    // Optional: Check if event exists
    const { data: event, error: eventError } = await supabase
        .from("events")
        .select("*") // now selecting full event data for the email
        .eq("id", eventId)
        .single();

    if (!event || eventError) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check if user has already RSVP’d
    const { data: existingRsvp, error: checkError } = await supabase
        .from("rsvps")
        .select("*")
        .eq("user_id", user.id)
        .eq("event_id", eventId)
        .maybeSingle();

    if (checkError) {
        return NextResponse.json({ error: "Failed to check RSVP" }, { status: 500 });
    }

    if (existingRsvp) {
        return NextResponse.json({ message: "You have already RSVP’d to this event." });
    }

    // Create RSVP
    const { error: insertError } = await supabase
        .from("rsvps")
        .insert({
            user_id: user.id,
            event_id: eventId,
        });

    if (insertError) {
        return NextResponse.json({ error: "Failed to RSVP" }, { status: 500 });
    }

    // ✉️ Send RSVP confirmation email
    await sendEventEmail({
        event,
        recipients: [user.email],
        type: "rsvp",
        updatedFields: [],
        updatedBy: event.created_by,
    });

    return NextResponse.json({ message: "RSVP successful! Confirmation email sent." }, { status: 201 });
}