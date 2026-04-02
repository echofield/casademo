-- Batch 2 hardening: active-user RLS, SECURITY DEFINER tightening, and view access boundaries

-- -----------------------------------------------------------------------------
-- 1) Access helper functions (fail-closed)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.active = true
  )
$$;

REVOKE ALL ON FUNCTION public.is_active_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_active_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_active_user() TO service_role;

CREATE OR REPLACE FUNCTION public.is_supervisor()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'supervisor'
      AND p.active = true
  )
$$;

REVOKE ALL ON FUNCTION public.is_supervisor() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_supervisor() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_supervisor() TO service_role;

CREATE OR REPLACE FUNCTION public.can_run_notification_generators()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'supervisor'
        AND p.active = true
    )
  )
$$;

REVOKE ALL ON FUNCTION public.can_run_notification_generators() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_run_notification_generators() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_run_notification_generators() TO service_role;

-- -----------------------------------------------------------------------------
-- 2) Core RLS policy hardening for active users
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS profiles_supervisor ON public.profiles;
CREATE POLICY profiles_supervisor ON public.profiles FOR ALL
USING (public.is_supervisor())
WITH CHECK (public.is_supervisor());

DROP POLICY IF EXISTS clients_seller ON public.clients;
CREATE POLICY clients_seller ON public.clients FOR ALL
USING (
  public.is_active_user()
  AND seller_id = auth.uid()
)
WITH CHECK (
  public.is_active_user()
  AND seller_id = auth.uid()
);

DROP POLICY IF EXISTS clients_supervisor ON public.clients;
CREATE POLICY clients_supervisor ON public.clients FOR ALL
USING (public.is_supervisor())
WITH CHECK (public.is_supervisor());

DROP POLICY IF EXISTS contacts_seller ON public.contacts;
CREATE POLICY contacts_seller ON public.contacts FOR ALL
USING (
  public.is_active_user()
  AND seller_id = auth.uid()
)
WITH CHECK (
  public.is_active_user()
  AND seller_id = auth.uid()
);

DROP POLICY IF EXISTS contacts_supervisor ON public.contacts;
CREATE POLICY contacts_supervisor ON public.contacts FOR ALL
USING (public.is_supervisor())
WITH CHECK (public.is_supervisor());

DROP POLICY IF EXISTS purchases_seller ON public.purchases;
CREATE POLICY purchases_seller ON public.purchases FOR ALL
USING (
  public.is_active_user()
  AND seller_id = auth.uid()
)
WITH CHECK (
  public.is_active_user()
  AND seller_id = auth.uid()
);

DROP POLICY IF EXISTS purchases_supervisor ON public.purchases;
CREATE POLICY purchases_supervisor ON public.purchases FOR ALL
USING (public.is_supervisor())
WITH CHECK (public.is_supervisor());

DROP POLICY IF EXISTS interests_seller ON public.client_interests;
CREATE POLICY interests_seller ON public.client_interests FOR ALL
USING (
  public.is_active_user()
  AND EXISTS (
    SELECT 1
    FROM public.clients c
    WHERE c.id = client_interests.client_id
      AND c.seller_id = auth.uid()
  )
)
WITH CHECK (
  public.is_active_user()
  AND EXISTS (
    SELECT 1
    FROM public.clients c
    WHERE c.id = client_interests.client_id
      AND c.seller_id = auth.uid()
  )
);

DROP POLICY IF EXISTS interests_supervisor ON public.client_interests;
CREATE POLICY interests_supervisor ON public.client_interests FOR ALL
USING (public.is_supervisor())
WITH CHECK (public.is_supervisor());

-- Notifications
DROP POLICY IF EXISTS notifications_own ON public.notifications;
DROP POLICY IF EXISTS notifications_select_own ON public.notifications;
DROP POLICY IF EXISTS notifications_update_own ON public.notifications;
DROP POLICY IF EXISTS notifications_delete_own ON public.notifications;
DROP POLICY IF EXISTS notifications_insert ON public.notifications;

CREATE POLICY notifications_select_own ON public.notifications
FOR SELECT USING (
  public.is_active_user()
  AND user_id = auth.uid()
);

CREATE POLICY notifications_update_own ON public.notifications
FOR UPDATE USING (
  public.is_active_user()
  AND user_id = auth.uid()
)
WITH CHECK (
  public.is_active_user()
  AND user_id = auth.uid()
);

