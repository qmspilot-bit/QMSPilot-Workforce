import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const adapterCorsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,PATCH,OPTIONS",
  "access-control-allow-headers": "authorization,content-type,x-northstar-adapter-key",
};

function nestedToken(body: unknown) {
  if (!body || typeof body !== "object") return "";
  const value = body as Record<string, unknown>;
  const record = value.record && typeof value.record === "object" ? value.record as Record<string, unknown> : {};
  const security = value.security && typeof value.security === "object" ? value.security as Record<string, unknown> : {};
  return String(
    value.northstarToken
    || value.accessToken
    || record.northstarToken
    || record.accessToken
    || security.token
    || security.accessToken
    || "",
  ).trim();
}

export function tokenFromRequest(request: Request, body?: unknown) {
  const authorization = request.headers.get("authorization") || "";
  if (authorization.toLowerCase().startsWith("bearer ")) return authorization.slice(7).trim();
  return nestedToken(body);
}

export async function resolveNorthstarUser(request: Request, body?: unknown) {
  if (!supabaseUrl || !supabaseKey) throw new Error("Northstar Secure is not configured.");
  const token = tokenFromRequest(request, body);
  if (!token) throw new Error("A signed-in Northstar session is required.");

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) throw new Error("The Northstar session is invalid or expired.");

  const { data: membership, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userData.user.id)
    .limit(1)
    .maybeSingle();
  if (membershipError) throw membershipError;
  if (!membership?.organization_id) throw new Error("No Northstar organization is assigned to this user.");

  const { data: organization, error: organizationError } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", membership.organization_id)
    .single();
  if (organizationError) throw organizationError;

  return {
    supabase,
    token,
    user: userData.user,
    organizationId: membership.organization_id as string,
    organizationName: String(organization.name || ""),
  };
}
