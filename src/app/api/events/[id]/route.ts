import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const { id } = params;

    const { data: event, error } = await supabase.from("events").select("*").eq("id", id).single();

    if (error || !event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    return NextResponse.json(event);
}