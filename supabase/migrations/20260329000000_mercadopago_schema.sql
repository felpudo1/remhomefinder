-- Phase: Mercado Pago Integration
-- Description: Create payments and subscriptions tables

-- 1. Create Subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL, -- e.g., 'monthly', 'annual'
    status TEXT NOT NULL DEFAULT 'inactive', -- 'active', 'inactive', 'cancelled', 'expired'
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Payments table (Audit Trail)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    amount NUMERIC(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'pending', -- 'approved', 'pending', 'rejected', 'in_process'
    mp_preference_id TEXT,
    mp_payment_id TEXT,
    payment_method TEXT,
    payer_email TEXT,
    external_reference TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Update Profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS mp_customer_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES public.subscriptions(id);

-- 4. Set search path and permissions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Users can see their own subscriptions
CREATE POLICY "Users can view own subscriptions"
    ON public.subscriptions FOR SELECT
    USING (auth.uid() = user_id);

-- Users can see their own payments
CREATE POLICY "Users can view own payments"
    ON public.payments FOR SELECT
    USING (auth.uid() = user_id);

-- Trigger for updated_at on subscriptions
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Comments
COMMENT ON TABLE public.payments IS 'Historial de transacciones de Mercado Pago';
COMMENT ON TABLE public.subscriptions IS 'Estado actual de la membresía del usuario';
