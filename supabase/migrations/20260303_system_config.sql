-- Migración: Crear tabla de configuración del sistema
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS system_config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Valor por defecto: solo botón azul (Firecrawl)
INSERT INTO system_config (key, value)
VALUES ('add_button_config', 'blue')
ON CONFLICT (key) DO NOTHING;

-- RLS: Habilitar seguridad por fila
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- ✅ TODOS los usuarios autenticados pueden LEER la config
-- (necesario para que el dashboard de usuarios pueda leer la configuración)
CREATE POLICY "Usuarios autenticados pueden leer system_config"
  ON system_config FOR SELECT
  TO authenticated
  USING (true);

-- 🔒 Solo el admin puede INSERTAR, ACTUALIZAR o ELIMINAR config
CREATE POLICY "Solo admin puede modificar system_config"
  ON system_config FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
