import { useCallback, useEffect, useRef, useState } from "react";
import type { UserProfile } from "./adminUsuariosTypes";

export const PROFILE_SERVER_SORT_KEYS = [
  "display_name",
  "status",
  "created_at",
  "email",
  "plan_type",
  "phone",
  "user_id",
] as const;

export type ProfileServerSortKey = (typeof PROFILE_SERVER_SORT_KEYS)[number];

/**
 * Define si una columna puede ordenarse en servidor.
 */
export function isServerSortableKey(key: keyof UserProfile): key is ProfileServerSortKey {
  return (PROFILE_SERVER_SORT_KEYS as readonly string[]).includes(key as string);
}

/**
 * Orden en memoria solo para la página cargada.
 */
function compareUsersClientPage(
  a: UserProfile,
  b: UserProfile,
  key: keyof UserProfile,
  direction: "asc" | "desc"
): number {
  const multiplier = direction === "asc" ? 1 : -1;

  if (key === "roles") {
    const aRoles = [...a.roles].sort().join(",");
    const bRoles = [...b.roles].sort().join(",");
    if (aRoles < bRoles) return -1 * multiplier;
    if (aRoles > bRoles) return 1 * multiplier;
    return 0;
  }

  if (key === "personal_count" || key === "referral_count" || key === "saved_count") {
    const aValue = Number(a[key]);
    const bValue = Number(b[key]);
    if (aValue < bValue) return -1 * multiplier;
    if (aValue > bValue) return 1 * multiplier;
    return 0;
  }

  return 0;
}

/**
 * Encapsula paginación, búsqueda y estrategia híbrida de orden servidor/cliente.
 */
export function useAdminUsuariosTableController() {
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof UserProfile;
    direction: "asc" | "desc";
  }>({
    key: "display_name",
    direction: "asc",
  });

  const serverFetchSnapshot = useRef<{ key: ProfileServerSortKey; asc: boolean }>({
    key: "display_name",
    asc: true,
  });

  useEffect(() => {
    if (isServerSortableKey(sortConfig.key)) {
      serverFetchSnapshot.current = {
        key: sortConfig.key,
        asc: sortConfig.direction === "asc",
      };
    }
  }, [sortConfig]);

  const serverOrderKey: ProfileServerSortKey = isServerSortableKey(sortConfig.key)
    ? sortConfig.key
    : serverFetchSnapshot.current.key;

  const serverOrderAsc = isServerSortableKey(sortConfig.key)
    ? sortConfig.direction === "asc"
    : serverFetchSnapshot.current.asc;

  const getFilteredUsers = useCallback((users: UserProfile[]) => {
    const sortedUsers = isServerSortableKey(sortConfig.key)
      ? users
      : [...users].sort((a, b) => compareUsersClientPage(a, b, sortConfig.key, sortConfig.direction));

    if (!searchQuery.trim()) return sortedUsers;

    const query = searchQuery.toLowerCase().trim();
    return sortedUsers.filter(
      (user) =>
        user.display_name.toLowerCase().includes(query) ||
        (user.email && user.email.toLowerCase().includes(query))
    );
  }, [searchQuery, sortConfig]);

  const handleSort = useCallback((key: keyof UserProfile) => {
    setSortConfig((previous) => ({
      key,
      direction: previous.key === key && previous.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  return {
    page,
    setPage,
    searchQuery,
    setSearchQuery,
    sortConfig,
    getFilteredUsers,
    serverOrderKey,
    serverOrderAsc,
    handleSort,
  };
}
