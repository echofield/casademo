-- Fix infinite recursion: supervisor policies queried profiles inside profiles RLS.
-- SECURITY DEFINER reads profiles without re-entering RLS.

CREATE OR REPLACE FUNCTION public.is_supervisor()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'supervisor'
  )
$$;

DROP POLICY IF EXISTS profiles_supervisor ON profiles;
CREATE POLICY profiles_supervisor ON profiles FOR ALL USING (
  public.is_supervisor()
);

DROP POLICY IF EXISTS clients_supervisor ON clients;
CREATE POLICY clients_supervisor ON clients FOR ALL USING (
  public.is_supervisor()
);

DROP POLICY IF EXISTS contacts_supervisor ON contacts;
CREATE POLICY contacts_supervisor ON contacts FOR ALL USING (
  public.is_supervisor()
);

DROP POLICY IF EXISTS purchases_supervisor ON purchases;
CREATE POLICY purchases_supervisor ON purchases FOR ALL USING (
  public.is_supervisor()
);

DROP POLICY IF EXISTS interests_supervisor ON client_interests;
CREATE POLICY interests_supervisor ON client_interests FOR ALL USING (
  public.is_supervisor()
);
