-- Table to store periodic Disk IO Budget snapshots for trend analysis
CREATE TABLE IF NOT EXISTS public.system_metrics_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  disk_io_budget numeric,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_metrics_history_recorded_at 
  ON public.system_metrics_history (recorded_at DESC);

ALTER TABLE public.system_metrics_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sysadmins can manage metrics history"
  ON public.system_metrics_history
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'sysadmin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'sysadmin'::app_role));