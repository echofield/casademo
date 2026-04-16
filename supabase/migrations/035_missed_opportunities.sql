-- Missed Opportunities: structured capture of missed sales moments

CREATE TABLE IF NOT EXISTS public.missed_opportunities (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  date               DATE        NOT NULL DEFAULT CURRENT_DATE,
  seller_name        TEXT        NOT NULL,
  client_id          UUID        REFERENCES public.clients(id) ON DELETE SET NULL,
  result             TEXT        NOT NULL CHECK (result IN ('Good', 'Missed')),
  missed_type        TEXT        NOT NULL,
  description        TEXT        NOT NULL DEFAULT '',
  cause              TEXT        NOT NULL DEFAULT '',
  impact             TEXT        NOT NULL DEFAULT '',
  recommended_action TEXT        NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_missed_opp_client_id
  ON public.missed_opportunities (client_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_missed_opp_date
  ON public.missed_opportunities (date DESC);

ALTER TABLE public.missed_opportunities ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.missed_opportunities FROM PUBLIC;
GRANT SELECT, INSERT ON TABLE public.missed_opportunities TO authenticated;
GRANT ALL ON TABLE public.missed_opportunities TO service_role;

-- Sellers can read all opportunities (shared learning tool)
DROP POLICY IF EXISTS missed_opp_select ON public.missed_opportunities;
CREATE POLICY missed_opp_select ON public.missed_opportunities
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND active = true
        AND role IN ('seller', 'supervisor')
    )
  );

-- Any active seller/supervisor can insert
DROP POLICY IF EXISTS missed_opp_insert ON public.missed_opportunities;
CREATE POLICY missed_opp_insert ON public.missed_opportunities
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND active = true
        AND role IN ('seller', 'supervisor')
    )
  );