CREATE POLICY notifications_delete_own ON public.notifications
FOR DELETE USING (
  public.is_active_user()
  AND user_id = auth.uid()
);

CREATE POLICY notifications_insert ON public.notifications
FOR INSERT WITH CHECK (
  (
    public.is_active_user()
    AND user_id = auth.uid()
  )
  OR (
    public.is_supervisor()
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = user_id
        AND p.active = true
    )
  )
);

-- Client sizing
DROP POLICY IF EXISTS "Users can view sizing for accessible clients" ON public.client_sizing;
DROP POLICY IF EXISTS "Users can manage sizing for own clients" ON public.client_sizing;

CREATE POLICY "Users can view sizing for accessible clients"
  ON public.client_sizing FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.clients c
      WHERE c.id = client_sizing.client_id
        AND (
          (public.is_active_user() AND c.seller_id = auth.uid())
          OR public.is_supervisor()
        )
    )
  );

CREATE POLICY "Users can manage sizing for own clients"
  ON public.client_sizing FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.clients c
      WHERE c.id = client_sizing.client_id
        AND (
          (public.is_active_user() AND c.seller_id = auth.uid())
          OR public.is_supervisor()
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.clients c
      WHERE c.id = client_sizing.client_id
        AND (
          (public.is_active_user() AND c.seller_id = auth.uid())
          OR public.is_supervisor()
        )
    )
  );

-- Visits
DROP POLICY IF EXISTS "Users can view visits for accessible clients" ON public.visits;
DROP POLICY IF EXISTS "Users can create visits for own clients" ON public.visits;
DROP POLICY IF EXISTS "Users can update own visits" ON public.visits;

CREATE POLICY "Users can view visits for accessible clients"
  ON public.visits FOR SELECT
  USING (
    (
      public.is_active_user()
      AND seller_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.clients c
      WHERE c.id = visits.client_id
        AND (
          (public.is_active_user() AND c.seller_id = auth.uid())
          OR public.is_supervisor()
        )
    )
  );

CREATE POLICY "Users can create visits for own clients"
  ON public.visits FOR INSERT
  WITH CHECK (
    (
      public.is_active_user()
      AND seller_id = auth.uid()
    )
    OR public.is_supervisor()
  );

CREATE POLICY "Users can update own visits"
  ON public.visits FOR UPDATE
  USING (
    public.is_active_user()
    AND seller_id = auth.uid()
  )
  WITH CHECK (
    public.is_active_user()
    AND seller_id = auth.uid()
  );

-- Meetings
DROP POLICY IF EXISTS "meetings_select_policy" ON public.meetings;
DROP POLICY IF EXISTS "meetings_insert_policy" ON public.meetings;
DROP POLICY IF EXISTS "meetings_update_policy" ON public.meetings;
DROP POLICY IF EXISTS "meetings_delete_policy" ON public.meetings;

CREATE POLICY "meetings_select_policy" ON public.meetings
  FOR SELECT USING (
    (public.is_active_user() AND seller_id = auth.uid())
    OR public.is_supervisor()
  );

CREATE POLICY "meetings_insert_policy" ON public.meetings
  FOR INSERT WITH CHECK (
    (public.is_active_user() AND seller_id = auth.uid())
    OR public.is_supervisor()
  );

CREATE POLICY "meetings_update_policy" ON public.meetings
  FOR UPDATE USING (
    (public.is_active_user() AND seller_id = auth.uid())
    OR public.is_supervisor()
  )
  WITH CHECK (
    (public.is_active_user() AND seller_id = auth.uid())
    OR public.is_supervisor()
  );

CREATE POLICY "meetings_delete_policy" ON public.meetings
  FOR DELETE USING (
    (public.is_active_user() AND seller_id = auth.uid())
    OR public.is_supervisor()
  );

-- Brand affinity
DROP POLICY IF EXISTS brand_affinity_seller ON public.client_brand_affinity;
DROP POLICY IF EXISTS brand_affinity_supervisor ON public.client_brand_affinity;

CREATE POLICY brand_affinity_seller ON public.client_brand_affinity FOR ALL
USING (
  public.is_active_user()
  AND EXISTS (
    SELECT 1
    FROM public.clients c
    WHERE c.id = client_brand_affinity.client_id
      AND c.seller_id = auth.uid()
  )
)
WITH CHECK (
  public.is_active_user()
  AND EXISTS (
    SELECT 1
    FROM public.clients c
    WHERE c.id = client_brand_affinity.client_id
      AND c.seller_id = auth.uid()
  )
);

