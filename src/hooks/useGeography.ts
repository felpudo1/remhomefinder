import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook centralizado para obtener datos geográficos con caché agresivo.
 * Estos datos rara vez cambian, por lo que usamos un staleTime de 1 hora.
 * Esto evita sequential scans repetitivos en la base de datos.
 */
export function useGeography() {
  const departmentsQuery = useQuery({
    queryKey: ["geography", "departments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data || [];
    },
    staleTime: 60 * 60 * 1000, // 1 hora
  });

  const citiesQuery = useQuery({
    queryKey: ["geography", "cities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cities")
        .select("id, name, department_id")
        .order("name");
      if (error) throw error;
      return data || [];
    },
    staleTime: 60 * 60 * 1000, // 1 hora
  });

  const neighborhoodsQuery = useQuery({
    queryKey: ["geography", "neighborhoods"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("neighborhoods")
        .select("id, name, city_id")
        .order("name");
      if (error) throw error;
      return data || [];
    },
    staleTime: 60 * 60 * 1000, // 1 hora
  });

  return {
    departments: departmentsQuery.data ?? [],
    cities: citiesQuery.data ?? [],
    neighborhoods: neighborhoodsQuery.data ?? [],
    isLoading: 
      departmentsQuery.isLoading || 
      citiesQuery.isLoading || 
      neighborhoodsQuery.isLoading,
    isError:
      departmentsQuery.isError ||
      citiesQuery.isError ||
      neighborhoodsQuery.isError,
  };
}
