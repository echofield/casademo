import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const sqlStatements = `
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
`

const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL!.match(/\/\/([^.]+)/)?.[1]
console.log('\n=== Run this SQL in the Supabase Dashboard SQL Editor ===')
console.log(`https://supabase.com/dashboard/project/${projectRef}/sql/new`)
console.log('\n' + sqlStatements)