CREATE POLICY brand_affinity_supervisor ON public.client_brand_affinity FOR ALL
USING (public.is_supervisor())
WITH CHECK (public.is_supervisor());

-- -----------------------------------------------------------------------------
-- 3) SECURITY DEFINER hardening
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.send_notification(
  p_user_id UUID,
  p_type notification_type,
  p_title TEXT,
  p_message TEXT DEFAULT NULL,
  p_client_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id UUID;
  v_actor_id UUID;
  v_is_supervisor BOOLEAN := false;
BEGIN
  v_actor_id := auth.uid();

  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT (p.role = 'supervisor' AND p.active = true)
  INTO v_is_supervisor
  FROM public.profiles p
  WHERE p.id = v_actor_id;

  v_is_supervisor := COALESCE(v_is_supervisor, false);

  IF NOT v_is_supervisor AND p_user_id <> v_actor_id THEN
    RAISE EXCEPTION 'Only supervisors can send notifications to other users';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles target
    WHERE target.id = p_user_id
      AND target.active = true
  ) THEN
    RAISE EXCEPTION 'Target user does not exist or is inactive';
  END IF;

  INSERT INTO public.notifications (user_id, type, title, message, client_id)
  VALUES (p_user_id, p_type, p_title, p_message, p_client_id)
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

REVOKE ALL ON FUNCTION public.send_notification(UUID, notification_type, TEXT, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.send_notification(UUID, notification_type, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_notification(UUID, notification_type, TEXT, TEXT, UUID) TO service_role;

CREATE OR REPLACE FUNCTION public.generate_overdue_notifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notified_count INTEGER := 0;
  client_rec RECORD;
BEGIN
  IF NOT public.can_run_notification_generators() THEN
    RAISE EXCEPTION 'Insufficient privileges to generate notifications';
  END IF;

  FOR client_rec IN
    SELECT
      c.id AS client_id,
      c.seller_id,
      c.first_name || ' ' || c.last_name AS client_name,
      (CURRENT_DATE - c.next_recontact_date) AS days_overdue
    FROM public.clients c
    WHERE c.next_recontact_date < CURRENT_DATE - INTERVAL '3 days'
      AND NOT EXISTS (
        SELECT 1
        FROM public.notifications n
        WHERE n.client_id = c.id
          AND n.type = 'client_overdue'
          AND n.created_at > now() - INTERVAL '3 days'
      )
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, client_id)
    VALUES (
      client_rec.seller_id,
      'client_overdue',
      client_rec.client_name || ' is ' || client_rec.days_overdue || ' days overdue',
      'Please recontact soon',
      client_rec.client_id
    );
    notified_count := notified_count + 1;
  END LOOP;

  RETURN notified_count;
END;
$$;

REVOKE ALL ON FUNCTION public.generate_overdue_notifications() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_overdue_notifications() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_overdue_notifications() TO service_role;

CREATE OR REPLACE FUNCTION public.generate_seller_inactivity_alerts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notified_count INTEGER := 0;
  seller_rec RECORD;
  supervisor_rec RECORD;
BEGIN
  IF NOT public.can_run_notification_generators() THEN
    RAISE EXCEPTION 'Insufficient privileges to generate notifications';
  END IF;

  FOR seller_rec IN
    SELECT
      p.id AS seller_id,
      p.full_name,
      COALESCE(
        (SELECT MAX(contact_date)::DATE FROM public.contacts WHERE seller_id = p.id),
        p.created_at::DATE
      ) AS last_contact,
      (SELECT COUNT(*) FROM public.clients WHERE seller_id = p.id AND next_recontact_date <= CURRENT_DATE) AS overdue_count
    FROM public.profiles p
    WHERE p.role = 'seller'
      AND p.active = true
      AND NOT EXISTS (
        SELECT 1
        FROM public.contacts c
        WHERE c.seller_id = p.id
          AND c.contact_date > now() - INTERVAL '3 days'
      )
      AND NOT EXISTS (
        SELECT 1
        FROM public.notifications n
        WHERE n.type = 'seller_inactive'
          AND n.message LIKE '%' || p.full_name || '%'
          AND n.created_at > now() - INTERVAL '1 day'
      )
  LOOP
    FOR supervisor_rec IN
      SELECT id
      FROM public.profiles
      WHERE role = 'supervisor'
        AND active = true
    LOOP
      INSERT INTO public.notifications (user_id, type, title, message)
      VALUES (
        supervisor_rec.id,
        'seller_inactive',
        seller_rec.full_name || ' - No activity in 3+ days',
        seller_rec.overdue_count || ' clients overdue'
      );
      notified_count := notified_count + 1;
    END LOOP;
  END LOOP;

  RETURN notified_count;
END;
$$;

REVOKE ALL ON FUNCTION public.generate_seller_inactivity_alerts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_seller_inactivity_alerts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_seller_inactivity_alerts() TO service_role;

CREATE OR REPLACE FUNCTION public.generate_birthday_follow_up_notifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notified_count INTEGER := 0;
  today_paris DATE := (now() AT TIME ZONE 'Europe/Paris')::date;
  current_year INT := EXTRACT(YEAR FROM (now() AT TIME ZONE 'Europe/Paris'))::INT;
BEGIN
  IF NOT public.can_run_notification_generators() THEN
    RAISE EXCEPTION 'Insufficient privileges to generate notifications';
  END IF;

  INSERT INTO public.notifications (user_id, type, title, message, client_id, due_at, event_key)
  SELECT
    c.seller_id,
    'birthday_follow_up',
    CASE
      WHEN c.tier IN ('idealiste', 'diplomatico', 'grand_prix') THEN 'Prepare for client birthday'
      ELSE 'Client birthday today'
    END,
    CASE
      WHEN c.tier IN ('idealiste', 'diplomatico', 'grand_prix') THEN 'Birthday in one month'
      ELSE 'Birthday today'
    END,
    c.id,
    now(),
    'birthday_follow_up:' || c.id::text || ':' || EXTRACT(YEAR FROM c.upcoming_birthday)::INT::text
  FROM (
    SELECT
      cl.id,
      cl.seller_id,
      cl.tier,
      birthday_for_year(
        cl.birthday,
        CASE
          WHEN birthday_for_year(cl.birthday, current_year) < today_paris
            THEN current_year + 1
          ELSE current_year
        END
      ) AS upcoming_birthday
    FROM public.clients cl
    JOIN public.profiles p ON p.id = cl.seller_id
    WHERE cl.birthday IS NOT NULL
      AND p.role = 'seller'
      AND p.active = true
  ) c
  WHERE (
    CASE
      WHEN c.tier IN ('idealiste', 'diplomatico', 'grand_prix')
        THEN (c.upcoming_birthday - INTERVAL '1 month')::DATE
      ELSE c.upcoming_birthday
    END
  ) = today_paris
  ON CONFLICT (event_key) DO NOTHING;

  GET DIAGNOSTICS notified_count = ROW_COUNT;
  RETURN notified_count;
END;
$$;

REVOKE ALL ON FUNCTION public.generate_birthday_follow_up_notifications() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_birthday_follow_up_notifications() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_birthday_follow_up_notifications() TO service_role;

-- -----------------------------------------------------------------------------
-- 4) Secure view access boundaries (invoker semantics)
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_views
    WHERE schemaname = 'public'
      AND viewname = 'recontact_queue'
  ) THEN
    EXECUTE 'ALTER VIEW public.recontact_queue SET (security_invoker = true)';
  END IF;
