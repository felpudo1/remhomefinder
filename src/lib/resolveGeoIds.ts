import { supabase } from "@/integrations/supabase/client";

/**
 * Resuelve IDs geográficos a partir de texto (department, city, neighborhood).
 * Útil después del scraping para poblar los selectors cascadeados.
 */
export async function resolveGeoIds(geo: {
  department?: string;
  city?: string;
  neighborhood?: string;
}): Promise<{
  department_id: string;
  department: string;
  city_id: string;
  city: string;
  neighborhood_id: string;
  neighborhood: string;
}> {
  const result = {
    department_id: "",
    department: geo.department || "",
    city_id: "",
    city: geo.city || "",
    neighborhood_id: "",
    neighborhood: geo.neighborhood || "",
  };

  if (!geo.department && !geo.city && !geo.neighborhood) return result;

  // 1. Resolver departamento
  // Si no hay departamento pero hay ciudad, intentar buscar la ciudad directamente
  let deptId: string | null = null;

  if (geo.department) {
    const { data: depts } = await supabase
      .from("departments")
      .select("id, name")
      .ilike("name", geo.department)
      .limit(1);
    if (depts && depts.length > 0) {
      deptId = depts[0].id;
      result.department_id = depts[0].id;
      result.department = depts[0].name;
    }
  }

  // 2. Resolver ciudad
  if (geo.city) {
    let cityQuery = supabase
      .from("cities")
      .select("id, name, department_id")
      .ilike("name", geo.city);

    if (deptId) {
      cityQuery = cityQuery.eq("department_id", deptId);
    }

    const { data: cities } = await cityQuery.limit(1);
    if (cities && cities.length > 0) {
      result.city_id = cities[0].id;
      result.city = cities[0].name;
      // Si no teníamos departamento, resolverlo desde la ciudad
      if (!deptId && cities[0].department_id) {
        result.department_id = cities[0].department_id;
        const { data: dept } = await supabase
          .from("departments")
          .select("name")
          .eq("id", cities[0].department_id)
          .single();
        if (dept) result.department = dept.name;
      }
    }
  }

  // 3. Resolver barrio
  if (geo.neighborhood && result.city_id) {
    const { data: neighborhoods } = await supabase
      .from("neighborhoods")
      .select("id, name")
      .ilike("name", geo.neighborhood)
      .eq("city_id", result.city_id)
      .limit(1);
    if (neighborhoods && neighborhoods.length > 0) {
      result.neighborhood_id = neighborhoods[0].id;
      result.neighborhood = neighborhoods[0].name;
    }
  }

  return result;
}
