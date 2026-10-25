import { createClient } from "@supabase/supabase-js";

const TABLE = "entries";
const COLUMNS =
  "id, created_at, requester_name, location, description, priority, status";

let client = null;

// Creates the Supabase client on first use, so a missing variable produces a
// clear error inside the route's try/catch instead of crashing at import.
function getClient() {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY must be set.");
    }
    client = createClient(url, key, { auth: { persistSession: false } });
  }
  return client;
}

// Returns every request, newest first.
export async function getRequests() {
  const { data, error } = await getClient()
    .from(TABLE)
    .select(COLUMNS)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) {
    throw error;
  }
  return data;
}

// Wraps a value in quotes when it contains a comma, quote, or newline, so it
// stays one field when the CSV is opened in a spreadsheet.
export function toCsvField(value) {
  const text = String(value);
  if (/[",\r\n]/.test(text)) {
    return '"' + text.replace(/"/g, '""') + '"';
  }
  return text;
}

// Saves a new request with status "New" and returns it. The database assigns
// the id and created_at.
export async function createRequest({ requester_name, location, description, priority }) {
  const { data, error } = await getClient()
    .from(TABLE)
    .insert({ requester_name, location, description, priority, status: "New" })
    .select(COLUMNS)
    .single();

  if (error) {
    throw error;
  }
  return data;
}

// Sets the status of the request with the given id. Returns the updated
// request, or null if no request has that id.
export async function updateRequestStatus(id, status) {
  const { data, error } = await getClient()
    .from(TABLE)
    .update({ status })
    .eq("id", id)
    .select(COLUMNS)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return data;
}
