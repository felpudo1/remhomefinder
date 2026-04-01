
-- Tabla de suscripciones para agentes (pagos recurrentes MercadoPago)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  mp_preapproval_id text UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  plan_interval text NOT NULL DEFAULT 'monthly',
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_interval CHECK (plan_interval IN ('monthly', 'yearly')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'authorized', 'paused', 'cancelled'))
);

-- RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Admins can manage all subscriptions
CREATE POLICY "Admins can manage subscriptions"
  ON public.subscriptions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role inserts/updates via webhook (no RLS bypass needed since webhook uses service role key)

-- Trigger to auto-update updated_at
CREATE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
