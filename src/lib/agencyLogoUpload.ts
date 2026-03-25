import { supabase } from "@/integrations/supabase/client";

/**
 * Sube una imagen al bucket agency-logos/{orgId}/... y persiste la URL pública en organizations via RPC.
 */
export async function uploadAgencyLogoAndSave(orgId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${orgId}/${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage.from("agency-logos").upload(path, file, {
    upsert: true,
    contentType: file.type || undefined,
  });
  if (upErr) throw upErr;

  const { data: pub } = supabase.storage.from("agency-logos").getPublicUrl(path);
  const publicUrl = pub.publicUrl;

  const { error: rpcErr } = await supabase.rpc("update_organization_logo_url", {
    _org_id: orgId,
    _logo_url: publicUrl,
  });
  if (rpcErr) throw rpcErr;

  return publicUrl;
}
