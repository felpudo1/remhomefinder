CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_account_type text;
    v_display_name text;
    v_phone        text;
    v_avatar_url   text;
    v_org_name     text;
    v_org_id       uuid;
    v_role         public.org_role;
BEGIN
    v_account_type := NEW.raw_user_meta_data->>'account_type';
    v_display_name := COALESCE(
        NEW.raw_user_meta_data->>'display_name',
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name', ''
    );
    v_phone := COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, '');
    v_avatar_url := COALESCE(
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'picture', ''
    );

    INSERT INTO public.profiles (user_id, display_name, phone, email, avatar_url, status)
    VALUES (
        NEW.id,
        v_display_name,
        v_phone,
        COALESCE(NEW.email, ''),
        v_avatar_url,
        CASE WHEN v_account_type = 'agency' THEN 'pending'::user_status ELSE 'active'::user_status END
    )
    ON CONFLICT (user_id) DO UPDATE SET
        display_name = CASE WHEN profiles.display_name = '' OR profiles.display_name IS NULL THEN EXCLUDED.display_name ELSE profiles.display_name END,
        avatar_url   = CASE WHEN profiles.avatar_url   = '' OR profiles.avatar_url   IS NULL THEN EXCLUDED.avatar_url   ELSE profiles.avatar_url   END,
        email        = CASE WHEN profiles.email IS NULL OR profiles.email = '' THEN EXCLUDED.email ELSE profiles.email END;

    IF NOT EXISTS (SELECT 1 FROM public.organizations WHERE created_by = NEW.id) THEN
        IF v_account_type = 'agency' THEN
            v_org_name := COALESCE(NEW.raw_user_meta_data->>'agency_name', v_display_name || ' Agency');
            INSERT INTO public.organizations (name, type, created_by, is_personal)
            VALUES (v_org_name, 'agency_team', NEW.id, false)
            RETURNING id INTO v_org_id;
            v_role := 'agent';
        ELSE
            INSERT INTO public.organizations (name, type, created_by, is_personal)
            VALUES (COALESCE(NULLIF(v_display_name, ''), 'Mi Familia'), 'family', NEW.id, true)
            RETURNING id INTO v_org_id;
            v_role := 'owner';
        END IF;

        INSERT INTO public.organization_members (org_id, user_id, role)
        VALUES (v_org_id, NEW.id, v_role);
    END IF;

    RETURN NEW;
END;
$$;