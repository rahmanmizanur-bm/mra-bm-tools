// Paste data access via Supabase. Row-Level Security enforces who can read what;
// this module just issues the queries. No custom backend.
import { getUser } from "./auth";
import { supabase } from "./supabase";

export type Visibility = "public" | "webalive" | "private";

export interface PasteCreate {
  content: string;
  title?: string | null;
  language?: string;
  visibility: Visibility;
  expires_in_days: number;
}

export interface Paste {
  id: string;
  title: string | null;
  language: string;
  content: string;
  visibility: Visibility;
  owner_email: string;
  created_at: string;
  expires_at: string;
  is_owner: boolean;
}

export interface PasteListItem {
  id: string;
  title: string | null;
  language: string;
  visibility: Visibility;
  created_at: string;
  expires_at: string;
}

export interface CreatedPaste {
  id: string;
  visibility: Visibility;
  expires_at: string;
}

const MAX_DAYS = 30;

// URL-safe short id, generated client-side (no extra dependency).
function shortId(len = 10): string {
  const alphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

export async function createPaste(body: PasteCreate): Promise<CreatedPaste> {
  const user = getUser();
  if (!user) throw new Error("Please sign in first");

  const days = Math.max(1, Math.min(body.expires_in_days, MAX_DAYS));
  const now = new Date();
  const expiresAt = new Date(now.getTime() + days * 86_400_000);

  const row = {
    id: shortId(),
    title: body.title?.trim() || null,
    language: body.language || "plaintext",
    content: body.content,
    visibility: body.visibility,
    owner_email: user.email,
    created_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
  };

  const { data, error } = await supabase().from("pastes").insert(row).select("id, visibility, expires_at").single();
  if (error) throw new Error(error.message);
  return data as CreatedPaste;
}

/** Returns the paste, or null if it doesn't exist / isn't visible to this viewer. */
export async function getPaste(id: string): Promise<Paste | null> {
  const { data, error } = await supabase()
    .from("pastes")
    .select("id, title, language, content, visibility, owner_email, created_at, expires_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  const user = getUser();
  return { ...(data as Omit<Paste, "is_owner">), is_owner: !!user && user.email === data.owner_email };
}

export async function listMyPastes(): Promise<PasteListItem[]> {
  const { data, error } = await supabase()
    .from("pastes")
    .select("id, title, language, visibility, created_at, expires_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as PasteListItem[];
}

export async function deletePaste(id: string): Promise<void> {
  const { error } = await supabase().from("pastes").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
