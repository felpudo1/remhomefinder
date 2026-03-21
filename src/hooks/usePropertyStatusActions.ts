import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Property } from "@/types/property";
import { buildGoogleCalendarUrl } from "@/lib/date-utils";

/**
 * Hook especializado para gestionar las acciones y lógica de negocio relacionadas 
 * con el estado de una propiedad (ej: integraciones de calendario, emails de grupo).
 */
export function usePropertyStatusActions(property: Property, ownerEmail?: string | null) {
  const [familyMemberEmails, setFamilyMemberEmails] = useState<string[]>([]);

  const groupId = property.groupId || null;
  const propertyId = property.id;

  useEffect(() => {
    const loadFamilyEmails = async () => {
      if (!groupId) {
        setFamilyMemberEmails([]);
        return;
      }

      const { data: members, error: membersError } = await supabase
        .from("organization_members")
        .select("user_id")
        .eq("org_id", groupId)
        .eq("is_active", true);

      if (membersError || !members || members.length === 0) {
        setFamilyMemberEmails([]);
        return;
      }

      const userIds = Array.from(new Set(members.map((m) => m.user_id).filter(Boolean)));

      if (userIds.length === 0) {
        setFamilyMemberEmails([]);
        return;
      }

      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, email")
        .in("user_id", userIds);

      if (profilesError || !profilesData) {
        setFamilyMemberEmails([]);
        return;
      }

      setFamilyMemberEmails(
        profilesData
          .map((p) => p.email || "")
          .filter((email) => email.includes("@"))
      );
    };

    loadFamilyEmails();
  }, [groupId, propertyId]);

  /** 
   * Abre la entrada de Google Calendar con los datos de la propiedad 
   * e invita automáticamente a los miembros del grupo.
   */
  const openVisitCalendarEntry = (visitDate: Date) => {
    const location = [property.neighborhood, property.city].filter(Boolean).join(", ") || undefined;
    const contactName = property.marketplaceAgentName || ownerEmail || property.createdByEmail || "Sin nombre";
    
    const attendees = Array.from(
      new Set(
        familyMemberEmails
          .map((email) => email.trim())
          .filter((email) => email.includes("@"))
      )
    );

    const url = buildGoogleCalendarUrl(
      `Visita: ${property.title}. Contacto ${contactName}`,
      visitDate,
      property.url ? `Publicación: ${property.url}` : undefined,
      location,
      attendees
    );
    
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return {
    familyMemberEmails,
    openVisitCalendarEntry,
  };
}
