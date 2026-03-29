ALTER TABLE public.system_metrics_history
  ADD COLUMN IF NOT EXISTS rest_requests bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS auth_requests bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS realtime_requests bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS storage_requests bigint DEFAULT 0;