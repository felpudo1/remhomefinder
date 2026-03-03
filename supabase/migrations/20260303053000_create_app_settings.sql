-- Migración: Crear tabla app_settings para configuraciones de la aplicación
-- Esta tabla permite a los admins modificar configuraciones dinámicamente
-- sin necesidad de redesplegar código.

create table if not exists public.app_settings (
  key text primary key,         -- Nombre único de la configuración (ej: "scraper_system_prompt")
  value text not null,          -- Valor de la configuración (texto libre)
  description text,             -- Descripción amigable del propósito
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id)
);

-- Solo los admins pueden leer y escribir en esta tabla
alter table public.app_settings enable row level security;

-- Los admins pueden leer todas las configuraciones
create policy "Admins can read app_settings"
  on public.app_settings for select
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- Los admins pueden insertar y actualizar configuraciones
create policy "Admins can upsert app_settings"
  on public.app_settings for all
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- La Edge Function (service_role) puede leer las configuraciones sin restricción
-- Esto lo permite el service_role key de Supabase automáticamente (bypass RLS)

-- Insertar el prompt por defecto del scraper
insert into public.app_settings (key, value, description)
values (
  'scraper_system_prompt',
  'Sos un asistente que extrae datos de avisos inmobiliarios de Uruguay y Argentina. 
Analizá el contenido del aviso y extraé los datos de la propiedad.
- Para moneda: usá "UYU" para pesos uruguayos, "ARS" para pesos argentinos, "USD" para dólares. Detectá la moneda según el sitio y el país (ej: mercadolibre.com.uy → UYU, infocasas.com.uy → UYU).
- Para el barrio: extraé el barrio o zona mencionada.
- Para el resumen: hacé un resumen breve de 1-2 oraciones destacando lo más importante del aviso.
- Si un dato no está disponible, dejalo vacío o en 0.',
  'Instrucción del sistema para la IA que extrae datos de avisos inmobiliarios.'
)
on conflict (key) do nothing;