EXCEPTION
  WHEN undefined_object OR feature_not_supported THEN
    NULL;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_views
    WHERE schemaname = 'public'
      AND viewname = 'client_360'
  ) THEN
    EXECUTE 'ALTER VIEW public.client_360 SET (security_invoker = true)';
  END IF;
EXCEPTION
  WHEN undefined_object OR feature_not_supported THEN
    NULL;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_views
    WHERE schemaname = 'public'
      AND viewname = 'notification_counts'
  ) THEN
    EXECUTE 'ALTER VIEW public.notification_counts SET (security_invoker = true)';
  END IF;
EXCEPTION
  WHEN undefined_object OR feature_not_supported THEN
    NULL;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_views
    WHERE schemaname = 'public'
      AND viewname = 'recontact_queue_smart'
  ) THEN
    EXECUTE 'ALTER VIEW public.recontact_queue_smart SET (security_invoker = true)';
  END IF;
EXCEPTION
  WHEN undefined_object OR feature_not_supported THEN
    NULL;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_views
    WHERE schemaname = 'public'
      AND viewname = 'upcoming_interest_events'
  ) THEN
    EXECUTE 'ALTER VIEW public.upcoming_interest_events SET (security_invoker = true)';
  END IF;
EXCEPTION
  WHEN undefined_object OR feature_not_supported THEN
    NULL;
END;
$$;
