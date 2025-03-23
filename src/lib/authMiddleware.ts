import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyJwt } from "./utils";

export async function getUserFromRequest(req: NextRequest) {
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

    const token = authHeader.split(" ")[1];
    const decoded = verifyJwt(token);
    if (!decoded) return null;

    const { id } = decoded; 

    const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !user) return null;

    return user;
}